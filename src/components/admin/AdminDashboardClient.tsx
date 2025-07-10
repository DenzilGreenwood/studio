"use client";

import { useAuth } from "@/context/auth-context-v2";
import { EnhancedAdminDashboard } from "@/components/admin/EnhancedAdminDashboard";
import { ComponentUpgradeWrapper } from "@/components/authority/ComponentUpgradeWrapper";
import { UserRole } from "@/types";
import { useEffect, useState } from "react";

export default function AdminDashboardClient() {
  const [isClient, setIsClient] = useState(false);
  const { isAdmin } = useAuth();

  // Ensure we're on the client side before rendering auth-dependent content
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse">Loading admin dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <ComponentUpgradeWrapper
        componentName="Admin Dashboard"
        requiredRole={UserRole.ADMIN}
        showUpgradeInfo={false}
      >
        <div />
      </ComponentUpgradeWrapper>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ComponentUpgradeWrapper
        componentName="Admin Dashboard"
        showUpgradeInfo={true}
      >
        <EnhancedAdminDashboard />
      </ComponentUpgradeWrapper>
    </div>
  );
}
