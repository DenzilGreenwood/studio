"use client";

import { useAuth } from "@/context/auth-context-v2";
import { ComponentUpgradeWrapper } from "@/components/authority/ComponentUpgradeWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types";
import { Users, Settings, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
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
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  User statistics will be displayed here
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Role Management</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  Role assignment and management tools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Creation</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  Create and invite new users
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management Features</CardTitle>
              <CardDescription>
                Full user management functionality will be implemented in the next phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Planned Features:</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• User list with search and filtering</li>
                      <li>• Role assignment and permission management</li>
                      <li>• User activity monitoring</li>
                      <li>• Account status management</li>
                      <li>• Bulk operations</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Current Authority System:</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Role-based access control active</li>
                      <li>• Admin permissions enforced</li>
                      <li>• Migration system operational</li>
                      <li>• DataService integration complete</li>
                      <li>• Zero-knowledge encryption maintained</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentUpgradeWrapper>
    </div>
  );
}
