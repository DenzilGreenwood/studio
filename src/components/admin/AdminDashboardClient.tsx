"use client";

import { useAuth } from "@/context/auth-context-v2";
import { EnhancedAdminDashboard } from "@/components/admin/EnhancedAdminDashboard";
import { ComponentUpgradeWrapper } from "@/components/authority/ComponentUpgradeWrapper";
import { UserRole } from "@/types";

export default function AdminDashboardClient() {
  const { isAdmin } = useAuth();

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
