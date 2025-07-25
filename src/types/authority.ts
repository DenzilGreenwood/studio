// src/types/authority.ts
import type { BaseDocument } from './base';
import type { JournalEntry } from './journals';
import type { ProtocolSession, SessionFeedback } from './session';
import type { ReportData, TrashItem } from './reports';

/**
 * User roles for enhanced authority system
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ANALYST = 'analyst'
}

/**
 * System permissions for granular access control
 */
export enum Permission {
  // User permissions
  READ_OWN_DATA = 'read:own:data',
  WRITE_OWN_DATA = 'write:own:data',
  DELETE_OWN_DATA = 'delete:own:data',
  
  // Admin permissions
  READ_ALL_USERS = 'read:all:users',
  READ_ANALYTICS = 'read:analytics',
  READ_FEEDBACK = 'read:feedback',
  MANAGE_USERS = 'manage:users',
  
  // System permissions
  SYSTEM_CONFIG = 'system:config',
  BACKUP_RESTORE = 'system:backup',
  
  // Analyst permissions
  EXPORT_DATA = 'export:data',
  GENERATE_REPORTS = 'generate:reports'
}

/**
 * Enhanced user profile with authority system integration
 * Compatible with DataService (includes index signature)
 */
export interface AuthorityUserProfile extends Record<string, unknown> {
  // Basic user info
  uid: string;
  email: string | null;
  displayName: string | null;
  pseudonym?: string;
  ageRange?: string;
  primaryChallenge?: string;
  createdAt: Date;
  lastSessionAt?: Date;
  lastCheckInAt?: Date;
  fcmToken?: string;
  sessionCount?: number;
  
  // Authority & roles
  role: UserRole;
  permissions: string[];
  isAdmin: boolean; // Legacy compatibility
  
  // Admin metadata
  adminLevel?: number;
  adminSince?: Date;
  lastAdminAction?: Date;
  
  // DataService compatibility
  lastDataServiceUpdate?: Date;
  encryptionVersion?: string;
  
  // Legacy encryption fields (for backward compatibility)
  encryptedPassphrase?: string;
  passphraseSalt?: string;
  passphraseIv?: string;
}

/**
 * Admin action log for audit trail
 */
export interface AdminActionLog extends BaseDocument {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  targetCollection?: string;
  targetDocId?: string;
  timestamp: Date;
  details: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * System configuration for admin management
 */
export interface SystemConfiguration extends BaseDocument {
  configKey: string;
  configValue: unknown;
  updatedBy: string;
  updatedAt: Date;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Authority service interface for permission management
 */
export interface AuthorityService {
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
  canAccessResource(resourcePath: string): boolean;
  validateDataAccess(collection: string, docId: string): boolean;
  getRequiredPermission(operation: string, collection: string): Permission;
}

/**
 * Enhanced collection type definitions for authority system
 */
export interface AuthorityCollections {
  // User collections (encrypted with DataService)
  'profile': AuthorityUserProfile;
  'journals': JournalEntry;
  'sessions': ProtocolSession;
  'reports': ReportData;
  'trash': TrashItem;
  
  // Admin collections (special handling)
  'admin-logs': AdminActionLog;
  'system-config': SystemConfiguration;
  
  // Feedback (unencrypted for analytics)
  'feedback': SessionFeedback;
}
