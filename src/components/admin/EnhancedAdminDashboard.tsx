/**
 * Enhanced Admin Dashboard with Authority System
 * Version: 2.0.0
 * Date: July 9, 2025
 * 
 * Updated admin dashboard that uses the new authority system
 * for role-based access control and enhanced security
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { Permission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  UserCheck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AdminDashboardProps {
  className?: string;
}

export function EnhancedAdminDashboard({ className = '' }: AdminDashboardProps) {
  const { 
    hasPermission, 
  
    authorityProfile, 
    authorityDataService
  } = useAuth();
  
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  const loadAnalytics = async () => {
    if (!authorityDataService) return;

    setLoading(true);
    setError(null);

    try {
      const result = await authorityDataService.adminGetCrossUserAnalytics();
      if (result.success) {
        setAnalytics(result.data || {});
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission(Permission.READ_ANALYTICS)) {
      loadAnalytics();
    }
  }, [hasPermission, authorityDataService, loadAnalytics]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Enhanced authority system with role-based access control
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {authorityProfile?.role || 'Unknown Role'}
        </Badge>
      </div>

      {/* Authority Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Your Authority Profile
          </CardTitle>
          <CardDescription>
            Current role and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authorityProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-lg font-semibold text-gray-900">
                  {authorityProfile.role}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Since</label>
                <p className="text-lg font-semibold text-gray-900">
                  {authorityProfile.adminSince 
                    ? new Date(authorityProfile.adminSince).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Permissions</label>
                <p className="text-lg font-semibold text-gray-900">
                  {authorityProfile.permissions?.length || 0} permissions
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Authority profile not loaded</p>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* User Management */}
        {hasPermission(Permission.READ_ALL_USERS) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={loading}
                >
                  View All Users
                </Button>
                {hasPermission(Permission.MANAGE_USERS) && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={loading}
                  >
                    Manage Roles
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics */}
        {hasPermission(Permission.READ_ANALYTICS) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                System usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading analytics...</p>
              ) : analytics ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Analytics loaded</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={loadAnalytics}
                  >
                    Refresh Analytics
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadAnalytics}
                >
                  Load Analytics
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feedback Management */}
        {hasPermission(Permission.READ_FEEDBACK) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Feedback Analytics
              </CardTitle>
              <CardDescription>
                User feedback and satisfaction metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                disabled={loading}
              >
                View Feedback Reports
              </Button>
            </CardContent>
          </Card>
        )}

        {/* System Configuration */}
        {hasPermission(Permission.SYSTEM_CONFIG) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Manage system settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={loading}
                >
                  Encryption Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={loading}
                >
                  System Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Export */}
        {hasPermission(Permission.EXPORT_DATA) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Export data for analysis and backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                disabled={loading}
              >
                Export Analytics Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            Your current permissions in the authority system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.values(Permission).map((permission) => (
              <div 
                key={permission}
                className={`p-3 rounded-lg border ${
                  hasPermission(permission) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasPermission(permission) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm font-medium ${
                    hasPermission(permission) ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {permission.replace(/[_:]/g, ' ').toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
