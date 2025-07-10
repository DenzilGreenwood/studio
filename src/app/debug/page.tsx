// src/app/debug/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { db, collection, query, orderBy, getDocs, doc, getDoc } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getCompleteSessionDataWithMigration } from '@/lib/session-report-utils';

export default function DebugPage() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!firebaseUser) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }

    setIsLoading(true);
    try {
      // Get all sessions
      const sessionsQuery = query(
        collection(db, `users/${firebaseUser.uid}/sessions`),
        orderBy('startTime', 'desc')
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const sessions = sessionsSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      // Get all reports
      const reportsQuery = query(
        collection(db, `users/${firebaseUser.uid}/reports`),
        orderBy('generatedAt', 'desc')
      );
      const reportsSnap = await getDocs(reportsQuery);
      const reports = reportsSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      // Get all journals
      const journalsQuery = query(
        collection(db, `users/${firebaseUser.uid}/journals`),
        orderBy('createdAt', 'desc')
      );
      const journalsSnap = await getDocs(journalsQuery);
      const journals = journalsSnap.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      // Test migration for first session if it exists
      let migrationTest = null;
      if (sessions.length > 0) {
        const firstSessionId = sessions[0].id;
        try {
          migrationTest = await getCompleteSessionDataWithMigration(firebaseUser.uid, firstSessionId);
        } catch (error: any) {
          migrationTest = { error: error?.message || 'Unknown error' };
        }
      }

      setDebugData({
        userId: firebaseUser.uid,
        email: firebaseUser.email,
        sessions: sessions,
        reports: reports,
        journals: journals,
        migrationTest: migrationTest,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Debug error:', error);
      toast({ variant: 'destructive', title: 'Debug failed', description: error?.message || 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Session Debug Tool</CardTitle>
          <p className="text-sm text-muted-foreground">
            This diagnostic page helps check session data and migration status.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostics} disabled={isLoading || !firebaseUser}>
            {isLoading ? 'Running Diagnostics...' : 'Run Session Diagnostics'}
          </Button>

          {debugData && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Debug Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
