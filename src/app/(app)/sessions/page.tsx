// src/app/(app)/sessions/page.tsx
"use client";

/**
 * Sessions Page - Displays user's session history
 * 
 * IMPORTANT: This page uses a corrected Firestore query to properly filter deleted sessions.
 * The query now uses where('isDeleted', '==', false) instead of the problematic 
 * where('isDeleted', '!=', true) which doesn't work reliably in Firestore.
 * 
 * For this to work correctly, all active sessions MUST have isDeleted: false explicitly set.
 * The fallback mechanism                        <CardDescription>
                            It&apos;s been a while. Reflecting on past insights can spark new growth.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Consider revisiting your last session on &ldquo;{latestSession.circumstance}&rdquo; to add your thoughts and set new goals.
                        </p> cases where the composite index isn't available.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { db, collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookOpen, PlusCircle, Eye, CheckCircle, Hourglass, Sparkles, PenSquare, Trash2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { encryptData } from '@/lib/cryptoUtils';

type SessionWithId = ProtocolSession & { sessionId: string };

// Helper function to convert timestamps to dates
const toDate = (timestamp: Timestamp | Date): Date => {
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
};

const SessionCard = ({ session, onDelete, onQuickReflect }: { 
  session: SessionWithId; 
  onDelete: (sessionId: string) => void;
  onQuickReflect: (sessionId: string, reflection: string) => void;
}) => {
  const [quickReflection, setQuickReflection] = React.useState('');
  const [isQuickReflectOpen, setIsQuickReflectOpen] = React.useState(false);
  const [isSavingReflection, setIsSavingReflection] = React.useState(false);

  const handleQuickReflectSave = async () => {
    if (!quickReflection.trim()) return;
    
    setIsSavingReflection(true);
    try {
      await onQuickReflect(session.sessionId, quickReflection);
      setQuickReflection('');
      setIsQuickReflectOpen(false);
    } finally {
      setIsSavingReflection(false);
    }
  };

  return (
    <Card key={session.sessionId} className="shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline text-2xl text-primary">
                        Session from {toDate(session.startTime).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                        Topic: {session.circumstance}
                    </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    {session.completedPhases === 6 ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Completed
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            <Hourglass className="mr-2 h-4 w-4" />
                            In Progress
                        </Badge>
                    )}
                    {/* Show journal availability indicator */}
                    {session.completedPhases === 6 && (
                        <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                <BookOpen className="mr-1 h-3 w-3" />
                                Journal Ready
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-3">
            {session.summary?.actualReframedBelief ? (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground italic">
                        <strong className="text-primary">Reframed Belief:</strong> &ldquo;{session.summary.actualReframedBelief}&rdquo;
                    </p>
                    {session.summary?.actualLegacyStatement && (
                        <p className="text-sm text-muted-foreground italic">
                            <strong className="text-purple-600">Legacy:</strong> &ldquo;{session.summary.actualLegacyStatement}&rdquo;
                        </p>
                    )}
                    {session.summary?.topEmotions && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Emotions:</span>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {session.summary.topEmotions}
                            </Badge>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-muted-foreground italic">
                    Session started on {toDate(session.startTime).toLocaleString()}.
                </p>
            )}
        </CardContent>
        <CardFooter className="flex gap-2">
            <div className="flex gap-2 flex-1">
                {session.completedPhases === 6 ? (
                    <>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href={`/session-report/${session.sessionId}`}>
                                View Report
                                <Eye className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="default" className="flex-1">
                            <Link href={`/journal-v2/${session.sessionId}`}>
                                Open Journal
                                <PenSquare className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Dialog open={isQuickReflectOpen} onOpenChange={setIsQuickReflectOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Quick Reflection</DialogTitle>
                                    <DialogDescription>
                                        Jot down a quick thought about your session from {toDate(session.startTime).toLocaleDateString()}
                                    </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    placeholder="What stands out to you about this session? How are you feeling about it now?"
                                    value={quickReflection}
                                    onChange={(e) => setQuickReflection(e.target.value)}
                                    className="min-h-[100px]"
                                />
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsQuickReflectOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleQuickReflectSave}
                                        disabled={!quickReflection.trim() || isSavingReflection}
                                    >
                                        {isSavingReflection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Reflection
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                ) : (
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/protocol`}>
                            Continue Session
                            <Eye className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Move to Trash</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will move the session from {toDate(session.startTime).toLocaleDateString()} to the trash. 
                            You can restore it from the trash within 30 days.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(session.sessionId)}>
                            Move to Trash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
  );
};

export default function SessionsPage() {
  const { firebaseUser, user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [selectedCircumstance, setSelectedCircumstance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_showCheckIn, _setShowCheckIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // First try with the composite query
        // NOTE: This query requires that all active sessions have isDeleted: false
        // If sessions are missing the isDeleted field, they won't be returned
        let querySnapshot;
        try {
          const sessionsQuery = query(
            collection(db, `users/${firebaseUser.uid}/sessions`),
            where('isDeleted', '==', false), // Corrected: Query for explicitly non-deleted sessions
            orderBy("startTime", "desc")
          );
          querySnapshot = await getDocs(sessionsQuery);
        } catch (indexError) {
          console.log("Composite index not available, falling back to basic query:", indexError);
          
          // Fallback: Get all sessions without isDeleted filter
          const allSessionsQuery = query(
            collection(db, `users/${firebaseUser.uid}/sessions`),
            orderBy("startTime", "desc")
          );
          const allSessionsSnap = await getDocs(allSessionsQuery);
          
          // Filter out deleted sessions in memory
          const filteredDocs = allSessionsSnap.docs.filter(doc => !doc.data().isDeleted);
          querySnapshot = { docs: filteredDocs };
        }
        
        const fetchedSessions: SessionWithId[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as ProtocolSession;
          const convertTimestamp = (field: unknown) => 
            field instanceof Timestamp ? field.toDate() : (field ? new Date(field as string | number | Date) : undefined);
            
          return {
            ...data,
            sessionId: doc.id,
            startTime: convertTimestamp(data.startTime)!,
            endTime: data.endTime ? convertTimestamp(data.endTime) : undefined,
          };
        });
        setSessions(fetchedSessions);

        console.log("Debug - Fetched sessions:", fetchedSessions.length);
        console.log("Debug - Sessions data:", fetchedSessions);
        console.log("Debug - Completed sessions:", fetchedSessions.filter(s => s.completedPhases === 6));
        console.log("Debug - In progress sessions:", fetchedSessions.filter(s => s.completedPhases < 6));

        const uniqueCircumstances = [...new Set(fetchedSessions.map(s => s.circumstance))];
        setCircumstances(uniqueCircumstances);
        // Auto-select the first circumstance if only one exists, or show all if multiple
        if (uniqueCircumstances.length === 1) {
            setSelectedCircumstance(uniqueCircumstances[0]!);
        } else if (uniqueCircumstances.length > 1) {
            // Set to empty string to show all sessions by default
            setSelectedCircumstance('');
        }

      } catch (error: unknown) {
        console.error("Error fetching sessions:", error);
        console.log("Debug - User ID:", firebaseUser?.uid);
        console.log("Debug - Auth state:", { firebaseUser: !!firebaseUser, authLoading });
        setError("Failed to load your past sessions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [firebaseUser, authLoading, user]);

  const deleteSession = async (sessionId: string) => {
    if (!firebaseUser) return;

    try {
      const sessionRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      await updateDoc(sessionRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: firebaseUser.uid
      });

      toast({
        title: "Session moved to trash",
        description: "The session has been moved to trash and can be restored within 30 days"
      });

      // Remove from current sessions list
      setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete session"
      });
    }
  };

  const handleQuickReflect = async (sessionId: string, reflection: string) => {
    if (!firebaseUser) return;

    try {
      // Get user's passphrase from session storage for encryption
      const passphrase = sessionStorage.getItem('userPassphrase');
      if (!passphrase) {
        toast({
          variant: 'destructive',
          title: 'Encryption Error',
          description: 'Cannot encrypt reflection - passphrase not available. Please refresh and try again.'
        });
        return;
      }

      // Encrypt the reflection text
      const encryptedReflection = await encryptData(reflection, passphrase);

      // Store encrypted quick reflection in the session document
      const sessionRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      const currentDate = new Date().toISOString();
      
      await updateDoc(sessionRef, {
        [`quickReflections.${currentDate}`]: {
          text_encrypted: encryptedReflection,
          createdAt: serverTimestamp()
        }
      });

      toast({
        title: 'Reflection saved',
        description: 'Your quick reflection has been encrypted and saved to this session.'
      });
    } catch (error) {
      console.error('Error saving quick reflection:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your reflection. Please try again.'
      });
    }
  };

  const { completedSessions, inProgressSessions } = useMemo(() => {
    const completed = sessions.filter(s => s.completedPhases === 6);
    const inProgress = sessions.filter(s => s.completedPhases < 6);
    return { completedSessions: completed, inProgressSessions: inProgress };
  }, [sessions]);
  
  const latestSession = sessions.length > 0 ? sessions[0]! : null;


  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-primary">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="mt-4 font-headline text-xl">Loading Your Journal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-3xl text-center">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent><p>{error}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  const filteredSessions = selectedCircumstance 
    ? sessions.filter(s => s.circumstance === selectedCircumstance) 
    : sessions; // Show ALL sessions if no specific circumstance is selected

  return (
    <div className="bg-secondary/30 min-h-screen py-8">
        <div className="container mx-auto p-4 md:p-6 max-w-3xl">
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-10 w-10 text-primary" />
                        <div>
                            <h1 className="font-headline text-4xl font-bold text-primary">Session History</h1>
                            <p className="text-muted-foreground text-lg">Access your sessions, view detailed reports, and open your personal journal with AI insights and goal tracking.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/trash">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Trash
                        </Link>
                    </Button>
                </div>
                 <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                    <Link href="/protocol">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Start a New Session
                    </Link>
                </Button>
            </header>

            {/* Journal Features Info Card */}
            <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <PenSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-primary mb-2">Enhanced Journaling Experience</h3>
                            <p className="text-muted-foreground text-sm mb-3">
                                Each completed session now includes a personal journal with AI-generated insights, emotional analysis, and personalized goal tracking.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-xs">AI Reflection</Badge>
                                <Badge variant="secondary" className="text-xs">Goal Tracking</Badge>
                                <Badge variant="secondary" className="text-xs">Progress Analytics</Badge>
                                <Badge variant="secondary" className="text-xs">Personal Notes</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {_showCheckIn && latestSession && (
                <Card className="mb-8 bg-accent/20 border-accent/50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-accent-foreground/90 flex items-center gap-2">
                            <Sparkles className="h-6 w-6" /> Time for a Check-in?
                        </CardTitle>
                        <CardDescription>
                            It&apos;s been a while. Reflecting on past insights can spark new growth.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Consider revisiting your last session on &ldquo;{latestSession.circumstance}&rdquo; to add your thoughts and set new goals.
                        </p>
                    </CardContent>
                    <CardFooter className="gap-4">
                        <Button asChild>
                            <Link href={`/session-report/${latestSession.sessionId}`}>
                                <PenSquare className="mr-2 h-4 w-4" />
                                Review & Journal
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
            
            {sessions.length === 0 ? (
                <Card className="text-center p-8 md:p-12 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Your Journal is Empty</CardTitle>
                        <CardDescription className="text-base mt-2">
                            You haven&apos;t completed any sessions yet. Start your journey to clarity now.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg">
                            <Link href="/protocol">
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Start Your First Session
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <Select value={selectedCircumstance} onValueChange={setSelectedCircumstance}>
                          <SelectTrigger className="w-full md:w-[400px]">
                            <SelectValue placeholder="Select a challenge to review..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Challenges ({sessions.length} sessions)</SelectItem>
                            {circumstances.map(c => {
                                const challengeSessions = sessions.filter(s => s.circumstance === c);
                                const completedCount = challengeSessions.filter(s => s.completedPhases === 6).length;
                                const inProgressCount = challengeSessions.length - completedCount;
                                return (
                                    <SelectItem key={c} value={c}>
                                      {c} ({challengeSessions.length} total: {completedCount} completed, {inProgressCount} in progress)
                                    </SelectItem>
                                );
                            })}
                          </SelectContent>
                        </Select>
                        
                        {/* Session Stats */}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>{completedSessions.length} Completed</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Hourglass className="h-4 w-4 text-orange-600" />
                                <span>{inProgressSessions.length} In Progress</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Debug info */}
                    <div className="mt-2 text-sm text-muted-foreground">
                      Showing {filteredSessions.length} of {sessions.length} total sessions
                      {selectedCircumstance && ` for "${selectedCircumstance}"`}
                    </div>
                </div>
                
                <div className="space-y-6">
                    {filteredSessions.length > 0 ? filteredSessions.map(session => (
                        <SessionCard key={session.sessionId} session={session} onDelete={deleteSession} onQuickReflect={handleQuickReflect} />
                    )) : (
                        <Card className="text-center p-8">
                             <CardHeader>
                                <CardTitle className="font-headline text-2xl">No sessions for this challenge</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Please select another challenge from the dropdown above, or start a new session.
                                </CardDescription>
                             </CardHeader>
                             <CardContent>
                                <Button asChild size="lg">
                                    <Link href="/protocol">
                                        <PlusCircle className="mr-2 h-5 w-5" />
                                        Start a New Session
                                    </Link>
                                </Button>
                             </CardContent>
                        </Card>
                    )}
                </div>
                </>
            )}
        </div>
    </div>
  );
}
