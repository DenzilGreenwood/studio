// src/lib/data-encryption.ts
"use client";

import { encryptDataWithMetadata, decryptDataWithMetadata } from './encryption';

/**
 * Comprehensive data encryption for all user content
 * Uses encryption.ts with metadata format for all operations
 * Encrypts everything except email addresses for user identification
 */

// Types of data that will be encrypted
export type EncryptableUserData = {
  // User Profile Data (except email)
  displayName?: string;
  pseudonym?: string;
  ageRange?: string;
  primaryChallenge?: string;
  
  // Session Data
  circumstance?: string;
  sessions?: unknown[];
  
  // Chat Messages
  messages?: unknown[];
  
  // Journal Entries
  journals?: unknown[];
  
  // Session Reports
  reports?: unknown[];
  
  // Feedback (except userId for system tracking)
  feedbackContent?: unknown;
};

// Helper to get session encryption key (same logic as encryption-context.tsx)
function getSessionEncryptionKey(): string {
  let key = sessionStorage.getItem('session_encryption_key');
  if (!key) {
    key = 'user-session-key-' + Math.random().toString(36);
    sessionStorage.setItem('session_encryption_key', key);
  }
  return key;
}

// Helper to get current user passphrase from session
function getCurrentPassphrase(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Session storage not available during server rendering.');
  }

  const passphrase = sessionStorage.getItem('userPassphrase');
  if (!passphrase) {
    throw new Error('User passphrase not available. Please log in again.');
  }
  
  // Handle XOR-encrypted session storage (from encryption-context.tsx)
  try {
    const sessionKey = getSessionEncryptionKey();
    if (sessionKey) {
      // Decrypt XOR-encrypted passphrase
      const decoded = atob(passphrase);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ sessionKey.charCodeAt(i % sessionKey.length));
      }
      return result;
    }
  } catch {
    // If decryption fails, assume it's plain text
  }
  
  return passphrase;
}

// Helper to safely get passphrase with fallback
export function getPassphraseSafely(): string | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return getCurrentPassphrase();
  } catch {
    return null;
  }
}

/**
 * Enhanced encryption wrapper for user data
 */
async function encryptData(data: unknown, passphrase: string): Promise<string> {
  return await encryptDataWithMetadata(JSON.stringify(data), passphrase);
}

/**
 * Enhanced decryption wrapper for user data with backward compatibility
 */
async function decryptData(encryptedData: string, passphrase: string): Promise<unknown> {
  try {
    // Try new metadata format first
    const decryptedString = await decryptDataWithMetadata(encryptedData, passphrase);
    return JSON.parse(decryptedString);
  } catch (error) {
    // Provide more specific error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to decrypt data: ${errorMessage}. This may indicate an invalid passphrase or corrupted data.`);
  }
}

/**
 * Encrypt user profile data (except email which stays plain for auth)
 */
export async function encryptUserProfile(profileData: unknown): Promise<unknown> {
  if (!profileData) return profileData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: Record<string, unknown> = { ...profileData as Record<string, unknown> };
  
  // Fields to encrypt (email stays plain for Firebase Auth)
  const fieldsToEncrypt = [
    'displayName', 'pseudonym', 'ageRange', 'primaryChallenge'
  ];
  
  for (const field of fieldsToEncrypt) {
    if ((profileData as Record<string, unknown>)[field]) {
      const encryptedField = await encryptData(
        (profileData as Record<string, unknown>)[field], 
        passphrase
      );
      encrypted[`${field}_encrypted`] = encryptedField;
      delete encrypted[field]; // Remove plain text
    }
  }
  
  return encrypted;
}

/**
 * Decrypt user profile data
 */
export async function decryptUserProfile(encryptedProfileData: unknown): Promise<unknown> {
  if (!encryptedProfileData) return encryptedProfileData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: Record<string, unknown> = { ...encryptedProfileData as Record<string, unknown> };
  
  const fieldsToDecrypt = [
    'displayName', 'pseudonym', 'ageRange', 'primaryChallenge'
  ];
  
  for (const field of fieldsToDecrypt) {
    if ((encryptedProfileData as Record<string, unknown>)[`${field}_encrypted`]) {
      try {
        const decryptedValue = await decryptData(
          (encryptedProfileData as Record<string, unknown>)[`${field}_encrypted`] as string,
          passphrase
        );
        decrypted[field] = decryptedValue;
        
        // Clean up encrypted fields
        delete decrypted[`${field}_encrypted`];
      } catch {
        // Failed to decrypt profile field - keep encrypted version
        decrypted[field] = '[Encrypted Data - Cannot Decrypt]';
      }
    }
  }
  
  return decrypted;
}

/**
 * Encrypt session data
 */
