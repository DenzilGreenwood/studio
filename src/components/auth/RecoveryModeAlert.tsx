// src/components/auth/RecoveryModeAlert.tsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key } from "lucide-react";

interface RecoveryModeAlertProps {
  isRecoveryMode: boolean;
}

export function RecoveryModeAlert({ isRecoveryMode }: RecoveryModeAlertProps) {
  if (!isRecoveryMode) return null;

  return (
    <Alert>
      <Key className="h-4 w-4" />
      <AlertDescription>
        <strong>Zero-Knowledge Recovery Mode:</strong> You&apos;ll need your recovery key AND account password. 
        Your passphrase will be decrypted in your browser and displayed to you - never emailed or logged.
        <br />
        <small className="text-xs mt-1 block text-muted-foreground">
          Following MyImaginaryFriends.ai zero-knowledge architecture.
        </small>
      </AlertDescription>
    </Alert>
  );
}
