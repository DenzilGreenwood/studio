// src/app/(app)/clean-report/[sessionId]/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { CleanSessionReportComponent } from '@/components/reports/clean-session-report';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function CleanReportPage() {
  const params = useParams();
  const { firebaseUser, loading } = useAuth();
  const sessionId = params?.sessionId as string;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view your session report.</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="text-center py-12">
        <p>Session ID not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CleanSessionReportComponent sessionId={sessionId} />
    </div>
  );
}
