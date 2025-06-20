// src/app/(admin)/layout.tsx
"use client";

import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/context/auth-context";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();
    const isAdmin = useIsAdmin();

    useEffect(() => {
        if (!loading && (!firebaseUser || !isAdmin)) {
            router.push('/login'); // Redirect non-admins to the login page
        }
    }, [firebaseUser, loading, router, isAdmin]);

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 font-headline text-xl">Verifying Access...</p>
            </div>
        );
    }
    
    if (!isAdmin) {
       return (
         <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
            <Card className="max-w-md text-center border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center justify-center gap-2">
                        <ShieldCheck className="h-7 w-7" /> Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You do not have permission to view this page. Redirecting...</p>
                </CardContent>
            </Card>
         </div>
       );
    }


    return (
        <div className="flex min-h-screen flex-col bg-secondary/30">
            <AppHeader />
            <main className="flex-1">{children}</main>
             <footer className="py-6 text-center text-sm text-muted-foreground border-t">
                &copy; {new Date().getFullYear()} CognitiveInsight Admin Portal.
            </footer>
        </div>
    );
}
