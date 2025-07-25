'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { encryptForStorage, decryptFromStorage } from '@/lib/encryption-context';

export default function SecurityVerificationPage() {
  const [testPassphrase, setTestPassphrase] = useState('');
  const [sessionStorageValue, setSessionStorageValue] = useState('');
  const [decryptedValue, setDecryptedValue] = useState('');

  const handleStorePassphrase = () => {
    if (!testPassphrase.trim()) return;
    
    // Store encrypted passphrase (this is what the app should do)
    const encrypted = encryptForStorage(testPassphrase);
    sessionStorage.setItem('userPassphrase', encrypted);
    
    // Show what's actually stored in sessionStorage
    const stored = sessionStorage.getItem('userPassphrase') || '';
    setSessionStorageValue(stored);
    
    // Decrypt to verify it works
    const decrypted = decryptFromStorage(stored);
    setDecryptedValue(decrypted || 'Failed to decrypt');
  };

  const handleClearStorage = () => {
    sessionStorage.removeItem('userPassphrase');
    setSessionStorageValue('');
    setDecryptedValue('');
  };

  const handleCheckCurrentStorage = () => {
    const stored = sessionStorage.getItem('userPassphrase') || '';
    setSessionStorageValue(stored);
    
    if (stored) {
      const decrypted = decryptFromStorage(stored);
      setDecryptedValue(decrypted || 'Failed to decrypt');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔒 Security Verification Test</CardTitle>
          <CardDescription>
            Test that passphrases are properly encrypted in sessionStorage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="test-passphrase">Test Passphrase</Label>
            <Input
              id="test-passphrase"
              type="password"
              value={testPassphrase}
              onChange={(e) => setTestPassphrase(e.target.value)}
              placeholder="Enter a test passphrase"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleStorePassphrase} disabled={!testPassphrase.trim()}>
              Store Encrypted Passphrase
            </Button>
            <Button onClick={handleCheckCurrentStorage} variant="outline">
              Check Current Storage
            </Button>
            <Button onClick={handleClearStorage} variant="destructive">
              Clear Storage
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">What&apos;s in sessionStorage:</Label>
              <div className="mt-1 p-3 bg-gray-100 rounded-md font-mono text-sm break-all">
                {sessionStorageValue || 'Nothing stored'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                ✅ This should be encrypted/scrambled text, NOT your plain passphrase
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Decrypted Value:</Label>
              <div className="mt-1 p-3 bg-green-50 rounded-md font-mono text-sm">
                {decryptedValue || 'No decryption attempted'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                ✅ This should match your original passphrase after decryption
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-md">
            <h3 className="font-medium text-yellow-800">🔍 How to verify in browser:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
              <li>Open browser Developer Tools (F12)</li>
              <li>Go to Application → Storage → Session Storage</li>
              <li>Look for &apos;userPassphrase&apos; entry</li>
              <li>The value should be encrypted scrambled text, NOT readable</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
