// src/lib/enhanced-data-encryption.ts
"use client";

import { 
  getPassphraseSafely,
  encryptUserProfile,
  decryptUserProfile,
  encryptSessionData,
  decryptSessionData,
  encryptChatMessage,
  decryptChatMessage,
  encryptJournalEntry,
  decryptJournalEntry,
  encryptFeedback,
  decryptFeedback
} from './data-encryption';

/**
 * Enhanced encryption result with retry capabilities
 */
export interface EncryptionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  needsRetry?: boolean;
  canRetry?: boolean;
  originalData?: unknown;
}

/**
 * Encryption operation types for better error handling
 */
export type EncryptionOperation = 
  | 'profile_encrypt'
  | 'profile_decrypt'
  | 'session_encrypt'
  | 'session_decrypt'
  | 'message_encrypt'
  | 'message_decrypt'
  | 'journal_encrypt'
  | 'journal_decrypt'
  | 'feedback_encrypt'
  | 'feedback_decrypt';

/**
 * Enhanced encryption wrapper with retry capabilities
 */
class EnhancedDataEncryption {
  
  /**
   * Check if encryption/decryption is available
   */
  isAvailable(): boolean {
    const passphrase = getPassphraseSafely();
    return !!passphrase;
  }

  /**
   * Get current encryption status with detailed information
   */
  getStatus() {
    const passphrase = getPassphraseSafely();
    const hasSession = !!sessionStorage.getItem('userPassphrase');
    
    return {
      hasPassphrase: !!passphrase,
      hasSession,
      canEncrypt: !!passphrase,
      canDecrypt: !!passphrase,
      sessionValid: hasSession && !!passphrase
    };
  }

