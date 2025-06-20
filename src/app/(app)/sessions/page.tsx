'use client';
import {useEffect, useState} from 'react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {db} from '@/lib/firebase';
import {collection, getDocs, orderBy, query} from 'firebase/firestore';
import {ProtocolSession} from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {History} from 'lucide-react';

export default function SessionsPage() {
  const {user, loading: authLoading} = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ProtocolSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const q = query(
          collection(db, 'users', user.uid, 'sessions'),
          orderBy('startTime', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedSessions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate(),
          } as ProtocolSession;
        });
        setSessions(fetchedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="font-headline text-3xl font-bold mb-4">Session History</h1>
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-3xl font-bold">Session History</h1>
      </div>

      {sessions.length === 0 ? (
        <p>You have no past sessions.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>
                  Session from{' '}
                  {session.startTime instanceof Date
                    ? session.startTime.toLocaleDateString()
                    : 'Unknown Date'}
                </CardTitle>
                <CardDescription>
                  {session.isComplete
                    ? `Completed on ${
                        session.endTime instanceof Date
                          ? session.endTime.toLocaleString()
                          : 'N/A'
                      }`
                    : 'In progress'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {session.isComplete ? (
                  <Button asChild>
                    <Link href={`/session-report/${session.id}`}>
                      View Full Report
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This session was not completed.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
