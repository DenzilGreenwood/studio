// Simple debug info for development
"use client";

import React from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { useEncryption } from '@/lib/encryption-context';
import { getPassphraseStatus } from '@/utils/passphrase-utils';

export function SimpleDebug() {
  const { firebaseUser, user } = useAuth();
  const { isPassphraseSet } = useEncryption();
  const passphraseStatus = getPassphraseStatus();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs z-50">
      <div className="font-bold mb-2">🔍 Debug Status</div>
      <div className="space-y-1">
        <div>Firebase: {firebaseUser ? '✅' : '❌'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Passphrase: {isPassphraseSet ? '✅' : '❌'}</div>
        <div>Can Decrypt: {passphraseStatus.canDecrypt ? '✅' : '❌'}</div>
        <div>Ready: {firebaseUser && user && passphraseStatus.canDecrypt ? '✅' : '❌'}</div>
        {passphraseStatus.error && (
          <div className="text-red-400">Error: {passphraseStatus.error}</div>
        )}
      </div>
    </div>
  );
}
