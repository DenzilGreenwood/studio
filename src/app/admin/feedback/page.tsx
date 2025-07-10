"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the admin feedback component to prevent SSG issues
const DynamicAdminFeedback = dynamic(
  () => import('@/components/admin/AdminFeedbackClient'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse">Loading feedback analytics...</div>
          </div>
        </div>
      </div>
    )
  }
);

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicAdminFeedback />
    </Suspense>
  );
}
