// src/app/(app)/sessions/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, collectionGroup, query, where, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, PlusCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Add sessionId to the type for local use, as it's the document ID
type SessionWithId = ProtocolSession & { sessionId: string };

export default function SessionsPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [selectedCircumstance, setSelectedCircumstance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const uniqueCircumstances = [...new Set(fetchedSessions.map(s => s.circumstance))];
        setCircumstances(uniqueCircumstances);
        // If there's only one circumstance, select it by default
        if (uniqueCircumstances.length > 0) {
            setSelectedCircumstance(uniqueCircumstances[0]!);
        }

      } catch (e: any) {
        console.error("Error fetching sessions:", e);
        setError("Failed to load your past sessions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [firebaseUser, authLoading]);

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
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const filteredSessions = selectedCircumstance ? sessions.filter(s => s.circumstance === selectedCircumstance) : [];

  return (
    <div className="bg-secondary/30 min-h-screen py-8">
        <div className="container mx-auto p-4 md:p-6 max-w-3xl">
            <header className="mb-8">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold text-primary">My Journal</h1>
                        <p className="text-muted-foreground text-lg">Review your past sessions, add reflections, and track your growth.</p>
                    </div>
                </div>
            </header>
            
            {sessions.length === 0 ? (
                <Card className="text-center p-8 md:p-12 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Your Journal is Empty</CardTitle>
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
                <>
                <div className="mb-6">
                    <Select value={selectedCircumstance} onValueChange={setSelectedCircumstance}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select a challenge to review..." />
                      </SelectTrigger>
                      <SelectContent>
                        {circumstances.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-6">
                    {filteredSessions.length > 0 ? filteredSessions.map(session => (
                        <Card key={session.sessionId} className="shadow-md hover:shadow-xl transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl text-primary">
                                    Session from {new Date(session.startTime).toLocaleDateString()}
                                </CardTitle>
                                <CardDescription>
                                    {session.endTime ? `Completed at ${new Date(session.endTime).toLocaleTimeString()}` : `Started at ${new Date(session.startTime).toLocaleTimeString()}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {session.summary?.insightSummary ? (
                                    <p className="text-muted-foreground italic truncate">
                                        <strong>AI Insight:</strong> "{session.summary.insightSummary}"
                                    </p>
                                ) : (
                                     <p className="text-muted-foreground italic">
                                        Session in progress or summary not available.
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button asChild>
                                    <Link href={`/session-report/${session.sessionId}?circumstance=${encodeURIComponent(session.circumstance)}`}>
                                        Open Journal Entry
                                        <Eye className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
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
