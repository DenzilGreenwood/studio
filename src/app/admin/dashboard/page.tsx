"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the admin dashboard to prevent SSG issues
const DynamicAdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboardClient'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    )
  }
);

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicAdminDashboard />
    </Suspense>
  );
}
