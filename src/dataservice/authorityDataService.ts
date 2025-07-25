/**
 * Authority-Enhanced DataService
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Enhanced DataService with integrated authority system for role-based
 * access control and permission management in compliance with ZKE v1.1.2
 */

import type { WhereFilterOp } from 'firebase/firestore';
import { DataService } from './dataservice';
import { 
  UserRole, 
  Permission, 
  type AuthorityUserProfile, 
  type AdminActionLog,
  type AuthorityService,
  type BaseDocument
} from '@/types';

/**
 * Enhanced DataService with authority and permission management
 */
export class AuthorityDataService extends DataService implements AuthorityService {
  private authorityProfile: AuthorityUserProfile | null = null;

  constructor(
    userId: string, 
    passphrase: string, 
    authorityProfile?: AuthorityUserProfile
  ) {
    super(userId, passphrase);
    this.authorityProfile = authorityProfile || null;
  }

  /**
   * Update authority profile
   */
  setAuthorityProfile(profile: AuthorityUserProfile): void {
    this.authorityProfile = profile;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    if (!this.authorityProfile) return false;
    
    // Admin has all permissions
    if (this.authorityProfile.role === UserRole.ADMIN) {
      return true;
    }
    
    return this.authorityProfile.permissions.includes(permission);
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    if (!this.authorityProfile) return false;
    return this.authorityProfile.role === role;
  }

  /**
   * Check if user can access specific resource
   */
  canAccessResource(resourcePath: string): boolean {
    if (!this.authorityProfile) return false;
    
    // Admin can access all resources
    if (this.authorityProfile.role === UserRole.ADMIN) {
      return true;
    }
    
    // Check if resource belongs to current user
    return resourcePath.includes(`users/${this.authorityProfile.uid}/`);
  }

  /**
   * Validate data access for collection and document
   */
  validateDataAccess(collection: string, _docId: string): boolean {
    if (!this.authorityProfile) return false;
    
    // Admin can access all data
    if (this.hasRole(UserRole.ADMIN)) {
      return true;
    }
    
    // Check permission for collection type
    const requiredPermission = this.getRequiredPermission('read', collection);
    return this.hasPermission(requiredPermission);
  }

  /**
   * Get required permission for operation and collection
   */
  getRequiredPermission(operation: string, collection: string): Permission {
    // Map operations to permissions
    switch (operation) {
      case 'read':
        if (collection === 'feedback') return Permission.READ_FEEDBACK;
        if (collection.startsWith('admin')) return Permission.READ_ALL_USERS;
        return Permission.READ_OWN_DATA;
      
      case 'write':
      case 'create':
      case 'update':
        if (collection === 'system-config') return Permission.SYSTEM_CONFIG;
        if (collection.startsWith('admin')) return Permission.MANAGE_USERS;
        return Permission.WRITE_OWN_DATA;
      
      case 'delete':
        if (collection.startsWith('admin')) return Permission.MANAGE_USERS;
        return Permission.DELETE_OWN_DATA;
      
      default:
        return Permission.READ_OWN_DATA;
    }
  }

  /**
   * Validate authority before any operation
   */
  private validateAuthority(operation: string, collection: string, docId?: string): boolean {
    if (!this.authorityProfile) return false;
    
    // Check specific permissions
    const requiredPermission = this.getRequiredPermission(operation, collection);
    
    if (!this.hasPermission(requiredPermission)) {
      return false;
    }
    
    // Additional resource-specific checks
    if (docId && !this.hasRole(UserRole.ADMIN)) {
      const resourcePath = `users/${this.authorityProfile.uid}/${collection}/${docId}`;
      return this.canAccessResource(resourcePath);
    }
    
    return true;
  }

  /**
   * Log admin action for audit trail
   */
  private async logAdminAction(
    action: string, 
    targetUserId?: string, 
    targetCollection?: string, 
    targetDocId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.hasRole(UserRole.ADMIN) || !this.authorityProfile) return;

    const logEntry: AdminActionLog = {
      adminUserId: this.authorityProfile.uid,
      action,
      targetUserId,
      targetCollection,
      targetDocId,
      timestamp: new Date(),
      details,
      severity: 'info'
    };

