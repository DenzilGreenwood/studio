// src/components/auth/authComponents/SignupFields.tsx
"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Control } from "react-hook-form";
import type { SignupFormValues } from "@/lib/auth-schemas";

interface SignupFieldsProps {
  control: Control<SignupFormValues>;
  showConfirmPassphrase: boolean;
  onToggleConfirmVisibility: () => void;
}

export function SignupFields({ 
  control, 
  showConfirmPassphrase, 
  onToggleConfirmVisibility 
}: SignupFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="confirmPassphrase"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Passphrase</FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  type={showConfirmPassphrase ? "text" : "password"}
                  placeholder="Confirm your passphrase"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={onToggleConfirmVisibility}
                >
                  {showConfirmPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="pseudonym"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pseudonym (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="Your chosen pseudonym" {...field} />
            </FormControl>
            <FormDescription>
              This will be your display name in the app.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
