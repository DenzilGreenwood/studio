// src/app/(app)/trash/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { convertProtocolSessionTimestamps, convertTimestamp } from '@/lib/utils';

type SessionWithId = ProtocolSession & { sessionId: string };

export default function TrashPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [deletedSessions, setDeletedSessions] = useState<SessionWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    fetchDeletedSessions();
  }, [firebaseUser, authLoading]);

  const fetchDeletedSessions = async () => {
    if (!firebaseUser) return;

    try {
      setIsLoading(true);
      const sessionsRef = collection(db, `users/${firebaseUser.uid}/sessions`);
      const deletedQuery = query(
        sessionsRef,
        where('isDeleted', '==', true),
        orderBy('deletedAt', 'desc')
      );
      
      const snapshot = await getDocs(deletedQuery);
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data() as ProtocolSession;
        return convertProtocolSessionTimestamps({
          ...data,
          sessionId: doc.id
        });
      });
      
      setDeletedSessions(sessions);
    } catch (err) {
      console.error('Error fetching deleted sessions:', err);
      setError('Failed to load deleted sessions');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deleted sessions"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSession = async (sessionId: string) => {
    if (!firebaseUser) return;

    try {
      const sessionRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      await updateDoc(sessionRef, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: serverTimestamp(),
        restoredBy: firebaseUser.uid
      });

      toast({
        title: "Session Restored",
        description: "The session has been restored successfully"
      });

      // Refresh the list
      fetchDeletedSessions();
    } catch (error) {
      console.error('Error restoring session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore session"
      });
    }
  };

  const permanentlyDeleteSession = async (sessionId: string) => {
    if (!firebaseUser) return;

    try {
      const sessionRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      await deleteDoc(sessionRef);

      toast({
        title: "Session Permanently Deleted",
        description: "The session has been permanently deleted and cannot be recovered"
      });

      // Refresh the list
      fetchDeletedSessions();
    } catch (error) {
      console.error('Error permanently deleting session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to permanently delete session"
      });
    }
  };

  const emptyTrash = async () => {
    if (!firebaseUser || deletedSessions.length === 0) return;

    try {
      // Delete all sessions in trash
      const deletePromises = deletedSessions.map(session => {
        const sessionRef = doc(db, `users/${firebaseUser.uid}/sessions/${session.sessionId}`);
        return deleteDoc(sessionRef);
      });

      await Promise.all(deletePromises);

      toast({
        title: "Trash Emptied",
        description: `${deletedSessions.length} sessions have been permanently deleted`
      });

      setDeletedSessions([]);
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to empty trash"
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deleted sessions...</span>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="text-center">
        <p>Please log in to view your deleted sessions.</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
          <p className="text-gray-600 mt-2">
            Deleted sessions are kept here for 30 days before being permanently removed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/sessions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Link>
          </Button>
          {deletedSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Empty Trash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty Trash</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {deletedSessions.length} sessions in the trash. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={emptyTrash} className="bg-red-600 hover:bg-red-700">
                    Permanently Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {deletedSessions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trash2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
            <p className="text-gray-600">
              Deleted sessions will appear here and can be restored within 30 days.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {deletedSessions.map(session => (
            <Card key={session.sessionId} className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      Session from {convertTimestamp(session.startTime).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                      Topic: {session.circumstance}
                    </CardDescription>
                    <div className="text-sm text-gray-500 mt-1">
                      Deleted on {session.deletedAt ? convertTimestamp(session.deletedAt).toLocaleDateString() : ''} at {session.deletedAt ? convertTimestamp(session.deletedAt).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <Badge variant="destructive">
                    <Trash2 className="mr-1 h-3 w-3" />
                    Deleted
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {session.summary?.actualReframedBelief ? (
                  <p className="text-gray-600 italic">
                    <strong>Reframed Belief:</strong> "{session.summary.actualReframedBelief}"
                  </p>
                ) : (
                  <p className="text-gray-600 italic">
                    Session started on {convertTimestamp(session.startTime).toLocaleString()}.
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  onClick={() => restoreSession(session.sessionId)}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Permanently Delete Session</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the session from {convertTimestamp(session.startTime).toLocaleDateString()} 
                        about "{session.circumstance}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => permanentlyDeleteSession(session.sessionId)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
