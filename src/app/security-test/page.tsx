// src/app/security-test/page.tsx
"use client";

import React from 'react';
import { PassphraseStatusCheck } from '@/components/security/PassphraseStatusCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePassphraseCheck } from '@/hooks/usePassphraseCheck';
import { useAuth } from '@/context/auth-context-v2';
import { Shield, Home } from 'lucide-react';
import Link from 'next/link';

export default function SecurityTestPage() {
  const { 
    checkWithToast, 
    checkSilently, 
    checkDetailed, 
    isUserPassphraseAvailable 
  } = usePassphraseCheck();
  
  const { firebaseUser } = useAuth();

  const handleSilentCheck = () => {
    const result = checkSilently();
    alert(`Silent Check Results:
    User Passphrase: ${result.userPassphraseAvailable ? 'Available' : 'Missing'}
    Session Encryption: ${result.sessionPassphraseAvailable ? 'Active' : 'Inactive'}
    Both Available: ${result.bothAvailable ? 'Yes' : 'No'}
    Message: ${result.message}`);
  };

  const handleLegacyCheck = () => {
    const available = isUserPassphraseAvailable();
    alert(`Legacy Auth Context Check: ${available ? 'Passphrase Available' : 'Passphrase Missing'}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Security Status Testing</h1>
              <p className="text-muted-foreground">Test passphrase and session encryption checks</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* User Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Firebase User:</strong> {firebaseUser ? firebaseUser.email : 'Not logged in'}</p>
              <p><strong>User ID:</strong> {firebaseUser?.uid || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Passphrase Status Check Component */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Interactive Status Check</h2>
            <PassphraseStatusCheck showActions={true} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Auto-Check on Load</h2>
            <PassphraseStatusCheck showActions={false} autoCheck={true} />
          </div>
        </div>

        {/* Manual Testing Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Testing Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button 
                onClick={() => checkWithToast()}
                variant="default"
                className="w-full"
              >
                Hook: With Toast
              </Button>
              
              <Button 
                onClick={handleSilentCheck}
                variant="outline"
                className="w-full"
              >
                Hook: Silent Check
              </Button>
              
              <Button 
                onClick={() => checkDetailed()}
                variant="secondary"
                className="w-full"
              >
                Hook: Detailed
              </Button>
              
              <Button 
                onClick={handleLegacyCheck}
                variant="destructive"
                className="w-full"
              >
                Legacy: Auth Check
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm text-muted-foreground">
              <p>This page tests the new passphrase checking functionality:</p>
              <ul>
                <li><strong>User Passphrase:</strong> Checks if passphrase is available in sessionStorage</li>
                <li><strong>Session Encryption:</strong> Checks if session encryption key exists</li>
                <li><strong>Toast Notifications:</strong> Shows status via toast messages</li>
                <li><strong>Silent Checks:</strong> Returns status without notifications</li>
                <li><strong>Detailed Checks:</strong> Shows comprehensive status with recommendations</li>
              </ul>
              <p className="mt-4 text-amber-600">
                <strong>Note:</strong> To test fully, you need to be logged in with a valid passphrase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
