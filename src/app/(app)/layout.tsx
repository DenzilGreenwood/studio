// src/app/(app)/layout.tsx
"use client"; 

import { AppHeader } from "@/components/layout/app-header";
import { EncryptionBanner } from "@/components/encryption/encryption-status";
import { useAuth } from "@/context/auth-context-v2";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Footer } from "@/components/layout/footer";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, loading } = useAuth(); // Use firebaseUser for auth check, user (UserProfile) for data
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="h-16 w-16 animate-pulse text-primary" />
        <p className="mt-4 font-headline text-xl">Loading CognitiveInsight...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    // This is a fallback, useEffect should redirect.
    // Or, you can return null or a minimal non-interactive layout.
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <EncryptionBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