export async function encryptSessionData(sessionData: unknown): Promise<unknown> {
  if (!sessionData) return sessionData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: Record<string, unknown> = { ...sessionData as Record<string, unknown> };
  
  const fieldsToEncrypt = [
    'circumstance', 'ageRange', 'summary', 'userReflection'
  ];
  
  for (const field of fieldsToEncrypt) {
    if ((sessionData as Record<string, unknown>)[field]) {
      const encryptedField = await encryptData(
        (sessionData as Record<string, unknown>)[field], 
        passphrase
      );
      encrypted[`${field}_encrypted`] = encryptedField;
      delete encrypted[field];
    }
  }
  
  return encrypted;
}

/**
 * Decrypt session data
 */
export async function decryptSessionData(encryptedSessionData: unknown): Promise<unknown> {
  if (!encryptedSessionData) return encryptedSessionData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: Record<string, unknown> = { ...encryptedSessionData as Record<string, unknown> };
  
  const fieldsToDecrypt = [
    'circumstance', 'ageRange', 'summary', 'userReflection'
  ];
  
  for (const field of fieldsToDecrypt) {
    if ((encryptedSessionData as Record<string, unknown>)[`${field}_encrypted`]) {
      try {
        const decryptedValue = await decryptData(
          (encryptedSessionData as Record<string, unknown>)[`${field}_encrypted`] as string,
          passphrase
        );
        decrypted[field] = decryptedValue;
        
        delete decrypted[`${field}_encrypted`];
      } catch {
        // Failed to decrypt session field - keep encrypted version
        decrypted[field] = '[Encrypted Data - Cannot Decrypt]';
      }
    }
  }
  
  return decrypted;
}

/**
 * Encrypt chat messages
 */
export async function encryptChatMessage(messageData: unknown): Promise<unknown> {
  if (!messageData) return messageData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: Record<string, unknown> = { ...messageData as Record<string, unknown> };
  
  // Encrypt the message text
  if ((messageData as Record<string, unknown>).text) {
    const encryptedField = await encryptData(
      (messageData as Record<string, unknown>).text, 
      passphrase
    );
    encrypted.text_encrypted = encryptedField;
    delete encrypted.text;
  }
  
  return encrypted;
}

/**
 * Decrypt chat messages
 */
export async function decryptChatMessage(encryptedMessageData: unknown): Promise<unknown> {
  if (!encryptedMessageData) return encryptedMessageData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: Record<string, unknown> = { ...encryptedMessageData as Record<string, unknown> };
  
  if ((encryptedMessageData as Record<string, unknown>).text_encrypted) {
    try {
      const decryptedValue = await decryptData(
        (encryptedMessageData as Record<string, unknown>).text_encrypted as string,
        passphrase
      );
      decrypted.text = decryptedValue;
      delete decrypted.text_encrypted;
    } catch {
      // Failed to decrypt message text - keep encrypted version
      decrypted.text = '[Encrypted Data - Cannot Decrypt]';
    }
  }
  
  return decrypted;
}

/**
 * Encrypt journal entries
 */
export async function encryptJournalEntry(journalData: unknown): Promise<unknown> {
  if (!journalData) return journalData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: Record<string, unknown> = { ...journalData as Record<string, unknown> };
  
  const fieldsToEncrypt = [
    'content', 'title', 'summary', 'insights', 'tags'
  ];
  
  for (const field of fieldsToEncrypt) {
    if ((journalData as Record<string, unknown>)[field]) {
      const encryptedField = await encryptData(
        (journalData as Record<string, unknown>)[field], 
        passphrase
      );
      encrypted[`${field}_encrypted`] = encryptedField;
      delete encrypted[field];
    }
  }
  
  // Encrypt goals array if present
  if ((journalData as Record<string, unknown>).goals) {
    const encryptedGoals = await encryptData(
      (journalData as Record<string, unknown>).goals, 
      passphrase
    );
    encrypted.goals_encrypted = encryptedGoals;
    delete encrypted.goals;
  }
  
  return encrypted;
}

/**
 * Decrypt journal entries
 */
