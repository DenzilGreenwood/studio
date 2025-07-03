// src/components/encryption/encryption-notice.tsx
"use client";

import { Shield, Lock, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEncryption } from "@/lib/encryption-context";

interface EncryptionNoticeProps {
  variant?: "banner" | "card" | "compact";
  showDetails?: boolean;
  className?: string;
}

export function EncryptionNotice({ 
  variant = "banner", 
  showDetails = true, 
  className = "" 
}: EncryptionNoticeProps) {
  const { isPassphraseSet } = useEncryption();

  if (variant === "compact") {
    return (
      <Badge 
        variant={isPassphraseSet ? "default" : "destructive"} 
        className={`flex items-center gap-1 ${className}`}
      >
        {isPassphraseSet ? (
          <>
            <Lock className="h-3 w-3" />
            End-to-End Encrypted
          </>
        ) : (
          <>
            <AlertTriangle className="h-3 w-3" />
            Not Encrypted
          </>
        )}
      </Badge>
    );
  }

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {isPassphraseSet ? (
              <>
                <Shield className="h-5 w-5 text-green-600" />
                Your Privacy is Protected
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Privacy Protection Needed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPassphraseSet ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Zero-Knowledge Encryption Active
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    All your personal data is encrypted using your passphrase before being stored. 
                    Even CognitiveInsight engineers cannot access your private information.
                  </p>
                </div>
              </div>
              
              {showDetails && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      What&apos;s Encrypted
                    </h4>
                    <ul className="text-xs space-y-1 ml-5">
                      <li>• <strong>Session content</strong> - circumstances, reflections, summaries</li>
                      <li>• <strong>AI conversations</strong> - every message during sessions</li>
                      <li>• <strong>Journal entries</strong> - titles, content, tags</li>
                      <li>• <strong>Personal feedback</strong> - suggestions and improvement ideas</li>
                      <li>• <strong>Profile details</strong> - name, age range, challenges</li>
                      <li>• <strong>Goals & insights</strong> - progress and breakthrough moments</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      What&apos;s NOT Encrypted
                    </h4>
                    <ul className="text-xs space-y-1 ml-5">
                      <li>• Email address (for account identification)</li>
                      <li>• Basic timestamps (for system operations)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Privacy Protection Unavailable
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please log in with your passphrase to enable end-to-end encryption. 
                    Without it, your data cannot be properly protected.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default banner variant
  return (
    <Alert className={className}>
      {isPassphraseSet ? (
        <Shield className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertDescription>
        {isPassphraseSet ? (
          <div className="space-y-2">
            <p className="font-medium text-green-800">
              🔒 Zero-Knowledge Encryption Active
            </p>
            <p className="text-sm text-green-700">
              Your data is encrypted end-to-end using your passphrase. All sessions, conversations, 
              journals, and personal details are encrypted before storage. Even our team cannot 
              access your private information without your passphrase.
            </p>
            {showDetails && (
              <details className="mt-3">
                <summary className="text-sm font-medium cursor-pointer text-green-800 hover:text-green-900">
                  View encryption details
                </summary>
                <div className="mt-2 space-y-2 text-xs text-green-700">
                  <div>
                    <strong>Encrypted:</strong> Session content, AI conversations, journal entries, 
                    feedback, profile details, goals & insights
                  </div>
                  <div>
                    <strong>Not encrypted:</strong> Email address (for account access), basic timestamps
                  </div>
                  <div className="text-green-600 font-medium">
                    ⚠️ Losing both your passphrase and recovery key means encrypted data cannot be recovered by anyone.
                  </div>
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-medium text-amber-800">
              ⚠️ Privacy Protection Unavailable
            </p>
            <p className="text-sm text-amber-700">
              Please log in with your passphrase to enable end-to-end encryption. 
              Without your passphrase, we cannot protect your data privacy.
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
