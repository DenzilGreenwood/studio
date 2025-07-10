"use client";

import { useAuth } from "@/context/auth-context-v2";
import { AdminFeedbackDashboard } from "@/components/admin/AdminFeedbackDashboard";
import { ComponentUpgradeWrapper } from "@/components/authority/ComponentUpgradeWrapper";
import { UserRole } from "@/types";

export default function AdminFeedbackClient() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return (
      <ComponentUpgradeWrapper
        componentName="Feedback Analytics"
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
        componentName="Feedback Analytics"
        showUpgradeInfo={true}
      >
        <AdminFeedbackDashboard />
      </ComponentUpgradeWrapper>
    </div>
  );
}
