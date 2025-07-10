/**
 * Component Upgrade Helper
 * Version: 1.0.0
 * Date: January 15, 2025
 * 
 * Helper component to gradually upgrade existing components 
 * to use the new authority system
 */

'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { UserRole, Permission } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';

interface ComponentUpgradeWrapperProps {
  children: React.ReactNode;
  componentName: string;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  showUpgradeInfo?: boolean;
}

export function ComponentUpgradeWrapper({
  children,
  componentName,
  requiredRole,
  requiredPermission,
  showUpgradeInfo = true
}: ComponentUpgradeWrapperProps) {
  const { authorityProfile, hasRole, hasPermission } = useAuth();

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This feature requires {requiredRole} role. Please contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This feature requires {requiredPermission} permission. Please contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {/* Show upgrade info if enabled */}
      {showUpgradeInfo && authorityProfile && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            Authority System Active
          </Badge>
          <span>
            {componentName} • Role: {authorityProfile.role} • 
            Migration: {authorityProfile.migrationStatus}
          </span>
        </div>
      )}
      
      {/* Render the wrapped component */}
      {children}
    </div>
  );
}

/**
 * Higher-order component to wrap existing components with authority system
 */
export function withAuthoritySystem<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  options: {
    componentName: string;
    requiredRole?: UserRole;
    requiredPermission?: Permission;
    showUpgradeInfo?: boolean;
  }
) {
  return function AuthorityWrappedComponent(props: T) {
    return (
      <ComponentUpgradeWrapper
        componentName={options.componentName}
        requiredRole={options.requiredRole}
        requiredPermission={options.requiredPermission}
        showUpgradeInfo={options.showUpgradeInfo}
      >
        <Component {...props} />
      </ComponentUpgradeWrapper>
    );
  };
}
