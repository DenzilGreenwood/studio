// src/app/(app)/sessions/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, collectionGroup, query, where, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, History, PlusCircle, Eye, Sparkles, PenSquare } from 'lucide-react';
import Link from 'next/link';

// Add sessionId to the type for local use, as it's the document ID
type SessionWithId = ProtocolSession & { sessionId: string };

export default function SessionsPage() {
  const { firebaseUser, user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [latestSession, setLatestSession] = useState<SessionWithId | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!firebaseUser) {
      // AuthProvider should handle redirect, but as a safeguard
      setIsLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sessionsQuery = query(
          collectionGroup(db, `sessions`),
          where("userId", "==", firebaseUser.uid),
          orderBy("startTime", "desc")
        );
        const querySnapshot = await getDocs(sessionsQuery);
        const fetchedSessions: SessionWithId[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as ProtocolSession;
          // Convert Firestore Timestamps to JS Dates
          const convertTimestamp = (field: any) => 
            field instanceof Timestamp ? field.toDate() : (field ? new Date(field) : undefined);
            
          return {
            ...data,
            sessionId: doc.id,
            startTime: convertTimestamp(data.startTime)!,
            endTime: data.endTime ? convertTimestamp(data.endTime) : undefined,
          };
        });
        setSessions(fetchedSessions);

        if (fetchedSessions.length > 0) {
            setLatestSession(fetchedSessions[0]!);
        }
        
        if (user) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const lastActivityDate = user.lastCheckInAt && user.lastSessionAt
                ? new Date(Math.max(new Date(user.lastCheckInAt).getTime(), new Date(user.lastSessionAt).getTime()))
                : user.lastSessionAt ? new Date(user.lastSessionAt)
                : user.lastCheckInAt ? new Date(user.lastCheckInAt)
                : null;
            
            if (fetchedSessions.length > 0 && lastActivityDate && lastActivityDate < sevenDaysAgo) {
                setShowCheckIn(true);
            }
        }

      } catch (e: any) {
        console.error("Error fetching sessions:", e);
        setError("Failed to load your past sessions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [firebaseUser, authLoading, user]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-primary">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="mt-4 font-headline text-xl">Loading Your Sessions...</p>
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
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 min-h-screen py-8">
        <div className="container mx-auto p-4 md:p-6 max-w-3xl">
            <header className="mb-8">
                <div className="flex items-center gap-3">
                    <History className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold text-primary">Session History</h1>
                        <p className="text-muted-foreground text-lg">Review your past CognitiveInsight sessions.</p>
                    </div>
                </div>
            </header>

            {showCheckIn && latestSession && (
                <Card className="mb-8 bg-accent/20 border-accent/50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-accent-foreground/90 flex items-center gap-2">
                            <Sparkles className="h-6 w-6" /> Time for a Check-in?
                        </CardTitle>
                        <CardDescription>
                            It's been a while. Reflecting on past insights can spark new growth.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Consider revisiting your last session on "{latestSession.circumstance}" to add your thoughts.
                        </p>
                    </CardContent>
                    <CardFooter className="gap-4">
                        <Button asChild>
                            <Link href={`/session-report/${latestSession.sessionId}?circumstance=${encodeURIComponent(latestSession.circumstance)}`}>
                                <PenSquare className="mr-2 h-4 w-4" />
                                Review Last Session
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/protocol">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Start a New Session
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
            
            {sessions.length === 0 ? (
                <Card className="text-center p-8 md:p-12 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">No Sessions Yet</CardTitle>
                        <CardDescription className="text-base mt-2">
                            You haven't completed any sessions. Start your journey to clarity now.
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
            ) : (
                <div className="space-y-6">
                    {sessions.map(session => (
                        <Card key={session.sessionId} className="shadow-md hover:shadow-xl transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl text-primary">
                                    Session from {new Date(session.startTime).toLocaleDateString()}
                                </CardTitle>
                                <CardDescription>
                                    Completed for {session.circumstance} on {session.endTime ? new Date(session.endTime).toLocaleString() : new Date(session.startTime).toLocaleTimeString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {session.summary?.actualReframedBelief && (
                                    <p className="text-muted-foreground italic truncate">
                                        <strong>Reframed Belief:</strong> "{session.summary.actualReframedBelief}"
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline">
                                    <Link href={`/session-report/${session.sessionId}?circumstance=${encodeURIComponent(session.circumstance)}`}>
                                        View Full Report
                                        <Eye className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
