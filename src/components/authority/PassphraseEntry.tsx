/**
 * Passphrase Entry Component for Authority System
 * Version: 1.0.0
 * Date: January 15, 2025
 * 
 * Handles passphrase entry for users who need to initialize
 * the DataService with authority system
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { usePassphraseCheck } from '@/hooks/usePassphraseCheck';

interface PassphraseEntryProps {
  onSuccess?: () => void;
  className?: string;
}

export function PassphraseEntry({ onSuccess, className = '' }: PassphraseEntryProps) {
  const { firebaseUser, initializeDataService, checkPassphraseAvailability } = useAuth();
  const { checkWithToast } = usePassphraseCheck();
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passphrase) {
      setError('Please enter your passphrase');
      return;
    }

    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize DataService with authority system
      await initializeDataService(passphrase);
      
      // Check if initialization was successful
      if (checkPassphraseAvailability()) {
        onSuccess?.();
      } else {
        throw new Error('Failed to initialize DataService');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize DataService');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Redirect to login page
    window.location.href = '/login';
  };

  if (!firebaseUser) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Please log in to continue</p>
            <Button onClick={handleCancel} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center min-h-screen bg-background p-4 ${className}`}>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary" />
              <Key className="h-6 w-6 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">Enter Your Passphrase</CardTitle>
          <CardDescription>
            To access your account with the new authority system, please enter your security passphrase.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Account:</span>
                <Badge variant="outline">{firebaseUser.email}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Your account is being upgraded to the new authority system with enhanced security.
              </p>
            </div>

            {/* Passphrase Input */}
            <div className="space-y-2">
              <Label htmlFor="passphrase" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Passphrase
              </Label>
              <div className="relative">
                <Input
                  id="passphrase"
                  type={showPassphrase ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your passphrase"
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  disabled={isLoading}
                >
                  {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the same passphrase you use to decrypt your personal data.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading || !passphrase}
                className="flex-1 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Initialize DataService
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>

            {/* Security Check Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={checkWithToast}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Shield className="h-3 w-3" />
                Check Security Status
              </Button>
            </div>

            {/* Information */}
            <div className="text-xs text-muted-foreground space-y-2">
              <p><strong>What happens next:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Your passphrase will decrypt your existing data</li>
                <li>DataService will be initialized with authority system</li>
                <li>Enhanced security and role-based access will be enabled</li>
                <li>All your data remains private and encrypted</li>
              </ul>
              <p className="mt-4">
                <strong>Security Note:</strong> Your passphrase is processed locally in your browser 
                and never sent to our servers. The authority system maintains the same zero-knowledge 
                encryption standards.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
