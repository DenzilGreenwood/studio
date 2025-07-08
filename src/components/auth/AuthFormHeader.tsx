// src/components/auth/AuthFormHeader.tsx
"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AuthFormHeaderProps {
  mode: "login" | "signup";
}

export function AuthFormHeader({ mode }: AuthFormHeaderProps) {
  return (
    <CardHeader className="text-center">
      <Link href="/" className="flex items-center justify-center gap-2 mb-4">
        <Brain className="h-10 w-10 text-primary" />
        <span className="font-headline text-3xl font-semibold text-primary">CognitiveInsight</span>
      </Link>
      <CardTitle className="font-headline text-2xl">
        {mode === "login" ? "Welcome Back" : "Create Your Account"}
      </CardTitle>
      <CardDescription>
        {mode === "login" ? (
          <span className="space-y-2 text-left block">
            <span className="block">Enter your credentials and security passphrase.</span>
            <span className="text-xs text-muted-foreground block">
              <strong>🔒 Zero-Knowledge Architecture:</strong> Following MyImaginaryFriends.ai standards - 
              your data is encrypted client-side and never accessible by CognitiveInsight staff, even during recovery.
            </span>
          </span>
        ) : (
          <span className="space-y-2 text-left block">
            <span className="block">Create your account with client-side zero-knowledge encryption.</span>
            <span className="text-xs text-muted-foreground block">
              <strong>🔒 True Privacy:</strong> Your passphrase encrypts all data in your browser before storage. 
              We never see your passphrase - even recovery happens client-side with zero server knowledge.
            </span>
          </span>
        )}
      </CardDescription>
    </CardHeader>
  );
}
