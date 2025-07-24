// src/components/encryption/decryption-retry-button.tsx
"use client";

import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, Lock, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context-v2';
import { useEncryption } from '@/lib/encryption-context';
import { validateEncryptionAccess } from '@/lib/data-encryption';

interface DecryptionRetryButtonProps {
  /**
   * The data that failed to decrypt (for debugging/context)
   */
  failedData?: unknown;
  
  /**
   * Callback function to retry the operation that failed
   */
  onRetrySuccess?: () => void;
  
  /**
   * Error message from the failed decryption
   */
  errorMessage?: string;
  
  /**
   * Display variant
   */
  variant?: 'button' | 'card' | 'inline';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show advanced options (passphrase re-entry)
   */
  showAdvanced?: boolean;
}

export function DecryptionRetryButton({
  failedData: _failedData,
  onRetrySuccess,
  errorMessage = "Decryption was interrupted or failed",
  variant = 'button',
  className = "",
  showAdvanced = false
}: DecryptionRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showPassphraseForm, setShowPassphraseForm] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const { toast } = useToast();
  const { refreshUserProfile } = useAuth();
  const { setPassphrase, clearPassphrase } = useEncryption();

  /**
   * Check if passphrase is available and valid
   */
  const checkPassphraseStatus = () => {
    const hasAccess = validateEncryptionAccess();
    const storedPassphrase = sessionStorage.getItem('userPassphrase');
    
    return {
      hasPassphrase: !!storedPassphrase,
      hasAccess,
      canDecrypt: hasAccess && storedPassphrase
    };
  };

  /**
   * Retry decryption with current passphrase
   */
  const handleRetryDecryption = async () => {
    setIsRetrying(true);
    
    try {
      const status = checkPassphraseStatus();
      
      if (!status.canDecrypt) {
        toast({
          variant: "destructive",
          title: "Cannot Retry Decryption",
          description: "No valid passphrase available. Please re-enter your passphrase.",
        });
        setShowPassphraseForm(true);
        return;
      }

      // Attempt to refresh user profile (which triggers decryption)
      await refreshUserProfile();
      
      toast({
        title: "Decryption Successful",
        description: "Your data has been successfully decrypted and is now accessible.",
      });
      
      // Call success callback if provided
      onRetrySuccess?.();
      
    } catch (error) {
      // Log error for debugging only in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Retry decryption failed:', error);
      }
      
      toast({
        variant: "destructive",
        title: "Decryption Still Failed",
        description: error instanceof Error ? error.message : "Please check your passphrase and try again.",
      });
      
      // Show passphrase form for manual retry
      setShowPassphraseForm(true);
      
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Update passphrase and retry
   */
  const handlePassphraseSubmit = async () => {
    if (!passphraseInput.trim()) {
      toast({
        variant: "destructive",
        title: "Passphrase Required",
        description: "Please enter your passphrase to retry decryption.",
      });
      return;
    }

    setIsRetrying(true);
    
    try {
      // Clear old passphrase and set new one
      clearPassphrase();
      await setPassphrase(passphraseInput);
      
      // Attempt to refresh profile with new passphrase
      await refreshUserProfile();
      
      toast({
        title: "Passphrase Updated",
        description: "Your passphrase has been updated and decryption is working.",
      });
      
      // Reset form state
      setPassphraseInput('');
      setShowPassphraseForm(false);
      onRetrySuccess?.();
      
    } catch (error) {
      // Log error for debugging only in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Passphrase update failed:', error);
      }
      
      toast({
        variant: "destructive",
        title: "Invalid Passphrase",
        description: "The passphrase you entered is incorrect. Please try again.",
      });
      
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Force refresh session and retry
   */
  const handleForceRefresh = async () => {
    setIsRetrying(true);
    
    try {
      // Clear current session and prompt for fresh login
      clearPassphrase();
      
      toast({
        title: "Session Cleared",
        description: "Please re-enter your passphrase to continue.",
      });
      
      setShowPassphraseForm(true);
      
    } catch (error) {
      // Log error for debugging only in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Force refresh failed:', error);
      }
      
      toast({
        variant: "destructive",
        title: "Session Clear Failed",
        description: "Please refresh the page manually.",
      });
      
    } finally {
      setIsRetrying(false);
    }
  };

  // Button variant - minimal UI
  if (variant === 'button') {
    return (
      <Button
        onClick={handleRetryDecryption}
        disabled={isRetrying}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        {isRetrying ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
        {isRetrying ? 'Retrying...' : 'Retry Decryption'}
      </Button>
    );
  }

  // Inline variant - compact alert
  if (variant === 'inline') {
    return (
      <Alert className={`border-amber-200 ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">{errorMessage}</span>
          <Button
            onClick={handleRetryDecryption}
            disabled={isRetrying}
            variant="ghost"
            size="sm"
            className="ml-2"
          >
            {isRetrying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant - full UI with advanced options
  return (
    <Card className={`border-amber-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          Decryption Interrupted
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-200">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm text-amber-800">
              <strong>What happened?</strong> {errorMessage}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Your data is still securely encrypted. Click retry to attempt decryption again.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={handleRetryDecryption}
              disabled={isRetrying}
              className="flex-1"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {isRetrying ? 'Retrying...' : 'Retry Decryption'}
            </Button>
            
            {showAdvanced && (
              <Button
                onClick={() => setShowPassphraseForm(!showPassphraseForm)}
                variant="outline"
                disabled={isRetrying}
              >
                <Key className="h-4 w-4 mr-2" />
                Re-enter Passphrase
              </Button>
            )}
          </div>

          {showPassphraseForm && (
            <Card className="border-blue-200">
              <CardContent className="pt-4 space-y-3">
                <Label htmlFor="retry-passphrase" className="text-sm font-medium">
                  Enter your passphrase to retry decryption:
                </Label>
                <div className="space-y-2">
                  <Input
                    id="retry-passphrase"
                    type="password"
                    placeholder="Enter your passphrase"
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    disabled={isRetrying}
                    onKeyDown={(e) => e.key === 'Enter' && handlePassphraseSubmit()}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePassphraseSubmit}
                      disabled={isRetrying || !passphraseInput.trim()}
                      size="sm"
                      className="flex-1"
                    >
                      {isRetrying ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Update & Retry
                    </Button>
                    <Button
                      onClick={() => setShowPassphraseForm(false)}
                      variant="ghost"
                      size="sm"
                      disabled={isRetrying}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showAdvanced && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Advanced Options:</p>
              <Button
                onClick={handleForceRefresh}
                variant="ghost"
                size="sm"
                disabled={isRetrying}
                className="text-xs"
              >
                Clear Session & Start Fresh
              </Button>
            </div>
          )}
        </div>

        <Alert className="border-blue-200">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <p className="text-xs text-blue-800">
              <strong>🔒 Your data remains secure:</strong> Decryption failures don&apos;t compromise your data security. 
              All information remains encrypted and protected.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Quick retry hook for use in other components
 */
export function useDecryptionRetry() {
  const { refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const retryDecryption = async (): Promise<boolean> => {
    try {
      const hasAccess = validateEncryptionAccess();
      
      if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Passphrase Required",
          description: "Please re-enter your passphrase to access encrypted data.",
        });
        return false;
      }

      await refreshUserProfile();
      
      toast({
        title: "Decryption Successful",
        description: "Your encrypted data is now accessible.",
      });
      
      return true;
      
    } catch (error) {
      // Log error for debugging only in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Decryption retry failed:', error);
      }
      
      toast({
        variant: "destructive",
        title: "Decryption Failed",
        description: "Please check your passphrase and try again.",
      });
      
      return false;
    }
  };

  return { retryDecryption };
}
