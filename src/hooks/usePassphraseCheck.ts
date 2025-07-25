// src/hooks/usePassphraseCheck.ts
"use client";

import { useCallback } from 'react';
import { 
  checkPassphrasesWithToast, 
  checkPassphrasesSilently, 
  checkPassphrasesDetailed,
  type PassphraseCheckResult 
} from '@/utils/passphrase-check';
import { useAuth } from '@/context/auth-context-v2';

export function usePassphraseCheck() {
  const { checkPassphraseAvailability } = useAuth();
  
  // Check passphrases and show toast notifications
  const checkWithToast = useCallback((): PassphraseCheckResult => {
    return checkPassphrasesWithToast();
  }, []);
  
  // Check passphrases silently without notifications
  const checkSilently = useCallback((): PassphraseCheckResult => {
    return checkPassphrasesSilently();
  }, []);
  
  // Check passphrases and show detailed status
  const checkDetailed = useCallback((): PassphraseCheckResult => {
    return checkPassphrasesDetailed();
  }, []);
  
  // Legacy compatibility - uses existing auth context method
  const isUserPassphraseAvailable = useCallback((): boolean => {
    return checkPassphraseAvailability();
  }, [checkPassphraseAvailability]);
  
  // Quick status check
  const getPassphraseStatus = useCallback(() => {
    // Prevent SSR issues
    if (typeof window === 'undefined') {
      return {
        isSecure: false,
        hasUserPassphrase: false,
        hasSessionEncryption: false,
        statusMessage: 'Security check not available during server rendering.'
      };
    }
    
    const result = checkSilently();
    return {
      isSecure: result.bothAvailable,
      hasUserPassphrase: result.userPassphraseAvailable,
      hasSessionEncryption: result.sessionPassphraseAvailable,
      statusMessage: result.message
    };
  }, [checkSilently]);
  
  return {
    checkWithToast,
    checkSilently,
    checkDetailed,
    isUserPassphraseAvailable,
    getPassphraseStatus
  };
}
