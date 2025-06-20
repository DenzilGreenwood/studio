'use client';

import {useEffect, useState} from 'react';
import {useIsAdmin} from '@/hooks/use-is-admin';
import {useRouter} from 'next/navigation';
import {db} from '@/lib/firebase';
import {collectionGroup, getDocs, query, orderBy} from 'firebase/firestore';
import {ProtocolSession, SessionFeedback} from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ProtocolSession[]>([]);
  const [feedback, setFeedback] = useState<SessionFeedback[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      // maybe a small delay to prevent flash of content
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all sessions
        const sessionsQuery = query(
          collectionGroup(db, 'sessions'),
          orderBy('startTime', 'desc')
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const fetchedSessions = sessionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate(),
          } as ProtocolSession;
        });
        setSessions(fetchedSessions);

        // Fetch all feedback
        const feedbackQuery = query(
          collection(db, 'feedback'),
          orderBy('timestamp', 'desc')
        );
        const feedbackSnapshot = await getDocs(feedbackQuery);
        const fetchedFeedback = feedbackSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate(),
          } as SessionFeedback;
        });
        setFeedback(fetchedFeedback);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, router]);

  if (loading) {
    return <div>Loading admin dashboard...</div>;
  }

  if (!isAdmin) {
    return null; // or a redirect component
  }

  const averageRating =
    feedback.filter(f => f.helpfulRating).length > 0
      ? 'N/A' // Simple placeholder for now
      : 'N/A';

  return (
    <div className="container mx-auto py-8">
      <h1 className="font-headline text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feedback Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{feedback.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg. Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{averageRating}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            A list of all user sessions recorded on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Insight</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 10).map(session => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono text-xs">
                    {session.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {session.userId}
                  </TableCell>
                  <TableCell>
                    {session.startTime instanceof Date
                      ? session.startTime.toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {session.isComplete ? 'Completed' : 'In Progress'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {session.summary?.insightSummary || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/session-report/${session.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            A list of all feedback submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Suggestion</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Session ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.slice(0, 10).map(fb => (
                <TableRow key={fb.id}>
                  <TableCell>
                    {fb.timestamp instanceof Date
                      ? fb.timestamp.toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{fb.helpfulRating}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {fb.improvementSuggestion || 'N/A'}
                  </TableCell>
                  <TableCell>{fb.email || 'N/A'}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/session-report/${fb.sessionId}`}
                      className="underline hover:text-primary"
                    >
                      {fb.sessionId}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
