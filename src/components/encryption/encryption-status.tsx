// src/components/encryption/encryption-status.tsx
"use client";

import { Shield, Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useEncryption } from "@/lib/encryption-context";
import { getEncryptionStatus } from "@/lib/data-encryption";

interface EncryptionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function EncryptionStatus({ showDetails = false, className = "" }: EncryptionStatusProps) {
  const { isPassphraseSet } = useEncryption();
  const status = getEncryptionStatus();
  
  // Use the encryption context as the primary source, but also check sessionStorage as fallback
  const isEncryptionActive = isPassphraseSet || status.hasPassphrase;

  if (!showDetails) {
    // Compact version for headers/navigation
    return (
      <Badge 
        variant={isEncryptionActive ? "default" : "destructive"} 
        className={`flex items-center gap-1 ${className}`}
      >
        {isEncryptionActive ? (
          <>
            <Lock className="h-3 w-3" />
            Encrypted
          </>
        ) : (
          <>
            <AlertTriangle className="h-3 w-3" />
            Access Locked
          </>
        )}
      </Badge>
    );
  }

  // Detailed version for main content areas
  return (
    <Alert className={className}>
      {isEncryptionActive ? (
        <Shield className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertDescription>
        <strong>Your Privacy is Protected:</strong> {status.message}
        {isEncryptionActive && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-medium text-sm text-green-800 mb-2">🔒 What&apos;s encrypted (only you can read):</p>
              <ul className="list-disc list-inside ml-3 space-y-1 text-sm">
                <li><strong>All session content</strong> - your circumstances, reflections, and summaries</li>
                <li><strong>AI conversations</strong> - every message exchanged during sessions</li>
                <li><strong>Journal entries</strong> - titles, content, and personal tags</li>
                <li><strong>Personal feedback</strong> - your suggestions and improvement ideas</li>
                <li><strong>Profile details</strong> - name, age range, challenges, and preferences</li>
                <li><strong>Goals and insights</strong> - your progress tracking and breakthrough moments</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm text-amber-700 mb-1">📧 What&apos;s NOT encrypted:</p>
              <p className="text-sm ml-3">• Email address (needed for account login and recovery)</p>
              <p className="text-sm ml-3">• Basic timestamps (for system operations)</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md mt-3">
              <p className="text-xs text-blue-800">
                <strong>Zero-Knowledge Security:</strong> Your passphrase never leaves your device. 
                Even CognitiveInsight engineers cannot decrypt your data without your passphrase and recovery key.
              </p>
            </div>
          </div>
        )}
        {!isEncryptionActive && (
          <div className="mt-3 bg-amber-50 p-3 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>🔒 Your data IS encrypted in our database.</strong> However, you need to enter your passphrase to decrypt and view it on this device.
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function EncryptionBanner() {
  const { isPassphraseSet } = useEncryption();
  
  if (isPassphraseSet) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800">
              <strong>🔒 Zero-Knowledge Encryption Active</strong>
            </p>
            <p className="text-xs text-green-700 mt-1">
              Your data is encrypted end-to-end using your passphrase. Even our team cannot access your private information. 
              All session content, conversations, journals, and personal details are encrypted before being stored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-800">
            <strong>🔒 Data Encrypted - Access Locked</strong>
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Your data is safely encrypted in our database. Please enter your passphrase to decrypt and access your private information on this device.
          </p>
        </div>
      </div>
    </div>
  );
}
