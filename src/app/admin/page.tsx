// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, collection, query, orderBy, getDocs, Timestamp, collectionGroup, where } from '@/lib/firebase';
import type { SessionFeedback, ProtocolSession, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, BarChart2, MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Extend local types to include necessary data from queries
type FeedbackWithId = SessionFeedback & { feedbackId: string };
type SessionWithUser = ProtocolSession & { userId: string };
type GroupedSessionData = {
  user: UserProfile;
  sessions: SessionWithUser[];
};

export default function AdminPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackWithId[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<GroupedSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !firebaseUser) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all feedback
        const feedbackQuery = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
        const feedbackSnapshot = await getDocs(feedbackQuery);
        const fetchedFeedback: FeedbackWithId[] = feedbackSnapshot.docs.map(doc => ({
          ...doc.data(),
          feedbackId: doc.id,
          timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
        } as FeedbackWithId));
        setFeedback(fetchedFeedback);

        // Fetch and group sessions
        // 1. Fetch all user profiles to get display names
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map<string, UserProfile>();
        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            usersMap.set(doc.id, {
                uid: doc.id,
                email: data.email,
                displayName: data.displayName,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            } as UserProfile);
        });

        // 2. Fetch all COMPLETED sessions using a collection group query
        const sessionsQuery = query(
            collectionGroup(db, 'sessions'),
            where("completedPhases", "==", 6), // Filter for completed sessions
            orderBy("startTime", "desc")
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);

        // 3. Group sessions by userId
        const sessionsByUId = new Map<string, SessionWithUser[]>();
        sessionsSnapshot.docs.forEach(doc => {
            const sessionData = doc.data() as ProtocolSession;
            const session: SessionWithUser = {
                ...sessionData,
                sessionId: doc.id,
                userId: doc.ref.parent.parent!.id,
                startTime: (sessionData.startTime as Timestamp)?.toDate() || new Date(),
            };

            const userSessions = sessionsByUId.get(session.userId) || [];
            userSessions.push(session);
            sessionsByUId.set(session.userId, userSessions);
        });

        // 4. Combine user data and sessions data into a final structure for rendering
        const finalGroupedData: GroupedSessionData[] = Array.from(sessionsByUId.entries()).map(([userId, userSessions]) => {
            const userProfile = usersMap.get(userId) || { 
                uid: userId, 
                email: `User ID: ${userId}`, 
                displayName: 'Unknown User',
                createdAt: new Date(),
             };
            return { user: userProfile, sessions: userSessions };
        });

        // Optional: Sort users by who has the most recent session
        finalGroupedData.sort((a, b) => {
            const aLatestTime = a.sessions[0]?.startTime ? new Date(a.sessions[0].startTime).getTime() : 0;
            const bLatestTime = b.sessions[0]?.startTime ? new Date(b.sessions[0].startTime).getTime() : 0;
            return bLatestTime - aLatestTime;
        });

        setGroupedSessions(finalGroupedData);


      } catch (e: any) {
        console.error("Error fetching admin data:", e);
        setError("Failed to load admin data. Check Firestore rules and permissions.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-primary">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="mt-4 font-headline text-xl">Loading Admin Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl text-center">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
          <CardContent><p>{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          <div>
            <h1 className="font-headline text-4xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">Analysis of user feedback and session data.</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feedback"><MessageSquare className="mr-2"/>Feedback Analysis</TabsTrigger>
          <TabsTrigger value="sessions"><BarChart2 className="mr-2"/>Session Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>All User Feedback</CardTitle>
              <CardDescription>Review all feedback submissions from users across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Suggestion</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Session Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.length > 0 ? feedback.map(item => (
                      <TableRow key={item.feedbackId}>
                        <TableCell>{new Date(item.timestamp as Date).toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={
                                item.helpfulRating === 'Very helpful' ? 'default' :
                                item.helpfulRating === 'Somewhat helpful' ? 'secondary' : 'destructive'
                            } className="whitespace-nowrap">
                                {item.helpfulRating}
                            </Badge>
                        </TableCell>
                        <TableCell className="max-w-sm truncate">{item.improvementSuggestion || "N/A"}</TableCell>
                        <TableCell>{item.email || "N/A"}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/session-report/${item.sessionId}?userId=${item.userId}&circumstance=${encodeURIComponent(item.circumstance)}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No feedback submitted yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Completed User Sessions</CardTitle>
              <CardDescription>Analyze all completed user sessions, grouped by user.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full">
                {groupedSessions.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {groupedSessions.map(({ user, sessions }) => (
                      <AccordionItem value={user.uid} key={user.uid}>
                        <AccordionTrigger>
                          <div className="flex flex-col items-start text-left">
                            <span className="font-semibold">{user.displayName || user.email}</span>
                            <span className="text-sm font-normal text-muted-foreground">{user.uid} - {sessions.length} session(s)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Session Date</TableHead>
                                <TableHead>Circumstance</TableHead>
                                <TableHead>Reframed Belief</TableHead>
                                <TableHead>Legacy Statement</TableHead>
                                <TableHead>Full Report</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sessions.map(session => (
                                <TableRow key={session.sessionId}>
                                  <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
                                  <TableCell>{session.circumstance}</TableCell>
                                  <TableCell className="max-w-xs truncate">{session.summary?.actualReframedBelief || "N/A"}</TableCell>
                                  <TableCell className="max-w-xs truncate">{session.summary?.actualLegacyStatement || "N/A"}</TableCell>
                                  <TableCell>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/session-report/${session.sessionId}?userId=${session.userId}&circumstance=${encodeURIComponent(session.circumstance)}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> View
                                      </Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No completed sessions found.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
