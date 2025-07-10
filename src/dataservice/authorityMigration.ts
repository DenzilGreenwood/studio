/**
 * Authority System Migration Utilities
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Utilities for migrating users to the enhanced authority system
 * with DataService integration and role-based access control
 */

import { DataService } from './dataservice';
import { AuthorityDataService, AuthorityUtils } from './authorityDataService';
import { 
  UserRole, 
  Permission,
  type AuthorityUserProfile, 
  type UserProfile,
  type MigrationStats
} from '@/types';

/**
 * Authority migration service for upgrading user profiles
 */
export class AuthorityMigrationService {
  
  /**
   * Migrate a single user to the authority system
   */
  static async migrateUserToAuthoritySystem(
    dataService: DataService, 
    userId: string,
    currentProfile?: UserProfile
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      let profile = currentProfile;
      
      // If no profile provided, try to get it
      if (!profile) {
        const profileResult = await dataService.getDocument('profile', 'main');
        if (!profileResult.success || !profileResult.data) {
          return { success: false, error: 'No user profile found' };
        }
        profile = profileResult.data as unknown as UserProfile;
      }
      
      // Create enhanced authority profile
      const authorityProfile: AuthorityUserProfile = {
        // Copy existing profile data
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        pseudonym: profile.pseudonym,
        ageRange: profile.ageRange,
        primaryChallenge: profile.primaryChallenge,
        createdAt: profile.createdAt instanceof Date ? profile.createdAt : profile.createdAt.toDate(),
        lastSessionAt: profile.lastSessionAt ? (profile.lastSessionAt instanceof Date ? profile.lastSessionAt : profile.lastSessionAt.toDate()) : undefined,
        lastCheckInAt: profile.lastCheckInAt ? (profile.lastCheckInAt instanceof Date ? profile.lastCheckInAt : profile.lastCheckInAt.toDate()) : undefined,
        fcmToken: profile.fcmToken,
        sessionCount: profile.sessionCount || 0,
        
        // Legacy encryption fields
        encryptedPassphrase: profile.encryptedPassphrase,
        passphraseSalt: profile.passphraseSalt,
        passphraseIv: profile.passphraseIv,
        
        // Enhanced authority fields
        role: AuthorityUtils.convertLegacyAdminToRole(false), // Default to USER unless explicitly admin
        permissions: AuthorityUtils.getDefaultPermissions(UserRole.USER).map(p => p.toString()),
        isAdmin: false, // Legacy compatibility
        
        // Migration tracking
        migrationStatus: 'completed',
        authorityMigrationDate: new Date(),
        lastDataServiceUpdate: new Date(),
        encryptionVersion: '1.1.2'
      };
      
      // Check if user should be admin (you would implement your own logic here)
      if (await AuthorityMigrationService.shouldBeAdmin(profile)) {
        authorityProfile.role = UserRole.ADMIN;
        authorityProfile.permissions = AuthorityUtils.getDefaultPermissions(UserRole.ADMIN).map(p => p.toString());
        authorityProfile.isAdmin = true;
        authorityProfile.adminSince = new Date();
      }
      
      // Save enhanced profile
      const result = await dataService.saveDocument('profile', 'main', authorityProfile, true);
      
      if (result.success) {
        return { success: true };
      }
      
      return { success: false, error: result.error };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      };
    }
  }
  
  /**
   * Check if a user should be granted admin privileges
   * This is where you would implement your admin detection logic
   */
  private static async shouldBeAdmin(profile: UserProfile): Promise<boolean> {
    // Example logic - you would customize this based on your needs
    
    // Check for admin email patterns
    const adminEmails = [
      'admin@myimaginaryfriends.ai',
      'support@myimaginaryfriends.ai'
    ];
    
    if (profile.email && adminEmails.includes(profile.email.toLowerCase())) {
      return true;
    }
    
    // Check for existing admin flag (if you had one)
    if ('isAdmin' in profile) {
      const profileWithAdmin = profile as UserProfile & { isAdmin?: boolean };
      if (profileWithAdmin.isAdmin === true) {
        return true;
      }
    }
    
    // Other admin detection logic...
    
    return false;
  }
  
  /**
   * Detect if user needs authority migration
   */
  static async needsAuthorityMigration(dataService: DataService): Promise<boolean> {
    try {
      const profileResult = await dataService.getDocument('profile', 'main');
      
      if (!profileResult.success || !profileResult.data) {
        return false; // No profile exists
      }
      
      const profile = profileResult.data as AuthorityUserProfile;
      
      // Check if already migrated
      if (profile.migrationStatus === 'completed' && profile.role) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Create a new authority profile for a new user
   */
  static async createNewAuthorityProfile(
    dataService: DataService, 
    userId: string,
    email: string | null = null,
    displayName: string | null = null
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      // Determine if new user should be admin
      const shouldBeAdmin = await AuthorityMigrationService.shouldBeAdminNewUser(email);
      const role = shouldBeAdmin ? UserRole.ADMIN : UserRole.USER;
      
      const initialProfile: AuthorityUserProfile = {
        uid: userId,
        email,
        displayName: displayName || email?.split('@')[0] || 'Anonymous User',
        createdAt: new Date(),
        sessionCount: 0,
        
        // Authority system
        role,
        permissions: AuthorityUtils.getDefaultPermissions(role).map(p => p.toString()),
        isAdmin: shouldBeAdmin,
        adminSince: shouldBeAdmin ? new Date() : undefined,
        
        // Migration tracking
        migrationStatus: 'completed',
        authorityMigrationDate: new Date(),
        lastDataServiceUpdate: new Date(),
        encryptionVersion: '1.1.2'
      };
      
      const result = await dataService.saveDocument('profile', 'main', initialProfile);
      
      if (result.success) {
        return { success: true };
      }
      
      return { success: false, error: result.error };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      };
    }
  }
  
  /**
   * Check if a new user should be admin based on email
   */
  private static async shouldBeAdminNewUser(email: string | null): Promise<boolean> {
    if (!email) return false;
    
    const adminEmails = [
      'admin@myimaginaryfriends.ai',
      'support@myimaginaryfriends.ai'
    ];
    
    return adminEmails.includes(email.toLowerCase());
  }
  
  /**
   * Upgrade user role (admin operation)
   */
  static async upgradeUserRole(
    authorityDataService: AuthorityDataService,
    targetUserId: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    
    if (!authorityDataService.hasPermission(Permission.MANAGE_USERS)) {
      return { success: false, error: 'Insufficient permissions to manage users' };
    }
    
    try {
      // This would require implementing cross-user operations
      // For now, return success as placeholder
      return await authorityDataService.adminUpdateUserRole(targetUserId, newRole);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upgrade user role' 
      };
    }
  }
  
  /**
   * Grant permission to user (admin operation)
   */
  static async grantPermissionToUser(
    authorityDataService: AuthorityDataService,
    targetUserId: string,
    permission: Permission
  ): Promise<{ success: boolean; error?: string }> {
    
    if (!authorityDataService.hasPermission(Permission.MANAGE_USERS)) {
      return { success: false, error: 'Insufficient permissions to manage users' };
    }
    
    try {
      return await authorityDataService.adminGrantPermission(targetUserId, permission);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to grant permission' 
      };
    }
  }
  
  /**
   * Validate migration status
   */
  static async validateMigration(dataService: DataService): Promise<{ 
    success: boolean; 
    issues: string[];
    profile?: AuthorityUserProfile;
  }> {
    const issues: string[] = [];
    
    try {
      const profileResult = await dataService.getDocument('profile', 'main');
      
      if (!profileResult.success || !profileResult.data) {
        issues.push('No user profile found');
        return { success: false, issues };
      }
      
      const profile = profileResult.data as AuthorityUserProfile;
      
      // Validate migration status
      if (profile.migrationStatus !== 'completed') {
        issues.push(`Migration status is ${profile.migrationStatus}, expected 'completed'`);
      }
      
      // Validate role
      if (!profile.role || !AuthorityUtils.isValidRole(profile.role)) {
        issues.push('Invalid or missing user role');
      }
      
      // Validate permissions
      if (!profile.permissions || !Array.isArray(profile.permissions)) {
        issues.push('Missing or invalid permissions array');
      } else {
        const invalidPermissions = profile.permissions.filter(p => !AuthorityUtils.isValidPermission(p));
        if (invalidPermissions.length > 0) {
          issues.push(`Invalid permissions: ${invalidPermissions.join(', ')}`);
        }
      }
      
      // Validate encryption version
      if (profile.encryptionVersion !== '1.1.2') {
        issues.push(`Encryption version is ${profile.encryptionVersion}, expected '1.1.2'`);
      }
      
      return { 
        success: issues.length === 0, 
        issues,
        profile 
      };
      
    } catch (error) {
      issues.push(error instanceof Error ? error.message : 'Validation failed');
      return { success: false, issues };
    }
  }
  
  /**
   * Bulk migration for admin use (placeholder)
   */
  static async bulkMigrateUsers(): Promise<{ success: boolean; stats: MigrationStats }> {
    const stats: MigrationStats = {
      totalUsers: 0,
      migrated: 0,
      failed: 0,
      errors: [],
      startTime: new Date()
    };
    
    // This would require admin-level access to all users
    // Implementation would depend on your admin infrastructure
    // For now, return placeholder stats
    
    stats.endTime = new Date();
    return { success: true, stats };
  }
}

