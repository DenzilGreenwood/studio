"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the admin users component to prevent SSG issues
const DynamicAdminUsers = dynamic(
  () => import('@/components/admin/AdminUsersClient'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse">Loading user management...</div>
          </div>
        </div>
      </div>
    )
  }
);

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicAdminUsers />
    </Suspense>
  );
}
