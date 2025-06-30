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
import { getCurrentUserCount, getMaxUsers } from '@/lib/user-limit';

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
  const [userCount, setUserCount] = useState<number>(0);
  const [maxUsers] = useState<number>(getMaxUsers());
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
            // The parent of a doc in a collection group is the user doc
            const parentPath = doc.ref.parent.parent?.path;
            if (!parentPath) return; // Should not happen

            const userId = parentPath.split('/')[1];
            if (!userId) return;

            const session: SessionWithUser = {
                ...sessionData,
                sessionId: doc.id,
                userId: userId,
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
                displayName: `User...${userId.slice(-7)}`,
                createdAt: new Date(),
             };
            return { user: userProfile, sessions: userSessions };
        });

        // Optional: Sort users by who has the most recent session
        finalGroupedData.sort((a, b) => {
            const aLatestTime = a.sessions[0]?.startTime ? 
                (a.sessions[0].startTime instanceof Date 
                    ? a.sessions[0].startTime.getTime() 
                    : a.sessions[0].startTime.toDate().getTime()) : 0;
            const bLatestTime = b.sessions[0]?.startTime ? 
                (b.sessions[0].startTime instanceof Date 
                    ? b.sessions[0].startTime.getTime() 
                    : b.sessions[0].startTime.toDate().getTime()) : 0;
            return bLatestTime - aLatestTime;
        });

        setGroupedSessions(finalGroupedData);

        // Fetch current user count
        const currentUserCount = await getCurrentUserCount();
        setUserCount(currentUserCount);

      } catch (e: unknown) {
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

      {/* Admin Tools */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Admin Tools</CardTitle>
          <CardDescription>Migration and maintenance tools for the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Link href="/admin/migration">
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Session Migration Tool
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
          <CardDescription>Current user registration status and limits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Total Users</h3>
              <p className="text-3xl font-bold text-primary">{userCount}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-lg">Users with Sessions</h3>
              <p className="text-3xl font-bold text-amber-700">{groupedSessions.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-lg">Registration Limit</h3>
              <p className="text-3xl font-bold text-red-700">{maxUsers}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {maxUsers - userCount} slots remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                            <Link href={`/session-report/${item.sessionId}?userId=${item.userId}`} target="_blank">
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
                                <TableHead>Age Range</TableHead>
                                <TableHead>Circumstance</TableHead>
                                <TableHead>Reframed Belief</TableHead>
                                <TableHead>Legacy Statement</TableHead>
                                <TableHead>Full Report</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sessions.map(session => (
                                <TableRow key={session.sessionId}>
                                  <TableCell>
                                    {session.startTime instanceof Date 
                                      ? session.startTime.toLocaleString()
                                      : session.startTime.toDate().toLocaleString()}
                                  </TableCell>
                                  <TableCell>{session.ageRange || 'N/A'}</TableCell>
                                  <TableCell>{session.circumstance}</TableCell>
                                  <TableCell className="max-w-xs truncate">{session.summary?.actualReframedBelief || "N/A"}</TableCell>
                                  <TableCell className="max-w-xs truncate">{session.summary?.actualLegacyStatement || "N/A"}</TableCell>
                                  <TableCell>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/session-report/${session.sessionId}?userId=${session.userId}`} target="_blank">
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
