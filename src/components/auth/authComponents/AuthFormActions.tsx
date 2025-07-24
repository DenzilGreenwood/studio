// src/components/auth/authComponents/AuthFormActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthFormActionsProps {
  mode: "login" | "signup";
  isSubmitting: boolean;
  isRecoveryMode: boolean;
  onToggleRecoveryMode: () => void;
}

export function AuthFormActions({ 
  mode, 
  isSubmitting, 
  isRecoveryMode, 
  onToggleRecoveryMode 
}: AuthFormActionsProps) {
  return (
    <>
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : (
          isRecoveryMode ? "Recover Passphrase" : (mode === "login" ? "Login" : "Sign Up")
        )}
      </Button>

      {mode === "login" && (
        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={onToggleRecoveryMode}
        >
          {isRecoveryMode ? "Back to Login" : "Forgot Passphrase? Zero-Knowledge Recovery"}
        </Button>
      )}

      <div className="mt-6 flex justify-center">
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-primary hover:underline">
            {mode === "login" ? "Sign up" : "Login"}
          </Link>
        </p>
      </div>
    </>
  );
}
