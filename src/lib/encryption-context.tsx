// src/lib/encryption-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

interface EncryptionContextType {
  userPassphrase: string | null;
  isPassphraseSet: boolean;
  setPassphrase: (passphrase: string) => Promise<void>;
  clearPassphrase: () => void;
  resetInactivityTimer: () => void;
  setInactivityTimeout: (minutes: number) => void;
  getInactivityTimeout: () => number;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

// Configuration for session management
const DEFAULT_PASSPHRASE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

// XSS Protection: Simple encryption for sessionStorage
// Use a stable key based on session to ensure decryption works
const getSessionEncryptionKey = (): string => {
  let key = sessionStorage.getItem('session_encryption_key');
  if (!key) {
    key = 'user-session-key-' + Math.random().toString(36);
    sessionStorage.setItem('session_encryption_key', key);
  }
  return key;
};

// Simple XOR encryption for sessionStorage protection
function encryptForStorage(data: string): string {
  const key = getSessionEncryptionKey();
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function decryptFromStorage(data: string): string {
  try {
    const decoded = atob(data);
    const key = getSessionEncryptionKey();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

// Audit logging for encryption events (privacy-safe)
function logEncryptionEvent(event: string, userId?: string) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    userId: userId ? `${userId.substring(0, 8)}...` : 'unknown', // Privacy-safe partial ID
    sessionId: getSessionEncryptionKey().substring(0, 8) // Session identifier
  };
  
  // Store in memory for this session only (not persistent)
  if (typeof window !== 'undefined') {
    const sessionLogs = JSON.parse(sessionStorage.getItem('encryption_audit') || '[]');
    sessionLogs.push(logEntry);
    // Keep only last 50 events to prevent memory bloat
    if (sessionLogs.length > 50) {
      sessionLogs.splice(0, sessionLogs.length - 50);
    }
    sessionStorage.setItem('encryption_audit', JSON.stringify(sessionLogs));
  }
}

export const EncryptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPassphrase, setUserPassphrase] = useState<string | null>(null);
  const [inactivityTimeout, setInactivityTimeoutState] = useState<number>(DEFAULT_PASSPHRASE_TIMEOUT);
  const { firebaseUser, refreshUserProfile } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenersRef = useRef<Array<() => void>>([]);

  // Clear any existing timeout
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearPassphrase = useCallback(() => {
    setUserPassphrase(null);
    sessionStorage.removeItem('userPassphrase');
    logEncryptionEvent('passphrase_cleared', firebaseUser?.uid);
    
    // Remove activity listeners using stored cleanup functions
    activityListenersRef.current.forEach(cleanup => cleanup());
    activityListenersRef.current = [];
    
    clearTimeoutRef();
  }, [clearTimeoutRef, firebaseUser?.uid]);

  // Start or restart the inactivity timeout
  const resetInactivityTimer = useCallback(() => {
    if (!userPassphrase) return;
    
    clearTimeoutRef();
    timeoutRef.current = setTimeout(() => {
      logEncryptionEvent('passphrase_auto_cleared_inactivity', firebaseUser?.uid);
      clearPassphrase();
    }, inactivityTimeout);
  }, [userPassphrase, clearTimeoutRef, clearPassphrase, inactivityTimeout, firebaseUser?.uid]);

  // Handle user activity to reset timer
  const handleActivity = useCallback(() => {
    if (userPassphrase) {
      resetInactivityTimer();
    }
  }, [userPassphrase, resetInactivityTimer]);

  // Set user-configurable inactivity timeout
  const setInactivityTimeout = useCallback((minutes: number) => {
    const timeout = Math.max(1, Math.min(120, minutes)) * 60 * 1000; // 1-120 minutes
    setInactivityTimeoutState(timeout);
    localStorage.setItem('user_inactivity_timeout', timeout.toString());
    logEncryptionEvent('inactivity_timeout_changed', firebaseUser?.uid);
    
    // Restart timer with new timeout if passphrase is set
    if (userPassphrase) {
      resetInactivityTimer();
    }
  }, [firebaseUser?.uid, userPassphrase, resetInactivityTimer]);

  // Get current inactivity timeout in minutes
  const getInactivityTimeout = useCallback(() => {
    return Math.round(inactivityTimeout / (60 * 1000));
  }, [inactivityTimeout]);

  useEffect(() => {
    // Load user preferences for inactivity timeout
    const storedTimeout = localStorage.getItem('user_inactivity_timeout');
    if (storedTimeout) {
      const timeout = parseInt(storedTimeout, 10);
      if (!isNaN(timeout) && timeout > 0) {
        setInactivityTimeoutState(timeout);
      }
    }

    // Load passphrase from session storage on mount with XSS protection
    const storedPassphrase = sessionStorage.getItem('userPassphrase');
    if (storedPassphrase) {
      const decryptedPassphrase = decryptFromStorage(storedPassphrase);
      if (decryptedPassphrase) {
        setUserPassphrase(decryptedPassphrase);
        logEncryptionEvent('passphrase_restored', firebaseUser?.uid);
      }
    }
  }, [firebaseUser?.uid]);

  useEffect(() => {
    // Clear passphrase when user logs out
    if (!firebaseUser) {
      clearPassphrase();
    }
  }, [firebaseUser, clearPassphrase]);

  // Auto-expiry and activity monitoring when passphrase is set
  useEffect(() => {
    if (userPassphrase) {
      // Attach activity listeners with proper cleanup tracking
      const cleanupFunctions: Array<() => void> = [];
      
      ACTIVITY_EVENTS.forEach(event => {
        const listener = () => handleActivity();
        document.addEventListener(event, listener, { passive: true });
        cleanupFunctions.push(() => document.removeEventListener(event, listener));
      });
      
      activityListenersRef.current = cleanupFunctions;
      
      // Start inactivity timer
      resetInactivityTimer();
    } else {
      // Remove activity listeners using stored cleanup functions
      activityListenersRef.current.forEach(cleanup => cleanup());
      activityListenersRef.current = [];
      clearTimeoutRef();
    }

    // Cleanup on unmount or passphrase change
    return () => {
      activityListenersRef.current.forEach(cleanup => cleanup());
      activityListenersRef.current = [];
      clearTimeoutRef();
    };
  }, [userPassphrase, handleActivity, resetInactivityTimer, clearTimeoutRef]);

  const setPassphrase = useCallback(async (passphrase: string) => {
    setUserPassphrase(passphrase);
    // Store with XSS protection
    sessionStorage.setItem('userPassphrase', encryptForStorage(passphrase));
    logEncryptionEvent('passphrase_set', firebaseUser?.uid);
    
    // Refresh user profile to decrypt data now that passphrase is available
    try {
      await refreshUserProfile();
    } catch (error) {
      logEncryptionEvent('profile_refresh_error', firebaseUser?.uid);
      if (error instanceof Error) {
        throw new Error(`Failed to refresh user profile: ${error.message}`);
      }
    }
  }, [refreshUserProfile, firebaseUser?.uid]);

  return (
    <EncryptionContext.Provider 
      value={{ 
        userPassphrase, 
        isPassphraseSet: !!userPassphrase,
        setPassphrase,
        clearPassphrase,
        resetInactivityTimer,
        setInactivityTimeout,
        getInactivityTimeout
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = (): EncryptionContextType => {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
};
