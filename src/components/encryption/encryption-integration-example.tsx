// src/components/encryption/encryption-integration-example.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { DecryptionRetryButton } from './decryption-retry-button';
import { useEnhancedEncryption, type EncryptionResult } from '@/lib/enhanced-data-encryption';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Example component showing how to integrate the DecryptionRetryButton
 * with actual data loading scenarios
 */
export function EncryptionIntegrationExample() {
  const [profileData, setProfileData] = useState<unknown>(null);
  const [sessionData, setSessionData] = useState<unknown>(null);
  const [decryptionResults, setDecryptionResults] = useState<{
    profile?: EncryptionResult;
    session?: EncryptionResult;
  }>({});
  const [loading, setLoading] = useState(false);
  
  const enhancedEncryption = useEnhancedEncryption();
  const { status, isReady, needsPassphrase } = enhancedEncryption;
  
  const { toast } = useToast();

  /**
   * Simulated encrypted data for demonstration
   */
  const mockEncryptedProfile = {
    uid: 'user123',
    email: 'user@example.com',
    displayName_encrypted: 'encrypted_display_name_data',
    pseudonym_encrypted: 'encrypted_pseudonym_data',
    ageRange_encrypted: 'encrypted_age_range_data',
    primaryChallenge_encrypted: 'encrypted_challenge_data'
  };

  const mockEncryptedSession = {
    sessionId: 'session123',
    createdAt: new Date().toISOString(),
    circumstance_encrypted: 'encrypted_circumstance_data',
    summary_encrypted: 'encrypted_summary_data',
    userReflection_encrypted: 'encrypted_reflection_data'
  };

  /**
   * Load and decrypt user profile
   */
  const loadProfile = async () => {
    setLoading(true);
    
    try {
      const result = await enhancedEncryption.decryptProfile(mockEncryptedProfile);
      setDecryptionResults(prev => ({ ...prev, profile: result }));
      
      if (result.success) {
        setProfileData(result.data);
        toast({
          title: "Profile Loaded",
          description: "Your profile has been successfully decrypted.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Profile Decryption Failed",
          description: result.error || "Failed to decrypt profile data.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Load Error",
        description: error instanceof Error ? error.message : "Unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load and decrypt session data
   */
  const loadSession = async () => {
    setLoading(true);
    
    try {
      const result = await decryptSession(mockEncryptedSession);
      setDecryptionResults(prev => ({ ...prev, session: result }));
      
      if (result.success) {
        setSessionData(result.data);
        toast({
          title: "Session Loaded",
          description: "Session data has been successfully decrypted.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Session Decryption Failed", 
          description: result.error || "Failed to decrypt session data.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Load Error",
        description: error instanceof Error ? error.message : "Unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful retry from DecryptionRetryButton
   */
  const handleRetrySuccess = () => {
    // Reload failed data after successful passphrase retry
    if (decryptionResults.profile && !decryptionResults.profile.success) {
      loadProfile();
    }
    if (decryptionResults.session && !decryptionResults.session.success) {
      loadSession();
    }
  };

  /**
   * Auto-load data when encryption becomes available
   */
  useEffect(() => {
    if (isReady && !loading) {
      // Auto-load data when passphrase becomes available
      if (!profileData) {
        loadProfile();
      }
      if (!sessionData) {
        loadSession();
      }
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Encryption System Integration Example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Encryption Status Display */}
          <Alert className={isReady ? "border-green-200" : "border-amber-200"}>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  {isReady ? "🔒 Encryption Ready" : "⚠️ Encryption Not Available"}
                </p>
                <div className="text-sm space-y-1">
                  <p>• Has Passphrase: {status.hasPassphrase ? "✅" : "❌"}</p>
                  <p>• Session Valid: {status.sessionValid ? "✅" : "❌"}</p>
                  <p>• Can Encrypt: {status.canEncrypt ? "✅" : "❌"}</p>
                  <p>• Can Decrypt: {status.canDecrypt ? "✅" : "❌"}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={loadProfile} 
              disabled={loading || needsPassphrase}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Load Profile
            </Button>
            <Button 
              onClick={loadSession} 
              disabled={loading || needsPassphrase}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Load Session
            </Button>
          </div>

          {/* Decryption Results */}
          <div className="space-y-4">
            
            {/* Profile Result */}
            {decryptionResults.profile && (
              <Card className={decryptionResults.profile.success ? "border-green-200" : "border-red-200"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {decryptionResults.profile.success ? (
                      <>
                        <Shield className="h-4 w-4 text-green-600" />
                        Profile - Decryption Successful
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Profile - Decryption Failed
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {decryptionResults.profile.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-800">✅ Profile data successfully decrypted</p>
                      <pre className="text-xs bg-green-50 p-2 rounded">
                        {JSON.stringify(profileData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-800">❌ {decryptionResults.profile.error}</p>
                      {decryptionResults.profile.needsRetry && (
                        <DecryptionRetryButton
                          variant="inline"
                          errorMessage={decryptionResults.profile.error}
                          onRetrySuccess={handleRetrySuccess}
                          showAdvanced={true}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session Result */}
            {decryptionResults.session && (
              <Card className={decryptionResults.session.success ? "border-green-200" : "border-red-200"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {decryptionResults.session.success ? (
                      <>
                        <Shield className="h-4 w-4 text-green-600" />
                        Session - Decryption Successful
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Session - Decryption Failed
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {decryptionResults.session.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-800">✅ Session data successfully decrypted</p>
                      <pre className="text-xs bg-green-50 p-2 rounded">
                        {JSON.stringify(sessionData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-800">❌ {decryptionResults.session.error}</p>
                      {decryptionResults.session.needsRetry && (
                        <DecryptionRetryButton
                          variant="card"
                          errorMessage={decryptionResults.session.error}
                          onRetrySuccess={handleRetrySuccess}
                          showAdvanced={true}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Global Retry Button Example */}
          {needsPassphrase && (
            <DecryptionRetryButton
              variant="card"
              errorMessage="Passphrase required to decrypt user data"
              onRetrySuccess={() => {
                toast({
                  title: "Encryption Restored",
                  description: "You can now access your encrypted data.",
                });
              }}
              showAdvanced={true}
            />
          )}

        </CardContent>
      </Card>
    </div>
  );
}
