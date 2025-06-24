// src/app/(admin)/layout.tsx
"use client";

import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/context/auth-context";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuth();
    const isAdmin = useIsAdmin();

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 font-headline text-xl">Verifying Access...</p>
            </div>
        );
    }
    
    if (!firebaseUser || !isAdmin) {
       notFound();
    }


    return (
        <div className="flex min-h-screen flex-col bg-secondary/30">
            <AppHeader />
            <main className="flex-1">{children}</main>
             <footer className="py-6 text-center text-sm text-muted-foreground border-t">
                &copy; 2024 CognitiveInsight Admin Portal.
            </footer>
        </div>
    );
}
