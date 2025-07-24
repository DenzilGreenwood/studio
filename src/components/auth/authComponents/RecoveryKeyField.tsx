// src/components/auth/authComponents/RecoveryKeyField.tsx
"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { Control } from "react-hook-form";
import type { LoginFormValues } from "@/lib/auth-schemas";

interface RecoveryKeyFieldProps {
  control: Control<LoginFormValues>;
  isRecoveryMode: boolean;
}

export function RecoveryKeyField({ control, isRecoveryMode }: RecoveryKeyFieldProps) {
  if (!isRecoveryMode) {
    return null; // Only show in recovery mode
  }

  return (
    <FormField
      control={control}
      name="recoveryKey"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Recovery Key
          </FormLabel>
          <FormControl>
            <Input 
              placeholder="Enter your 64-character recovery key"
              className="font-mono text-sm"
              {...field}
              onChange={(e) => {
                const cleanedValue = e.target.value.replace(/\s/g, '').toLowerCase();
                field.onChange(cleanedValue);
              }}
            />
          </FormControl>
          <FormDescription className="space-y-1">
            <span className="block">Enter the recovery key you saved during signup.</span>
            <span className="block text-xs text-muted-foreground">
              Format: 64-character hexadecimal string (0-9, a-f)
            </span>
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
