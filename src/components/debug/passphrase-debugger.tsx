// Debug component for checking passphrase session state
"use client";

/* eslint-disable no-console */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { useEncryption } from '@/lib/encryption-context';
import { getPassphraseSafely } from '@/lib/data-encryption';

interface SessionStorageState {
  hasStoredPassphrase: boolean;
  storedPassphraseLength: number;
  hasSessionKey: boolean;
  sessionKeyLength: number;
  safePassphraseLength: number;
  encryptionContextPassphrase: number;
  isPassphraseSetInContext: boolean;
  checkPassphraseAvailabilityResult: boolean;
  storedPassphrasePreview: string;
  safePassphrasePreview: string;
}

export function PassphraseDebugger() {
  const { firebaseUser, user, checkPassphraseAvailability } = useAuth();
  const { isPassphraseSet, userPassphrase } = useEncryption();
  const [sessionStorageState, setSessionStorageState] = useState<SessionStorageState>({
    hasStoredPassphrase: false,
    storedPassphraseLength: 0,
    hasSessionKey: false,
    sessionKeyLength: 0,
    safePassphraseLength: 0,
    encryptionContextPassphrase: 0,
    isPassphraseSetInContext: false,
    checkPassphraseAvailabilityResult: false,
    storedPassphrasePreview: 'null',
    safePassphrasePreview: 'null'
  });
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Only run client-side
    if (typeof window === 'undefined') return;

    const checkSessionState = () => {
      try {
        const storedPassphrase = sessionStorage.getItem('userPassphrase');
        const sessionKey = sessionStorage.getItem('session_encryption_key');
        const safePassphrase = getPassphraseSafely();
        
        console.log('🔍 Passphrase Debugger: Session state check', {
          storedPassphrase: !!storedPassphrase,
          sessionKey: !!sessionKey,
          safePassphrase: !!safePassphrase,
          userPassphrase: !!userPassphrase,
          isPassphraseSet,
          checkPassphraseAvailabilityResult: checkPassphraseAvailability()
        });
        
        const state: SessionStorageState = {
          hasStoredPassphrase: !!storedPassphrase,
          storedPassphraseLength: storedPassphrase?.length || 0,
          hasSessionKey: !!sessionKey,
          sessionKeyLength: sessionKey?.length || 0,
          safePassphraseLength: safePassphrase?.length || 0,
          encryptionContextPassphrase: userPassphrase?.length || 0,
          isPassphraseSetInContext: isPassphraseSet,
          checkPassphraseAvailabilityResult: checkPassphraseAvailability(),
          // Show first few chars for debugging (encrypted anyway)
          storedPassphrasePreview: storedPassphrase ? `${storedPassphrase.substring(0, 10)}...` : 'null',
          safePassphrasePreview: safePassphrase ? `${safePassphrase.substring(0, 4)}...` : 'null'
        };
        
        setSessionStorageState(state);
        setDebugInfo(JSON.stringify(state, null, 2));
      } catch (error) {
        console.error('❌ Passphrase Debugger: Error checking session state:', error);
        setDebugInfo(`Error checking session state: ${error}`);
      }
    };

    checkSessionState();
    
    // Check every 2 seconds to see changes
    const interval = setInterval(checkSessionState, 2000);
    
    return () => clearInterval(interval);
  }, [userPassphrase, isPassphraseSet, checkPassphraseAvailability]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-auto">
      <h3 className="font-bold mb-2 text-yellow-400">Passphrase Debug Info</h3>
      <div className="space-y-1 mb-4">
        <div>Firebase User: {firebaseUser ? '✅' : '❌'}</div>
        <div>Auth User: {user ? '✅' : '❌'}</div>
        <div>User Email: {firebaseUser?.email || 'N/A'}</div>
      </div>
      
      <h4 className="font-bold mb-1 text-blue-400">Session Storage State:</h4>
      <div className="space-y-1 mb-4">
        <div>Stored Passphrase: {sessionStorageState.hasStoredPassphrase ? '✅' : '❌'} ({sessionStorageState.storedPassphraseLength} chars)</div>
        <div>Session Key: {sessionStorageState.hasSessionKey ? '✅' : '❌'} ({sessionStorageState.sessionKeyLength} chars)</div>
        <div>Safe Passphrase: {sessionStorageState.safePassphraseLength > 0 ? '✅' : '❌'} ({sessionStorageState.safePassphraseLength} chars)</div>
        <div>Context Passphrase: {sessionStorageState.encryptionContextPassphrase > 0 ? '✅' : '❌'} ({sessionStorageState.encryptionContextPassphrase} chars)</div>
        <div>Is Passphrase Set: {sessionStorageState.isPassphraseSetInContext ? '✅' : '❌'}</div>
        <div>Check Availability: {sessionStorageState.checkPassphraseAvailabilityResult ? '✅' : '❌'}</div>
      </div>
      
      <h4 className="font-bold mb-1 text-green-400">Previews:</h4>
      <div className="space-y-1 mb-4 text-xs">
        <div>Stored: {sessionStorageState.storedPassphrasePreview}</div>
        <div>Safe: {sessionStorageState.safePassphrasePreview}</div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-gray-400">Raw Debug Data</summary>
        <pre className="text-xs mt-1 bg-gray-800 p-2 rounded overflow-auto max-h-32">
          {debugInfo}
        </pre>
      </details>
    </div>
  );
}