  /**
   * Enhanced profile encryption with retry support
   */
  async encryptProfile(profileData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => encryptUserProfile(profileData),
      'profile_encrypt',
      profileData
    );
  }

  /**
   * Enhanced profile decryption with retry support
   */
  async decryptProfile(encryptedProfileData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => decryptUserProfile(encryptedProfileData),
      'profile_decrypt',
      encryptedProfileData
    );
  }

  /**
   * Enhanced session encryption with retry support
   */
  async encryptSession(sessionData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => encryptSessionData(sessionData),
      'session_encrypt',
      sessionData
    );
  }

  /**
   * Enhanced session decryption with retry support
   */
  async decryptSession(encryptedSessionData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => decryptSessionData(encryptedSessionData),
      'session_decrypt',
      encryptedSessionData
    );
  }

  /**
   * Enhanced message encryption with retry support
   */
  async encryptMessage(messageData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => encryptChatMessage(messageData),
      'message_encrypt',
      messageData
    );
  }

  /**
   * Enhanced message decryption with retry support
   */
  async decryptMessage(encryptedMessageData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => decryptChatMessage(encryptedMessageData),
      'message_decrypt',
      encryptedMessageData
    );
  }

  /**
   * Enhanced journal encryption with retry support
   */
  async encryptJournal(journalData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => encryptJournalEntry(journalData),
      'journal_encrypt',
      journalData
    );
  }

  /**
   * Enhanced journal decryption with retry support
   */
  async decryptJournal(encryptedJournalData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => decryptJournalEntry(encryptedJournalData),
      'journal_decrypt',
      encryptedJournalData
    );
  }

  /**
   * Enhanced feedback encryption with retry support
   */
  async encryptFeedbackData(feedbackData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => encryptFeedback(feedbackData),
      'feedback_encrypt',
      feedbackData
    );
  }

  /**
   * Enhanced feedback decryption with retry support
   */
  async decryptFeedbackData(encryptedFeedbackData: unknown): Promise<EncryptionResult> {
    return this.safeEncryptionOperation(
      () => decryptFeedback(encryptedFeedbackData),
      'feedback_decrypt',
      encryptedFeedbackData
    );
  }

  /**
   * Safe encryption operation wrapper with comprehensive error handling
   */
  private async safeEncryptionOperation<T>(
    operation: () => Promise<T>,
    operationType: EncryptionOperation,
    originalData: unknown
  ): Promise<EncryptionResult<T>> {
    try {
      // Pre-check: Ensure passphrase is available
      if (!this.isAvailable()) {
        return {
          success: false,
          error: "Passphrase not available. Please re-enter your passphrase.",
          needsRetry: true,
          canRetry: true,
          originalData
        };
      }

      // Attempt the operation
      const result = await operation();
      
      return {
        success: true,
        data: result,
        originalData
      };

    } catch (error) {
      // Analyze the error to determine if retry is possible
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
      const isPassphraseError = errorMessage.includes('passphrase') || 
                               errorMessage.includes('decrypt') || 
                               errorMessage.includes('Invalid');
      
      return {
        success: false,
        error: this.getOperationErrorMessage(operationType, errorMessage),
        needsRetry: isPassphraseError,
        canRetry: true,
        originalData
      };
    }
  }

  /**
   * Get user-friendly error messages for different operations
   */
  private getOperationErrorMessage(operation: EncryptionOperation, originalError: string): string {
    const baseMessages = {
      profile_encrypt: "Failed to encrypt profile data",
      profile_decrypt: "Failed to decrypt profile data",
      session_encrypt: "Failed to encrypt session data", 
      session_decrypt: "Failed to decrypt session data",
      message_encrypt: "Failed to encrypt message",
      message_decrypt: "Failed to decrypt message",
      journal_encrypt: "Failed to encrypt journal entry",
      journal_decrypt: "Failed to decrypt journal entry",
      feedback_encrypt: "Failed to encrypt feedback",
      feedback_decrypt: "Failed to decrypt feedback"
    };

    const baseMessage = baseMessages[operation] || "Encryption operation failed";
    
    // Add specific guidance based on error type
    if (originalError.includes('passphrase')) {
      return `${baseMessage}. Your passphrase may be incorrect or expired.`;
    } else if (originalError.includes('corrupted')) {
      return `${baseMessage}. The encrypted data may be corrupted.`;
    } else if (originalError.includes('format')) {
      return `${baseMessage}. The data format is incompatible.`;
    } else {
      return `${baseMessage}. Please check your connection and try again.`;
    }
  }

  /**
   * Batch decryption with individual retry support
   */
  async decryptBatch<T>(
    encryptedItems: unknown[],
    decryptFunction: (item: unknown) => Promise<EncryptionResult<T>>
  ): Promise<{
    success: boolean;
    results: EncryptionResult<T>[];
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    needsRetryCount: number;
  }> {
    const results: EncryptionResult<T>[] = [];
    let successCount = 0;
    let failedCount = 0;
    let needsRetryCount = 0;

    for (const item of encryptedItems) {
      const result = await decryptFunction(item);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
        if (result.needsRetry) {
          needsRetryCount++;
        }
      }
    }

    return {
      success: failedCount === 0,
      results,
      totalProcessed: encryptedItems.length,
      successCount,
      failedCount,
      needsRetryCount
    };
  }

  /**
   * Validate encrypted data integrity
   */
  validateEncryptedData(data: unknown): {
    isValid: boolean;
    hasEncryptedFields: boolean;
    encryptedFieldCount: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let encryptedFieldCount = 0;
    let hasEncryptedFields = false;

    if (!data || typeof data !== 'object') {
      issues.push('Data is not a valid object');
      return {
        isValid: false,
        hasEncryptedFields: false,
        encryptedFieldCount: 0,
        issues
      };
    }

    const obj = data as Record<string, unknown>;
    
    // Check for encrypted field patterns
    Object.keys(obj).forEach(key => {
      if (key.endsWith('_encrypted')) {
        hasEncryptedFields = true;
        encryptedFieldCount++;
        
        const value = obj[key];
        if (!value || typeof value !== 'string') {
          issues.push(`Encrypted field '${key}' has invalid value`);
        } else if (value.startsWith('[Encrypted Data - Cannot Decrypt]')) {
          issues.push(`Field '${key}' shows decryption failure marker`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      hasEncryptedFields,
      encryptedFieldCount,
      issues
    };
  }
}

/**
 * Global enhanced encryption instance
 */
export const enhancedEncryption = new EnhancedDataEncryption();

/**
 * Helper hook for React components
 */
export function useEnhancedEncryption() {
  const status = enhancedEncryption.getStatus();
  
  return {
    // Methods from the class
    encryptProfile: enhancedEncryption.encryptProfile.bind(enhancedEncryption),
    decryptProfile: enhancedEncryption.decryptProfile.bind(enhancedEncryption),
    encryptSession: enhancedEncryption.encryptSession.bind(enhancedEncryption),
    decryptSession: enhancedEncryption.decryptSession.bind(enhancedEncryption),
    encryptMessage: enhancedEncryption.encryptMessage.bind(enhancedEncryption),
    decryptMessage: enhancedEncryption.decryptMessage.bind(enhancedEncryption),
    encryptJournal: enhancedEncryption.encryptJournal.bind(enhancedEncryption),
    decryptJournal: enhancedEncryption.decryptJournal.bind(enhancedEncryption),
    encryptFeedbackData: enhancedEncryption.encryptFeedbackData.bind(enhancedEncryption),
    decryptFeedbackData: enhancedEncryption.decryptFeedbackData.bind(enhancedEncryption),
    decryptBatch: enhancedEncryption.decryptBatch.bind(enhancedEncryption),
    validateEncryptedData: enhancedEncryption.validateEncryptedData.bind(enhancedEncryption),
    isAvailable: enhancedEncryption.isAvailable.bind(enhancedEncryption),
    getStatus: enhancedEncryption.getStatus.bind(enhancedEncryption),
    
    // Status properties
    status,
    isReady: status.canEncrypt && status.canDecrypt,
    needsPassphrase: !status.hasPassphrase
  };
}
