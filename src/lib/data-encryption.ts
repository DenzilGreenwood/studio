// src/lib/data-encryption.ts
"use client";

import { encryptData, decryptData } from './encryption';

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
  sessions?: any[];
  
  // Chat Messages
  messages?: any[];
  
  // Journal Entries
  journals?: any[];
  
  // Session Reports
  reports?: any[];
  
  // Feedback (except userId for system tracking)
  feedbackContent?: any;
};

// Helper to get current user passphrase from session
function getCurrentPassphrase(): string {
  const passphrase = sessionStorage.getItem('userPassphrase');
  if (!passphrase) {
    throw new Error('User passphrase not available. Please log in again.');
  }
  return passphrase;
}

/**
 * Encrypt user profile data (except email which stays plain for auth)
 */
export async function encryptUserProfile(profileData: any): Promise<any> {
  if (!profileData) return profileData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: any = { ...profileData };
  
  // Fields to encrypt (email stays plain for Firebase Auth)
  const fieldsToEncrypt = [
    'displayName', 'pseudonym', 'ageRange', 'primaryChallenge'
  ];
  
  for (const field of fieldsToEncrypt) {
    if (profileData[field]) {
      const encryptedField = await encryptData(
        JSON.stringify(profileData[field]), 
        passphrase
      );
      encrypted[`${field}_encrypted`] = encryptedField.encryptedData;
      encrypted[`${field}_salt`] = encryptedField.salt;
      encrypted[`${field}_iv`] = encryptedField.iv;
      delete encrypted[field]; // Remove plain text
    }
  }
  
  return encrypted;
}

/**
 * Decrypt user profile data
 */
export async function decryptUserProfile(encryptedProfileData: any): Promise<any> {
  if (!encryptedProfileData) return encryptedProfileData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: any = { ...encryptedProfileData };
  
  const fieldsToDecrypt = [
    'displayName', 'pseudonym', 'ageRange', 'primaryChallenge'
  ];
  
  for (const field of fieldsToDecrypt) {
    if (encryptedProfileData[`${field}_encrypted`]) {
      try {
        const decryptedValue = await decryptData(
          encryptedProfileData[`${field}_encrypted`],
          passphrase,
          encryptedProfileData[`${field}_salt`],
          encryptedProfileData[`${field}_iv`]
        );
        decrypted[field] = JSON.parse(decryptedValue);
        
        // Clean up encrypted fields
        delete decrypted[`${field}_encrypted`];
        delete decrypted[`${field}_salt`];
        delete decrypted[`${field}_iv`];
      } catch (error) {
        console.error(`Failed to decrypt ${field}:`, error);
        decrypted[field] = '[Encrypted Data - Cannot Decrypt]';
      }
    }
  }
  
  return decrypted;
}

/**
 * Encrypt session data including circumstance and summary
 */
export async function encryptSessionData(sessionData: any): Promise<any> {
  if (!sessionData) return sessionData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: any = { ...sessionData };
  
  // Fields to encrypt
  const fieldsToEncrypt = [
    'circumstance', 'ageRange', 'summary', 'userReflection'
  ];
  
  for (const field of fieldsToEncrypt) {
    if (sessionData[field]) {
      const encryptedField = await encryptData(
        JSON.stringify(sessionData[field]), 
        passphrase
      );
      encrypted[`${field}_encrypted`] = encryptedField.encryptedData;
      encrypted[`${field}_salt`] = encryptedField.salt;
      encrypted[`${field}_iv`] = encryptedField.iv;
      delete encrypted[field];
    }
  }
  
  return encrypted;
}

/**
 * Decrypt session data
 */
