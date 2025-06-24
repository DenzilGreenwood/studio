// src/app/(app)/sessions/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, collectionGroup, query, where, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, History, PlusCircle, Eye, Sparkles, PenSquare, CheckCircle, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

type SessionWithId = ProtocolSession & { sessionId: string };

const SessionCard = ({ session }: { session: SessionWithId }) => (
    <Card key={session.sessionId} className="shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline text-2xl text-primary">
                        Session from {new Date(session.startTime).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                        Topic: {session.circumstance}
                    </CardDescription>
                </div>
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
            </div>
        </CardHeader>
        <CardContent>
            {session.summary?.actualReframedBelief ? (
                <p className="text-muted-foreground italic truncate">
                    <strong>Reframed Belief:</strong> "{session.summary.actualReframedBelief}"
                </p>
            ) : (
                <p className="text-muted-foreground italic">
                    Session started on {new Date(session.startTime).toLocaleString()}.
                </p>
            )}
        </CardContent>
        <CardFooter>
            <Button asChild variant="outline">
                <Link href={session.completedPhases === 6 ? `/session-report/${session.sessionId}` : `/protocol`}>
                    {session.completedPhases === 6 ? 'View Full Report' : 'Continue Session'}
                    <Eye className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function SessionsPage() {
  const { firebaseUser, user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    if (authLoading || !firebaseUser) {
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
        
        if (user && fetchedSessions.length > 0) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const lastActivityDate = user.lastCheckInAt && user.lastSessionAt
                ? new Date(Math.max(new Date(user.lastCheckInAt).getTime(), new Date(user.lastSessionAt).getTime()))
                : user.lastSessionAt ? new Date(user.lastSessionAt)
                : user.lastCheckInAt ? new Date(user.lastCheckInAt)
                : null;
            
            if (lastActivityDate && lastActivityDate < sevenDaysAgo) {
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
          <CardContent><p>{error}</p></CardContent>
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
                 <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                    <Link href="/protocol">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Start a New Session
                    </Link>
                </Button>
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
                            Consider revisiting your last session on "{latestSession.circumstance}" to add your thoughts and set new goals.
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
                        <CardTitle className="font-headline text-2xl">No Sessions Yet</CardTitle>
                        <CardDescription className="text-base mt-2">
                            You haven't completed any sessions. Start your journey to clarity now.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Tabs defaultValue="completed" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="completed">Completed ({completedSessions.length})</TabsTrigger>
                        <TabsTrigger value="in-progress">In Progress ({inProgressSessions.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="completed">
                        {completedSessions.length > 0 ? (
                            <div className="space-y-6 mt-6">
                                {completedSessions.map(session => (
                                    <SessionCard key={session.sessionId} session={session} />
                                ))}
                            </div>
                        ) : (
                             <Card className="text-center p-8 mt-6">
                                <CardTitle>No Completed Sessions</CardTitle>
                                <CardDescription>Finish a session to see it here.</CardDescription>
                             </Card>
                        )}
                    </TabsContent>
                    <TabsContent value="in-progress">
                        {inProgressSessions.length > 0 ? (
                            <div className="space-y-6 mt-6">
                                {inProgressSessions.map(session => (
                                    <SessionCard key={session.sessionId} session={session} />
                                ))}
                            </div>
                        ) : (
                             <Card className="text-center p-8 mt-6">
                                <CardTitle>No Sessions In Progress</CardTitle>
                                <CardDescription>Start a new session to get going!</CardDescription>
                             </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    </div>
  );
}
