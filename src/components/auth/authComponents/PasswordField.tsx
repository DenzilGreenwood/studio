// src/components/auth/authComponents/PasswordField.tsx
"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import type { LoginFormValues, SignupFormValues } from "@/lib/auth-schemas";

interface PasswordFieldProps {
  control: Control<LoginFormValues | SignupFormValues>;
}

export function PasswordField({ control }: PasswordFieldProps) {
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input type="password" placeholder="••••••••" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
