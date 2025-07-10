"use client";

import { useAuth } from "@/context/auth-context-v2";
import { ComponentUpgradeWrapper } from "@/components/authority/ComponentUpgradeWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types";
import { Users, Settings, UserPlus } from "lucide-react";

export default function AdminUsersClient() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return (
      <ComponentUpgradeWrapper
        componentName="User Management"
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
        componentName="User Management"
        showUpgradeInfo={true}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  User Directory
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <CardDescription className="text-xs text-muted-foreground">
                  Browse and manage all user accounts
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Role Management
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <CardDescription className="text-xs text-muted-foreground">
                  Configure user roles and permissions
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  User Registration
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <CardDescription className="text-xs text-muted-foreground">
                  Manage user registration settings
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management Tools</CardTitle>
              <CardDescription>
                Advanced user management features will be available in future updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Upcoming Features</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• User account search and filtering</li>
                    <li>• Bulk user operations</li>
                    <li>• User activity monitoring</li>
                    <li>• Permission management interface</li>
                    <li>• User session management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentUpgradeWrapper>
    </div>
  );
}
