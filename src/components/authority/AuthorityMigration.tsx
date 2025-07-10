/**
 * Authority Migration Component
 * Version: 1.0.0
 * Date: January 15, 2025
 * 
 * Handles the migration from old auth system to new authority system
 * Shows migration status and handles automatic data migration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { AuthorityMigrationService } from '@/dataservice/authorityMigration';
import { DataService } from '@/dataservice/dataservice';
import { PassphraseEntry } from './PassphraseEntry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Users, 
  Shield 
} from 'lucide-react';

interface MigrationStatus {
  isRequired: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  hasError: boolean;
  progress: number;
  message: string;
  stats?: {
    totalUsers: number;
    migratedUsers: number;
    failedUsers: number;
  };
}

interface AuthorityMigrationProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthorityMigration({ children, className = '' }: AuthorityMigrationProps) {
  const { firebaseUser, authorityProfile, authorityDataService, dataService, isAdmin } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    isRequired: false,
    isInProgress: false,
    isCompleted: false,
    hasError: false,
    progress: 0,
    message: 'Checking migration status...'
  });
  const [_isInitialized, setIsInitialized] = useState(false);

  /**
   * Check if migration is required
   */
  useEffect(() => {
    const checkMigrationStatus = async () => {
      if (!firebaseUser) {
        setMigrationStatus(prev => ({
          ...prev,
          message: 'User not authenticated',
          isCompleted: false,
          isRequired: false
        }));
        return;
      }

      try {
        // Check if user has authority profile
        if (!authorityProfile) {
          setMigrationStatus(prev => ({
            ...prev,
            isRequired: true,
            message: 'Authority system migration required',
            isCompleted: false
          }));
          return;
        }

        // Check if migration is completed
        if (authorityProfile.migrationStatus === 'completed') {
          setMigrationStatus(prev => ({
            ...prev,
            isRequired: false,
            isCompleted: true,
            message: 'Authority system migration completed',
            progress: 100
          }));
          setIsInitialized(true);
          return;
        }

        // Migration in progress or failed
        setMigrationStatus(prev => ({
          ...prev,
          isRequired: true,
          hasError: authorityProfile.migrationStatus === 'failed',
          message: authorityProfile.migrationStatus === 'failed' 
            ? 'Authority system migration failed - retry required'
            : 'Authority system migration in progress',
          progress: authorityProfile.migrationStatus === 'failed' ? 0 : 50
        }));
      } catch (error) {
        setMigrationStatus(prev => ({
          ...prev,
          hasError: true,
          message: `Migration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    };

    checkMigrationStatus();
  }, [firebaseUser, authorityProfile, setIsInitialized]);

  /**
   * Start user migration process
   */
  const startMigration = async () => {
    if (!firebaseUser || !authorityDataService) {
      setMigrationStatus(prev => ({
        ...prev,
        hasError: true,
        message: 'Cannot start migration - user not authenticated or authority service not available'
      }));
      return;
    }

    setMigrationStatus(prev => ({
      ...prev,
      isInProgress: true,
      hasError: false,
      message: 'Starting authority system migration...',
      progress: 10
    }));

    try {
      // Migrate individual user using static method
      setMigrationStatus(prev => ({
        ...prev,
        message: 'Migrating user profile...',
        progress: 30
      }));

      const result = await AuthorityMigrationService.migrateUserToAuthoritySystem(
        authorityDataService as unknown as DataService,
        firebaseUser.uid
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Migration failed');
      }

      setMigrationStatus(prev => ({
        ...prev,
        message: 'Migration completed successfully',
        progress: 100,
        isCompleted: true,
        isInProgress: false,
        isRequired: false
      }));

      // Refresh the page to load with new authority system
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isInProgress: false,
        hasError: true,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 0
      }));
    }
  };

  /**
   * Start bulk migration (admin only)
   */
  const startBulkMigration = async () => {
    if (!isAdmin()) {
      return;
    }

    setMigrationStatus(prev => ({
      ...prev,
      isInProgress: true,
      message: 'Starting bulk migration...',
      progress: 5
    }));

    try {
      // Use static method for bulk migration
      const result = await AuthorityMigrationService.bulkMigrateUsers();
      
      if (!result.success) {
        throw new Error('Bulk migration failed');
      }

      setMigrationStatus(prev => ({
        ...prev,
        message: 'Bulk migration completed',
        progress: 100,
        isCompleted: true,
        isInProgress: false,
        stats: {
          totalUsers: result.stats.totalUsers,
          migratedUsers: result.stats.migrated,
          failedUsers: result.stats.failed
        }
      }));

    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isInProgress: false,
        hasError: true,
        message: `Bulk migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  // Show migration interface if required
  if (migrationStatus.isRequired || migrationStatus.isInProgress) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${className}`}>
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Authority System Migration</CardTitle>
            <CardDescription>
              Upgrading your account to the new authority system with enhanced security and role-based access control.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Migration Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Migration Progress</span>
                <Badge variant={migrationStatus.hasError ? "destructive" : migrationStatus.isCompleted ? "default" : "secondary"}>
                  {migrationStatus.hasError ? "Error" : migrationStatus.isCompleted ? "Complete" : "In Progress"}
                </Badge>
              </div>
              
              <Progress value={migrationStatus.progress} className="h-2" />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {migrationStatus.isInProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : migrationStatus.hasError ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : migrationStatus.isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {migrationStatus.message}
              </div>
            </div>

            {/* Migration Stats (for bulk migrations) */}
            {migrationStatus.stats && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{migrationStatus.stats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{migrationStatus.stats.migratedUsers}</div>
                  <div className="text-sm text-muted-foreground">Migrated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{migrationStatus.stats.failedUsers}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {migrationStatus.hasError && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Migration failed. Please try again or contact support if the issue persists.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {!migrationStatus.isCompleted && (
                <Button 
                  onClick={startMigration}
                  disabled={migrationStatus.isInProgress}
                  className="flex items-center gap-2"
                >
                  {migrationStatus.isInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {migrationStatus.hasError ? 'Retry Migration' : 'Start Migration'}
                </Button>
              )}
              
              {isAdmin() && !migrationStatus.isCompleted && (
                <Button 
                  onClick={startBulkMigration}
                  disabled={migrationStatus.isInProgress}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Bulk Migration
                </Button>
              )}
            </div>

            {/* Migration Information */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>What&apos;s being migrated:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>User profiles with role-based permissions</li>
                <li>Enhanced security with authority system</li>
                <li>DataService integration for better performance</li>
                <li>Zero-knowledge encryption compatibility</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> This migration ensures your data remains secure while providing 
                enhanced features and better performance. The process is fully automated and safe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show passphrase entry if user is authenticated but DataService not initialized
  if (firebaseUser && !authorityProfile && !migrationStatus.isInProgress && !migrationStatus.isRequired) {
    return <PassphraseEntry onSuccess={() => window.location.reload()} className={className} />;
  }

  // Show children if migration is completed or not required
  if (migrationStatus.isCompleted || !migrationStatus.isRequired) {
    return <>{children}</>;
  }

  // Loading state
  return (
    <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Initializing authority system...</p>
      </div>
    </div>
  );
}