    // Log to admin collection (this would need special handling)
    await this.saveAdminLog(logEntry);
  }

  /**
   * Save admin log (direct Firestore access for admin collections)
   */
  private async saveAdminLog(_logEntry: AdminActionLog): Promise<void> {
    // This would need direct Firestore access since admin logs are not encrypted
    // Implementation would depend on admin collection structure
    // For now, we'll just track that the action should be logged
    // Note: In production, this would save to an admin collection
  }

  /**
   * Override saveDocument with authority checks
   */
  async saveDocument<T extends BaseDocument>(
    collection: string,
    docId: string,
    data: T,
    merge: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    
    if (!this.validateAuthority('write', collection, docId)) {
      return { success: false, error: 'Insufficient permissions for write operation' };
    }

    // Log admin actions
    if (this.hasRole(UserRole.ADMIN) && !collection.startsWith('profile')) {
      await this.logAdminAction('saveDocument', undefined, collection, docId, { merge });
    }
    
    return super.saveDocument(collection, docId, data, merge);
  }

  /**
   * Override getDocument with authority checks
   */
  async getDocument<T extends BaseDocument>(
    collection: string,
    docId: string
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    
    if (!this.validateAuthority('read', collection, docId)) {
      return { success: false, error: 'Insufficient permissions for read operation' };
    }
    
    return super.getDocument<T>(collection, docId);
  }

  /**
   * Override deleteDocument with authority checks
   */
  async deleteDocument(
    collection: string,
    docId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    if (!this.validateAuthority('delete', collection, docId)) {
      return { success: false, error: 'Insufficient permissions for delete operation' };
    }

    // Log admin deletions
    if (this.hasRole(UserRole.ADMIN)) {
      await this.logAdminAction('deleteDocument', undefined, collection, docId);
    }
    
    return super.deleteDocument(collection, docId);
  }

  /**
   * Override getCollection with authority checks
   */
  async getCollection<T extends BaseDocument>(
    collectionName: string,
    options?: {
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      where?: Array<{
        field: string;
        operator: WhereFilterOp;
        value: unknown;
      }>;
    }
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    
    if (!this.validateAuthority('read', collectionName)) {
      return { success: false, error: 'Insufficient permissions for collection access' };
    }
    
    return super.getCollection<T>(collectionName, options);
  }

  /**
   * Admin-specific: Get all users (admin only)
   */
  async adminGetAllUsers(): Promise<{ success: boolean; data?: AuthorityUserProfile[]; error?: string }> {
    if (!this.hasPermission(Permission.READ_ALL_USERS)) {
      return { success: false, error: 'Admin permissions required' };
    }

    await this.logAdminAction('adminGetAllUsers');
    
    // This would require special implementation for cross-user access
    // For now, return empty array as placeholder
    return { success: true, data: [] };
  }

  /**
   * Admin-specific: Get cross-user analytics
   */
  async adminGetCrossUserAnalytics(): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    if (!this.hasPermission(Permission.READ_ANALYTICS)) {
      return { success: false, error: 'Analytics permissions required' };
    }

    await this.logAdminAction('adminGetCrossUserAnalytics');
    
    // Implementation for cross-user analytics
    return { success: true, data: {} };
  }

  /**
   * Admin-specific: Update user role
   */
  async adminUpdateUserRole(
    targetUserId: string, 
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.hasPermission(Permission.MANAGE_USERS)) {
      return { success: false, error: 'User management permissions required' };
    }

    await this.logAdminAction('adminUpdateUserRole', targetUserId, 'profile', 'main', { newRole });
    
    // Implementation would require direct Firestore access for other users
    return { success: true };
  }

  /**
   * Admin-specific: Grant permission to user
   */
  async adminGrantPermission(
    targetUserId: string, 
    permission: Permission
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.hasPermission(Permission.MANAGE_USERS)) {
      return { success: false, error: 'User management permissions required' };
    }

    await this.logAdminAction('adminGrantPermission', targetUserId, 'profile', 'main', { permission });
    
    // Implementation would require direct Firestore access for other users
    return { success: true };
  }

  /**
   * Get user's current authority profile
   */
  getAuthorityProfile(): AuthorityUserProfile | null {
    return this.authorityProfile;
  }
}

/**
 * Factory function to create AuthorityDataService instance
 */
export function createAuthorityDataService(
  userId: string, 
  passphrase: string, 
  authorityProfile?: AuthorityUserProfile
): AuthorityDataService {
  return new AuthorityDataService(userId, passphrase, authorityProfile);
}

/**
 * Utility functions for authority management
 */
export class AuthorityUtils {
  /**
   * Get default permissions for a role
   */
  static getDefaultPermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(Permission);
      
      case UserRole.MODERATOR:
        return [
          Permission.READ_OWN_DATA,
          Permission.WRITE_OWN_DATA,
          Permission.DELETE_OWN_DATA,
          Permission.READ_FEEDBACK,
          Permission.READ_ANALYTICS
        ];
      
      case UserRole.ANALYST:
        return [
          Permission.READ_OWN_DATA,
          Permission.WRITE_OWN_DATA,
          Permission.READ_ANALYTICS,
          Permission.EXPORT_DATA,
          Permission.GENERATE_REPORTS
        ];
      
      default:
        return [
          Permission.READ_OWN_DATA,
          Permission.WRITE_OWN_DATA,
          Permission.DELETE_OWN_DATA
        ];
    }
  }

  /**
   * Validate permission string
   */
  static isValidPermission(permission: string): permission is Permission {
    return Object.values(Permission).includes(permission as Permission);
  }

  /**
   * Validate role string
   */
  static isValidRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }

  /**
   * Convert legacy admin flag to role
   */
  static convertLegacyAdminToRole(isAdmin: boolean): UserRole {
    return isAdmin ? UserRole.ADMIN : UserRole.USER;
  }
}
