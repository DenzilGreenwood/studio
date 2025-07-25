// src/utils/passphrase-check.ts
"use client";

import { getPassphraseSafely } from '@/lib/data-encryption';
import { toast } from '@/hooks/use-toast';

export interface PassphraseCheckResult {
  userPassphraseAvailable: boolean;
  sessionPassphraseAvailable: boolean;
  bothAvailable: boolean;
  message: string;
}

/**
 * Check both user passphrase and session passphrase availability
 * and display appropriate toast notifications
 */
export function checkPassphrasesWithToast(): PassphraseCheckResult {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      userPassphraseAvailable: false,
      sessionPassphraseAvailable: false,
      bothAvailable: false,
      message: 'Security check not available during server rendering.'
    };
  }

  // Check session storage for user passphrase
  const sessionPassphrase = getPassphraseSafely();
  const userPassphraseAvailable = sessionPassphrase !== null;
  
  // Check if session storage has the encrypted passphrase key
  const sessionEncryptionKey = sessionStorage.getItem('session_encryption_key');
  const sessionPassphraseAvailable = sessionEncryptionKey !== null;
  
  // Determine overall status
  const bothAvailable = userPassphraseAvailable && sessionPassphraseAvailable;
  
  let message = '';
  
  if (bothAvailable) {
    message = 'Both user passphrase and session encryption are active. Your data is fully protected.';
    toast({
      title: "✅ Security Status: Active",
      description: message,
      variant: "default"
    });
  } else if (userPassphraseAvailable && !sessionPassphraseAvailable) {
    message = 'User passphrase is available, but session encryption key is missing.';
    toast({
      title: "⚠️ Security Status: Partial",
      description: message,
      variant: "destructive"
    });
  } else if (!userPassphraseAvailable && sessionPassphraseAvailable) {
    message = 'Session encryption key is available, but user passphrase is missing.';
    toast({
      title: "⚠️ Security Status: Partial", 
      description: message,
      variant: "destructive"
    });
  } else {
    message = 'Both user passphrase and session encryption are missing. Please log in again.';
    toast({
      title: "❌ Security Status: Inactive",
      description: message,
      variant: "destructive"
    });
  }
  
  return {
    userPassphraseAvailable,
    sessionPassphraseAvailable,
    bothAvailable,
    message
  };
}

/**
 * Check passphrase status silently without showing toast
 */
export function checkPassphrasesSilently(): PassphraseCheckResult {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      userPassphraseAvailable: false,
      sessionPassphraseAvailable: false,
      bothAvailable: false,
      message: 'Security check not available during server rendering.'
    };
  }

  const sessionPassphrase = getPassphraseSafely();
  const userPassphraseAvailable = sessionPassphrase !== null;
  
  // Check session encryption key (also protected by window check above)
  const sessionEncryptionKey = sessionStorage.getItem('session_encryption_key');
  const sessionPassphraseAvailable = sessionEncryptionKey !== null;
  
  const bothAvailable = userPassphraseAvailable && sessionPassphraseAvailable;
  
  let message = '';
  if (bothAvailable) {
    message = 'Both user passphrase and session encryption are active.';
  } else if (userPassphraseAvailable && !sessionPassphraseAvailable) {
    message = 'User passphrase is available, but session encryption key is missing.';
  } else if (!userPassphraseAvailable && sessionPassphraseAvailable) {
    message = 'Session encryption key is available, but user passphrase is missing.';
  } else {
    message = 'Both user passphrase and session encryption are missing.';
  }
  
  return {
    userPassphraseAvailable,
    sessionPassphraseAvailable,
    bothAvailable,
    message
  };
}

/**
 * Check passphrases and show detailed status with recommendations
 */
export function checkPassphrasesDetailed(): PassphraseCheckResult {
  const result = checkPassphrasesSilently();
  
  if (result.bothAvailable) {
    toast({
      title: "🔒 Security Check Complete",
      description: "✅ User passphrase: Available\n✅ Session encryption: Active\n✅ Data protection: Fully operational",
      variant: "default",
      duration: 5000
    });
  } else {
    let detailedMessage = "Security Status Issues Detected:\n";
    detailedMessage += `${result.userPassphraseAvailable ? '✅' : '❌'} User passphrase: ${result.userPassphraseAvailable ? 'Available' : 'Missing'}\n`;
    detailedMessage += `${result.sessionPassphraseAvailable ? '✅' : '❌'} Session encryption: ${result.sessionPassphraseAvailable ? 'Active' : 'Inactive'}\n`;
    
    if (!result.userPassphraseAvailable) {
      detailedMessage += "\n💡 Recommendation: Please enter your passphrase to decrypt your data.";
    }
    if (!result.sessionPassphraseAvailable) {
      detailedMessage += "\n💡 Recommendation: Session encryption key missing - consider logging out and back in.";
    }
    
    toast({
      title: "⚠️ Security Check Results",
      description: detailedMessage,
      variant: "destructive",
      duration: 8000
    });
  }
  
  return result;
}
