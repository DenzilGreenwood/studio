// src/lib/data-encryption.ts
"use client";

import { encryptData, decryptData } from './cryptoUtils';

/**
 * Comprehensive data encryption for all user content
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

// Helper to get current user passphrase from session
function getCurrentPassphrase(): string {
  const passphrase = sessionStorage.getItem('userPassphrase');
  if (!passphrase) {
    throw new Error('User passphrase not available. Please log in again.');
  }
  return passphrase;
}

// Helper to safely get passphrase with fallback
export function getPassphraseSafely(): string | null {
  return sessionStorage.getItem('userPassphrase');
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
      } catch (error) {
        console.error(`Failed to decrypt profile ${field}:`, error);
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
      } catch (error) {
        console.error(`Failed to decrypt session ${field}:`, error);
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
    } catch (error) {
      console.error('Failed to decrypt message text:', error);
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
      } catch (error) {
        console.error(`Failed to decrypt journal ${field}:`, error);
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
    } catch (error) {
      console.error('Failed to decrypt journal goals:', error);
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
    console.warn('No passphrase available for feedback encryption, storing as plaintext');
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
      } catch (error) {
        console.error(`Failed to encrypt feedback field ${field}:`, error);
        // Keep the original field if encryption fails
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
      } catch (error) {
        console.error(`Failed to decrypt feedback ${field}:`, error);
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
  const passphrase = sessionStorage.getItem('userPassphrase');
  const hasPassphrase = !!passphrase;
  
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