export async function decryptSessionData(encryptedSessionData: any): Promise<any> {
  if (!encryptedSessionData) return encryptedSessionData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: any = { ...encryptedSessionData };
  
  const fieldsToDecrypt = [
    'circumstance', 'ageRange', 'summary', 'userReflection'
  ];
  
  for (const field of fieldsToDecrypt) {
    if (encryptedSessionData[`${field}_encrypted`]) {
      try {
        const decryptedValue = await decryptData(
          encryptedSessionData[`${field}_encrypted`],
          passphrase,
          encryptedSessionData[`${field}_salt`],
          encryptedSessionData[`${field}_iv`]
        );
        decrypted[field] = JSON.parse(decryptedValue);
        
        delete decrypted[`${field}_encrypted`];
        delete decrypted[`${field}_salt`];
        delete decrypted[`${field}_iv`];
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
export async function encryptChatMessage(messageData: any): Promise<any> {
  if (!messageData) return messageData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: any = { ...messageData };
  
  // Encrypt the message text
  if (messageData.text) {
    const encryptedField = await encryptData(messageData.text, passphrase);
    encrypted.text_encrypted = encryptedField.encryptedData;
    encrypted.text_salt = encryptedField.salt;
    encrypted.text_iv = encryptedField.iv;
    delete encrypted.text;
  }
  
  return encrypted;
}

/**
 * Decrypt chat messages
 */
export async function decryptChatMessage(encryptedMessageData: any): Promise<any> {
  if (!encryptedMessageData) return encryptedMessageData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: any = { ...encryptedMessageData };
  
  if (encryptedMessageData.text_encrypted) {
    try {
      const decryptedText = await decryptData(
        encryptedMessageData.text_encrypted,
        passphrase,
        encryptedMessageData.text_salt,
        encryptedMessageData.text_iv
      );
      decrypted.text = decryptedText;
      
      delete decrypted.text_encrypted;
      delete decrypted.text_salt;
      delete decrypted.text_iv;
    } catch (error) {
      console.error('Failed to decrypt message text:', error);
      decrypted.text = '[Encrypted Message - Cannot Decrypt]';
    }
  }
  
  return decrypted;
}

/**
 * Encrypt journal entries
 */
export async function encryptJournalEntry(journalData: any): Promise<any> {
  if (!journalData) return journalData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: any = { ...journalData };
  
  // Fields to encrypt in journal entries
  const fieldsToEncrypt = ['userReflection'];
  
  for (const field of fieldsToEncrypt) {
    if (journalData[field]) {
      const encryptedField = await encryptData(
        JSON.stringify(journalData[field]), 
        passphrase
      );
      encrypted[`${field}_encrypted`] = encryptedField.encryptedData;
      encrypted[`${field}_salt`] = encryptedField.salt;
      encrypted[`${field}_iv`] = encryptedField.iv;
      delete encrypted[field];
    }
  }

  // Encrypt goals if they exist
  if (journalData.goals && Array.isArray(journalData.goals)) {
    const encryptedGoals = await encryptData(
      JSON.stringify(journalData.goals), 
      passphrase
    );
    encrypted.goals_encrypted = encryptedGoals.encryptedData;
    encrypted.goals_salt = encryptedGoals.salt;
    encrypted.goals_iv = encryptedGoals.iv;
    delete encrypted.goals;
  }

  // Encrypt quick reflections if they exist
  if (journalData.quickReflections && Array.isArray(journalData.quickReflections)) {
    const encryptedReflections = await encryptData(
      JSON.stringify(journalData.quickReflections), 
      passphrase
    );
    encrypted.quickReflections_encrypted = encryptedReflections.encryptedData;
    encrypted.quickReflections_salt = encryptedReflections.salt;
    encrypted.quickReflections_iv = encryptedReflections.iv;
    delete encrypted.quickReflections;
  }

  // Encrypt AI journal support content if it exists
  if (journalData.aiJournalSupport) {
    const encryptedSupport = await encryptData(
      JSON.stringify(journalData.aiJournalSupport), 
      passphrase
    );
    encrypted.aiJournalSupport_encrypted = encryptedSupport.encryptedData;
    encrypted.aiJournalSupport_salt = encryptedSupport.salt;
    encrypted.aiJournalSupport_iv = encryptedSupport.iv;
    delete encrypted.aiJournalSupport;
  }
  
  return encrypted;
}

/**
 * Decrypt journal entries
 */
export async function decryptJournalEntry(encryptedJournalData: any): Promise<any> {
  if (!encryptedJournalData) return encryptedJournalData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: any = { ...encryptedJournalData };
  
  // Decrypt userReflection
  if (encryptedJournalData.userReflection_encrypted) {
    try {
      const decryptedValue = await decryptData(
        encryptedJournalData.userReflection_encrypted,
        passphrase,
        encryptedJournalData.userReflection_salt,
        encryptedJournalData.userReflection_iv
      );
      decrypted.userReflection = JSON.parse(decryptedValue);
      
      delete decrypted.userReflection_encrypted;
      delete decrypted.userReflection_salt;
      delete decrypted.userReflection_iv;
    } catch (error) {
      console.error('Failed to decrypt journal userReflection:', error);
      decrypted.userReflection = '[Encrypted Data - Cannot Decrypt]';
    }
  }

  // Decrypt goals
  if (encryptedJournalData.goals_encrypted) {
    try {
      const decryptedValue = await decryptData(
        encryptedJournalData.goals_encrypted,
        passphrase,
        encryptedJournalData.goals_salt,
        encryptedJournalData.goals_iv
      );
      decrypted.goals = JSON.parse(decryptedValue);
      
      delete decrypted.goals_encrypted;
      delete decrypted.goals_salt;
      delete decrypted.goals_iv;
    } catch (error) {
      console.error('Failed to decrypt journal goals:', error);
      decrypted.goals = [];
    }
  }

  // Decrypt quick reflections
  if (encryptedJournalData.quickReflections_encrypted) {
    try {
      const decryptedValue = await decryptData(
        encryptedJournalData.quickReflections_encrypted,
        passphrase,
        encryptedJournalData.quickReflections_salt,
        encryptedJournalData.quickReflections_iv
      );
      decrypted.quickReflections = JSON.parse(decryptedValue);
      
      delete decrypted.quickReflections_encrypted;
      delete decrypted.quickReflections_salt;
      delete decrypted.quickReflections_iv;
    } catch (error) {
      console.error('Failed to decrypt journal quick reflections:', error);
      decrypted.quickReflections = [];
    }
  }

  // Decrypt AI journal support
  if (encryptedJournalData.aiJournalSupport_encrypted) {
    try {
      const decryptedValue = await decryptData(
        encryptedJournalData.aiJournalSupport_encrypted,
        passphrase,
        encryptedJournalData.aiJournalSupport_salt,
        encryptedJournalData.aiJournalSupport_iv
      );
      decrypted.aiJournalSupport = JSON.parse(decryptedValue);
      
      delete decrypted.aiJournalSupport_encrypted;
      delete decrypted.aiJournalSupport_salt;
      delete decrypted.aiJournalSupport_iv;
    } catch (error) {
      console.error('Failed to decrypt journal AI support:', error);
      decrypted.aiJournalSupport = null;
    }
  }
  
  return decrypted;
}

/**
 * Encrypt feedback (except userId for system tracking)
 */
export async function encryptFeedback(feedbackData: any): Promise<any> {
  if (!feedbackData) return feedbackData;
  
  const passphrase = getCurrentPassphrase();
  const encrypted: any = { ...feedbackData };
  
  // Encrypt improvement suggestion but keep rating and IDs for analytics
  if (feedbackData.improvementSuggestion) {
    const encryptedField = await encryptData(feedbackData.improvementSuggestion, passphrase);
    encrypted.improvementSuggestion_encrypted = encryptedField.encryptedData;
    encrypted.improvementSuggestion_salt = encryptedField.salt;
    encrypted.improvementSuggestion_iv = encryptedField.iv;
    delete encrypted.improvementSuggestion;
  }
  
  return encrypted;
}

/**
 * Decrypt feedback
 */
export async function decryptFeedback(encryptedFeedbackData: any): Promise<any> {
  if (!encryptedFeedbackData) return encryptedFeedbackData;
  
  const passphrase = getCurrentPassphrase();
  const decrypted: any = { ...encryptedFeedbackData };
  
  if (encryptedFeedbackData.improvementSuggestion_encrypted) {
    try {
      const decryptedSuggestion = await decryptData(
        encryptedFeedbackData.improvementSuggestion_encrypted,
        passphrase,
        encryptedFeedbackData.improvementSuggestion_salt,
        encryptedFeedbackData.improvementSuggestion_iv
      );
      decrypted.improvementSuggestion = decryptedSuggestion;
      
      delete decrypted.improvementSuggestion_encrypted;
      delete decrypted.improvementSuggestion_salt;
      delete decrypted.improvementSuggestion_iv;
    } catch (error) {
      console.error('Failed to decrypt feedback suggestion:', error);
      decrypted.improvementSuggestion = '[Encrypted Data - Cannot Decrypt]';
    }
  }
  
  return decrypted;
}

/**
 * Utility function to check if user has passphrase available
 */
export function isEncryptionAvailable(): boolean {
  return !!sessionStorage.getItem('userPassphrase');
}

/**
 * Get encryption status for UI display
 */
export function getEncryptionStatus(): {
  isEncrypted: boolean;
  message: string;
} {
  if (isEncryptionAvailable()) {
    return {
      isEncrypted: true,
      message: "🔒 Your data is encrypted end-to-end. Only you can decrypt it."
    };
  } else {
    return {
      isEncrypted: false,
      message: "⚠️ Encryption unavailable. Please log in with your passphrase."
    };
  }
}
