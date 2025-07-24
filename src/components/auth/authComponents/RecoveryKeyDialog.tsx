// src/components/auth/authComponents/RecoveryKeyDialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Copy, AlertCircle } from "lucide-react";
import { selectAllText, copyToClipboard } from "@/lib/clipboard-utils";

interface RecoveryKeyDialogProps {
  isOpen: boolean;
  recoveryKey: string;
  onClose: () => void;
}

export function RecoveryKeyDialog({ isOpen, recoveryKey, onClose }: RecoveryKeyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Critical: Save Your Recovery Key
          </DialogTitle>
          <DialogDescription>
            This key is the ONLY way to recover your passphrase. We cannot help you if you lose it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div 
            className="p-4 bg-muted rounded-lg font-mono text-sm break-all select-all cursor-text"
            id="recovery-key-text"
            onClick={() => selectAllText('recovery-key-text')}
          >
            {recoveryKey}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => copyToClipboard(recoveryKey, 'recovery-key-text')} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Key
            </Button>
            <Button onClick={onClose} className="w-full flex-1" variant="outline">
              I&apos;ve Saved It
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Losing both your passphrase and this recovery key will result in permanent data loss.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