/**
 * Authority initialization utilities
 */
export class AuthorityInitializer {
  
  /**
   * Initialize authority system for a user session
   */
  static async initializeAuthoritySession(
    userId: string,
    encryptionKey: CryptoKey
  ): Promise<{ 
    success: boolean; 
    authorityDataService?: AuthorityDataService; 
    authorityProfile?: AuthorityUserProfile;
    error?: string;
  }> {
    
    try {
      // Create basic DataService first
      const dataService = new DataService(userId, encryptionKey);
      
      // Check if migration is needed
      const needsMigration = await AuthorityMigrationService.needsAuthorityMigration(dataService);
      
      if (needsMigration) {
        // Run migration
        const migrationResult = await AuthorityMigrationService.migrateUserToAuthoritySystem(dataService, userId);
        if (!migrationResult.success) {
          return { success: false, error: migrationResult.error };
        }
      }
      
      // Get authority profile
      const profileResult = await dataService.getDocument('profile', 'main');
      if (!profileResult.success || !profileResult.data) {
        return { success: false, error: 'Failed to load authority profile' };
      }
      
      const authorityProfile = profileResult.data as AuthorityUserProfile;
      
      // Create authority-enhanced DataService
      const authorityDataService = new AuthorityDataService(userId, encryptionKey, authorityProfile);
      
      return { 
        success: true, 
        authorityDataService, 
        authorityProfile 
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authority initialization failed' 
      };
    }
  }
}
