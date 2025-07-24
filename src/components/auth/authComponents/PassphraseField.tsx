// src/components/auth/authComponents/PassphraseField.tsx
"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Control } from "react-hook-form";
import type { LoginFormValues, SignupFormValues } from "@/lib/auth-schemas";

interface PassphraseFieldProps {
  control: Control<LoginFormValues | SignupFormValues>;
  showPassphrase: boolean;
  onToggleVisibility: () => void;
  isRecoveryMode?: boolean;
}

export function PassphraseField({ 
  control, 
  showPassphrase, 
  onToggleVisibility, 
  isRecoveryMode = false 
}: PassphraseFieldProps) {
  if (isRecoveryMode) {
    return null; // Don't show passphrase field in recovery mode
  }

  return (
    <FormField
      control={control}
      name="passphrase"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Passphrase
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input 
                type={showPassphrase ? "text" : "password"}
                placeholder="Enter your 8+ character passphrase"
                {...field}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={onToggleVisibility}
              >
                {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </FormControl>
          <div className="text-sm text-muted-foreground">
            <div className="space-y-1">
              <span className="text-xs block">This passphrase encrypts <strong>all your personal data</strong>:</span>
              <ul className="text-xs list-disc list-inside ml-2 space-y-0">
                <li>Session content & AI conversations</li>
                <li>Journal entries & personal reflections</li>
                <li>Goals, insights & feedback</li>
                <li>Profile details (name, challenges, etc.)</li>
              </ul>
              <span className="text-xs mt-1 font-medium block">⚠️ Only you can decrypt this data.</span>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
