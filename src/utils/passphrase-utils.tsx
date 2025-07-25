// Simplified passphrase utilities
"use client";

import { getPassphraseSafely } from '@/lib/data-encryption';

export interface PassphraseStatus {
  isAvailable: boolean;
  hasSessionStorage: boolean;
  hasEncryptionContext: boolean;
  hasDataService: boolean;
  canDecrypt: boolean;
  error?: string;
}

/**
 * Single source of truth for passphrase availability
 */
export function getPassphraseStatus(): PassphraseStatus {
  try {
    // Check session storage
    const hasSessionStorage = !!sessionStorage.getItem('userPassphrase');
    
    // Check if we can safely get the passphrase
    const safePassphrase = getPassphraseSafely();
    const canDecrypt = !!safePassphrase && safePassphrase.length > 0;
    
    // For now, assume encryption context and data service follow session storage
    // This can be enhanced later if needed
    const hasEncryptionContext = hasSessionStorage;
    const hasDataService = hasSessionStorage && canDecrypt;
    
    return {
      isAvailable: canDecrypt,
      hasSessionStorage,
      hasEncryptionContext,
      hasDataService,
      canDecrypt,
    };
  } catch (error) {
    return {
      isAvailable: false,
      hasSessionStorage: false,
      hasEncryptionContext: false,
      hasDataService: false,
      canDecrypt: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simple check if user can proceed with encrypted operations
 */
export function canUserProceed(): boolean {
  const status = getPassphraseStatus();
  return status.isAvailable && status.canDecrypt;
}