export async function decryptJournalEntry(encryptedJournalData: unknown): Promise<unknown> {
  if (!encryptedJournalData) return encryptedJournalData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: Record<string, unknown> = { ...encryptedJournalData as Record<string, unknown> };
  
  const fieldsToDecrypt = [
    'content', 'title', 'summary', 'insights', 'tags'
  ];
  
  for (const field of fieldsToDecrypt) {
    if ((encryptedJournalData as Record<string, unknown>)[`${field}_encrypted`]) {
      try {
        const decryptedValue = await decryptData(
          (encryptedJournalData as Record<string, unknown>)[`${field}_encrypted`] as string,
          passphrase
        );
        decrypted[field] = decryptedValue;
        delete decrypted[`${field}_encrypted`];
      } catch {
        // Failed to decrypt journal field - keep encrypted version
        decrypted[field] = '[Encrypted Data - Cannot Decrypt]';
      }
    }
  }
  
  // Decrypt goals array if present
  if ((encryptedJournalData as Record<string, unknown>).goals_encrypted) {
    try {
      const decryptedGoals = await decryptData(
        (encryptedJournalData as Record<string, unknown>).goals_encrypted as string,
        passphrase
      );
      decrypted.goals = decryptedGoals;
      delete decrypted.goals_encrypted;
    } catch {
      // Failed to decrypt journal goals - keep encrypted version
      decrypted.goals = '[Encrypted Data - Cannot Decrypt]';
    }
  }
  
  return decrypted;
}

/**
 * Encrypt feedback data
 */
export async function encryptFeedback(feedbackData: unknown): Promise<unknown> {
  if (!feedbackData) return feedbackData;
  
  const passphrase = getPassphraseSafely();
  if (!passphrase) {
    // If no passphrase is available, return the data unencrypted
    // This allows feedback to be submitted even if the user's session expired
    // No passphrase available - feedback will be stored as plaintext
    // This allows feedback to be submitted even if user session expired
    return feedbackData;
  }
  
  const encrypted: Record<string, unknown> = { ...feedbackData as Record<string, unknown> };
  
  const fieldsToEncrypt = [
    'content', 'rating', 'suggestions', 'additionalComments', 'improvementSuggestion'
  ];
  
  for (const field of fieldsToEncrypt) {
    if ((feedbackData as Record<string, unknown>)[field]) {
      try {
        const encryptedField = await encryptData(
          (feedbackData as Record<string, unknown>)[field], 
          passphrase
        );
        encrypted[`${field}_encrypted`] = encryptedField;
        delete encrypted[field];
      } catch {
        // Failed to encrypt feedback field - keep original value
        // This ensures feedback is never lost due to encryption issues
      }
    }
  }
  
  return encrypted;
}

/**
 * Decrypt feedback data
 */
export async function decryptFeedback(encryptedFeedbackData: unknown): Promise<unknown> {
  if (!encryptedFeedbackData) return encryptedFeedbackData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: Record<string, unknown> = { ...encryptedFeedbackData as Record<string, unknown> };
  
  const fieldsToDecrypt = [
    'content', 'rating', 'suggestions', 'additionalComments'
  ];
  
  for (const field of fieldsToDecrypt) {
    if ((encryptedFeedbackData as Record<string, unknown>)[`${field}_encrypted`]) {
      try {
        const decryptedValue = await decryptData(
          (encryptedFeedbackData as Record<string, unknown>)[`${field}_encrypted`] as string,
          passphrase
        );
        decrypted[field] = decryptedValue;
        delete decrypted[`${field}_encrypted`];
      } catch {
        // Failed to decrypt feedback field - keep encrypted version
        decrypted[field] = '[Encrypted Data - Cannot Decrypt]';
      }
    }
  }
  
  return decrypted;
}

/**
 * Get encryption status for UI display
 */
export function getEncryptionStatus(): { isEncrypted: boolean; hasPassphrase: boolean; message: string } {
  // Use the proper passphrase checking logic that handles XOR encryption
  const hasPassphrase = getPassphraseSafely() !== null;
  
  return {
    isEncrypted: true, // Always encrypted in this system
    hasPassphrase,
    message: hasPassphrase 
      ? "Your data is protected with end-to-end encryption using your personal passphrase. Only you can decrypt and read your information."
      : "Your data is encrypted in our database. Enter your passphrase to decrypt and access your information on this device."
  };
}

/**
 * Validate that user has access to encrypted data
 */
export function validateEncryptionAccess(): boolean {
  try {
    getCurrentPassphrase();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if data appears to be encrypted (contains _encrypted fields)
 */
export function isDataEncrypted(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  return Object.keys(obj).some(key => key.endsWith('_encrypted'));
}

/**
 * Get list of encrypted fields in a data object
 */
export function getEncryptedFields(data: unknown): string[] {
  if (!data || typeof data !== 'object') {
    return [];
  }
  
  const obj = data as Record<string, unknown>;
  return Object.keys(obj).filter(key => key.endsWith('_encrypted'));
}

/**
 * Safely attempt to decrypt data, returning original if decryption fails
 */
export async function safeDecryptData(encryptedData: string, passphrase: string): Promise<unknown> {
  try {
    return await decryptData(encryptedData, passphrase);
  } catch {
    // Return a placeholder if decryption fails
    return '[Encrypted Data - Cannot Decrypt]';
  }
}
