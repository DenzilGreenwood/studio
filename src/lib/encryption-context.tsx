// src/lib/encryption-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface EncryptionContextType {
  userPassphrase: string | null;
  isPassphraseSet: boolean;
  setPassphrase: (passphrase: string) => void;
  clearPassphrase: () => void;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export const EncryptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPassphrase, setUserPassphrase] = useState<string | null>(null);
  const { firebaseUser, refreshUserProfile } = useAuth();

  useEffect(() => {
    // Load passphrase from session storage on mount
    const storedPassphrase = sessionStorage.getItem('userPassphrase');
    if (storedPassphrase) {
      setUserPassphrase(storedPassphrase);
    }
  }, []);

  useEffect(() => {
    // Clear passphrase when user logs out
    if (!firebaseUser) {
      clearPassphrase();
    }
  }, [firebaseUser]);

  const setPassphrase = (passphrase: string) => {
    setUserPassphrase(passphrase);
    sessionStorage.setItem('userPassphrase', passphrase);
    // Refresh user profile to decrypt data now that passphrase is available
    refreshUserProfile().catch(error => {
      console.error('Failed to refresh user profile after setting passphrase:', error);
    });
  };

  const clearPassphrase = () => {
    setUserPassphrase(null);
    sessionStorage.removeItem('userPassphrase');
  };

  return (
    <EncryptionContext.Provider 
      value={{ 
        userPassphrase, 
        isPassphraseSet: !!userPassphrase,
        setPassphrase,
        clearPassphrase
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
