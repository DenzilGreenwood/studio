// src/components/auth/PassphraseRecoveryDisplay.tsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PassphraseRecoveryDisplayProps {
  recoveredPassphrase: string;
}

export function PassphraseRecoveryDisplay({ recoveredPassphrase }: PassphraseRecoveryDisplayProps) {
  const { toast } = useToast();

  if (!recoveredPassphrase) return null;

  const handleCopyPassphrase = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(recoveredPassphrase);
        toast({ title: "Copied", description: "Passphrase copied to clipboard" });
      } else {
        // Auto-select the passphrase text for manual copying
        const codeElement = document.querySelector('code[data-passphrase]') as HTMLElement;
        if (codeElement) {
          const range = document.createRange();
          range.selectNodeContents(codeElement);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        toast({ 
          title: "Copy Manually", 
          description: "Text selected. Press Ctrl+C (or Cmd+C) to copy.",
          duration: 3000
        });
      }
    } catch {
      toast({ 
        variant: "destructive",
        title: "Copy Failed", 
        description: "Please select and copy the passphrase manually." 
      });
    }
  };

  return (
    <Alert className="border-green-200 bg-green-50">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription>
        <span className="space-y-3 block">
          <span className="block">
            <strong className="text-green-800">🔐 Zero-Knowledge Recovery Complete</strong>
            <span className="text-sm text-green-700 mt-1 block">
              Your passphrase has been decrypted locally in your browser. Save it securely:
            </span>
          </span>
          <span className="bg-white border border-green-300 rounded-md p-3 block">
            <span className="flex items-center justify-between">
              <code className="text-lg font-mono text-gray-900 select-all break-all" data-passphrase>
                {recoveredPassphrase}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPassphrase}
                className="ml-2 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </span>
          </span>
          <span className="text-xs text-green-600 space-y-1 block">
            <span className="block">✅ <strong>Zero-Knowledge:</strong> This passphrase was never sent via email or stored in logs</span>
            <span className="block">✅ <strong>Client-Side:</strong> Decryption happened entirely in your browser</span>
            <span className="block">✅ <strong>Private:</strong> Only you can see this passphrase</span>
          </span>
        </span>
      </AlertDescription>
    </Alert>
  );
}
