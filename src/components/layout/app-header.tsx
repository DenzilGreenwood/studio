// src/components/layout/app-header.tsx
"use client";

import Link from "next/link";
import { Brain, UserCircle, LogOut, ChevronDown, Trash2, Loader2, BookOpen, Play, TrendingUp, Map, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncryptionNotice } from "@/components/encryption/encryption-notice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import { db, collection, query, orderBy, getDocs } from "@/lib/firebase";
import type { ProtocolSession } from "@/types";

export function AppHeader() {
  const { user, firebaseUser, loading, logout, deleteUserAccountAndData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSession, setActiveSession] = useState<ProtocolSession | null>(null);
  const [_checkingSession, setCheckingSession] = useState(false);

  // Check for active sessions
  const checkForActiveSession = React.useCallback(async () => {
    if (!firebaseUser) {
      setActiveSession(null);
      return;
    }

    setCheckingSession(true);
    try {
      // Get all sessions and filter in memory to avoid index requirements
      const allSessionsQuery = query(
        collection(db, `users/${firebaseUser.uid}/sessions`),
        orderBy("startTime", "desc")
      );
      const allSessionsSnap = await getDocs(allSessionsQuery);
      
      // Find the first active session (completedPhases < 6)
      const activeSessionDoc = allSessionsSnap.docs.find(doc => {
        const data = doc.data();
        return (data.completedPhases || 0) < 6;
      });
      
      if (activeSessionDoc) {
        const sessionData = activeSessionDoc.data() as ProtocolSession;
        setActiveSession({
          ...sessionData,
          sessionId: activeSessionDoc.id
        });
      } else {
        setActiveSession(null);
      }
    } catch {
      setActiveSession(null);
    } finally {
      setCheckingSession(false);
    }
  }, [firebaseUser]);

  // Check for active sessions when user changes
  useEffect(() => {
    checkForActiveSession();
  }, [checkForActiveSession]);

  const handleContinueSession = () => {
    router.push('/protocol');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/");
    } catch {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccountAndData();
      toast({ title: "Account Deleted", description: "Your account and all associated data have been successfully deleted." });
      setIsDeleteDialogOpen(false); // Close dialog
      router.push("/"); // Redirect to homepage
    } catch (error: unknown) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Account Deletion Failed",
        description: error instanceof Error ? error.message : "Could not delete your account. Please try again or contact support.",
        duration: 10000, // Longer duration for important errors
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return "U";
    if (nameParts.length === 1) return nameParts[0]![0]!.toUpperCase();
    return (nameParts[0]![0]! + (nameParts.length > 1 ? nameParts[nameParts.length - 1]![0]! : '')).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href={user ? "/protocol" : "/"} className="flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-semibold text-primary">CognitiveInsight</span>
        </Link>

        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <EncryptionNotice variant="compact" />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {/* <AvatarImage src={user.photoURL} alt={user.displayName || "User"} /> */}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.displayName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">{user.displayName || user.email}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Continue Session Button */}
              {activeSession && (
                <>
                  <DropdownMenuItem 
                    onClick={handleContinueSession}
                    className="bg-primary/5 text-primary focus:bg-primary/10 focus:text-primary py-3"
                  >
                    <Play className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-medium">Continue Session</span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {activeSession.circumstance}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/sessions')}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Session History</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/clarity-map')}>
                <Map className="mr-2 h-4 w-4" />
                <span>Clarity Maps</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/insight-report')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Insight Reports</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/my-progress')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                <span>My Progress</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        ) : (
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers. This includes all your CognitiveInsight sessions, summaries, and feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccountConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, delete my account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
