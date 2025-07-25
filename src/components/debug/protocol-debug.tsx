// Debug component for protocol page issues
"use client";

import React from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { useEncryption } from '@/lib/encryption-context';

export function ProtocolDebug() {
  const { firebaseUser, user, checkPassphraseAvailability } = useAuth();
  const { isPassphraseSet } = useEncryption();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Protocol Debug Info</h3>
      <div className="space-y-1">
        <div>Firebase User: {firebaseUser ? '✅' : '❌'}</div>
        <div>Auth User: {user ? '✅' : '❌'}</div>
        <div>Passphrase Set: {isPassphraseSet ? '✅' : '❌'}</div>
        <div>Passphrase Available: {checkPassphraseAvailability() ? '✅' : '❌'}</div>
        <div>User Email: {firebaseUser?.email || 'N/A'}</div>
        <div>User Display: {user?.displayName || 'N/A'}</div>
      </div>
    </div>
  );
}
