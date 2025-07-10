# Authority System DataService Migration Plan
Date: July 9, 2025
Version: 1.0.0

## Overview

This document outlines the comprehensive migration of the app's authority system and data structure to align with the new DataService architecture, Zero-Knowledge Encryption (ZKE) v1.1.2, and updated Firestore rules.

## Current Authority System Analysis

### Current Structure
- **User Ownership**: Simple `isOwner(userId)` checks in Firestore rules
- **Admin System**: Basic admin flag in user profiles with `isAdmin` checks
- **Data Structure**: User-centric collections under `users/{userId}/`
- **Authentication**: Firebase Auth + passphrase-based encryption
- **Authorization**: Firestore rules-based with limited role management

### Current Admin Functions
- Admin dashboard access for feedback analytics
- Collection group queries for cross-user analytics
- Basic admin token checks in Firestore rules
- Limited admin-only operations

## Migration Strategy

### Phase 1: Enhanced Authority Types & Interfaces

#### 1.1 Authority Role System
```typescript
// Enhanced role-based authority system
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ANALYST = 'analyst'
}

export interface AuthorityProfile extends Record<string, unknown> {
  // Basic user info
  uid: string;
  email: string | null;
  displayName: string | null;
  
  // Authority & roles
  role: UserRole;
  permissions: string[];
  isAdmin: boolean; // Legacy compatibility
  
  // Admin metadata
  adminLevel?: number;
  adminSince?: Date;
  lastAdminAction?: Date;
  
  // Migration tracking
  migrationStatus: 'pending' | 'completed' | 'failed';
  authorityMigrationDate?: Date;
  
  // DataService compatibility
  lastDataServiceUpdate?: Date;
  encryptionVersion?: string;
}
```

#### 1.2 Permission System
```typescript
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

export interface AuthorityService {
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
  canAccessResource(resourcePath: string): boolean;
  validateDataAccess(collection: string, docId: string): boolean;
}
```

### Phase 2: DataService Authority Integration

#### 2.1 Enhanced DataService with Authority
```typescript
export class AuthorityDataService extends DataService {
  private authorityProfile: AuthorityProfile | null = null;
  
  constructor(userId: string, encryptionKey: CryptoKey, authorityProfile?: AuthorityProfile) {
    super(userId, encryptionKey);
    this.authorityProfile = authorityProfile;
  }
  
  /**
   * Validate authority before any operation
   */
  private validateAuthority(operation: string, collection: string, docId?: string): boolean {
    if (!this.authorityProfile) return false;
    
    // Admin can access all data
    if (this.authorityProfile.role === UserRole.ADMIN) {
      return true;
    }
    
    // Check specific permissions
    const requiredPermission = this.getRequiredPermission(operation, collection);
    return this.hasPermission(requiredPermission);
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
      return { success: false, error: 'Insufficient permissions' };
    }
    
    return super.saveDocument(collection, docId, data, merge);
  }
  
  /**
   * Admin-specific operations
   */
  async adminGetAllUsers(): Promise<{ success: boolean; data?: AuthorityProfile[]; error?: string }> {
    if (!this.hasPermission(Permission.READ_ALL_USERS)) {
      return { success: false, error: 'Admin permissions required' };
    }
    
    // Implementation for admin user access
    // This would use direct Firestore access or special admin collections
    return { success: true, data: [] };
  }
  
  async adminGetCrossUserAnalytics(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.hasPermission(Permission.READ_ANALYTICS)) {
      return { success: false, error: 'Analytics permissions required' };
    }
    
    // Implementation for cross-user analytics
    return { success: true, data: {} };
  }
}
```

#### 2.2 Authority Context Integration
```typescript
interface AuthorityContextType extends AuthContextType {
  // Enhanced authority features
  authorityProfile: AuthorityProfile | null;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  
  // Admin operations
  switchToAdminMode: () => Promise<void>;
  adminDataService: AuthorityDataService | null;
  
  // Authority management
  updateUserRole: (userId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  grantPermission: (userId: string, permission: Permission) => Promise<{ success: boolean; error?: string }>;
}
```

### Phase 3: Data Structure Migration

#### 3.1 Enhanced User Profile Migration
```typescript
const migrateUserToAuthoritySystem = async (
  dataService: DataService, 
  userId: string,
  currentProfile: UserProfile
): Promise<{ success: boolean; error?: string }> => {
  
  // Create enhanced authority profile
  const authorityProfile: AuthorityProfile = {
    ...currentProfile,
    role: currentProfile.isAdmin ? UserRole.ADMIN : UserRole.USER,
    permissions: getDefaultPermissions(currentProfile.isAdmin ? UserRole.ADMIN : UserRole.USER),
    migrationStatus: 'completed',
    authorityMigrationDate: new Date(),
    lastDataServiceUpdate: new Date(),
    encryptionVersion: '1.1.2'
  };
  
  // Save enhanced profile
  const result = await dataService.saveDocument('profile', 'main', authorityProfile);
  
  if (result.success) {
    // Migrate existing data to ensure compatibility
    await migrateUserCollections(dataService, userId);
    return { success: true };
  }
  
  return { success: false, error: result.error };
};

const getDefaultPermissions = (role: UserRole): string[] => {
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
};
```

#### 3.2 Collection Structure Enhancements
```typescript
// Enhanced collection structure for authority management
interface AuthorityCollections {
  // User collections (encrypted with DataService)
  'profile': AuthorityProfile;
  'journals': JournalEntry;
  'sessions': ProtocolSession;
  'reports': ReportData;
  'trash': TrashItem;
  
  // Admin collections (special handling)
  'admin-logs': AdminActionLog;
  'system-config': SystemConfiguration;
  'user-analytics': UserAnalytics;
  
  // Feedback (unencrypted for analytics)
  'feedback': SessionFeedback;
}

interface AdminActionLog extends BaseDocument {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  targetCollection?: string;
  targetDocId?: string;
  timestamp: Date;
  details: Record<string, unknown>;
}
```

### Phase 4: Firestore Rules Updates

#### 4.1 Enhanced Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Enhanced helper functions
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.admin == true;
    }
    
    function hasRole(role) {
      return request.auth != null && 
             request.auth.token.role == role;
    }
    
    function hasPermission(permission) {
      return request.auth != null && 
             permission in request.auth.token.permissions;
    }
    
    function isEncryptedData(data) {
      return data.keys().hasAll(['encryptedData', 'metadata']) &&
             data.metadata.keys().hasAll(['salt', 'iv', 'version']);
    }
    
    // User data with enhanced authority checks
    match /users/{userId} {
      allow read, update, create, delete: if isOwner(userId);
      allow read: if isAdmin() || hasPermission('read:all:users');
      allow update: if isAdmin() && hasPermission('manage:users');
    }
    
    // User collections with DataService encryption
    match /users/{userId}/{collection}/{docId} {
      allow read, write, delete: if isOwner(userId) && isEncryptedData(resource.data);
      allow read: if isAdmin() && hasPermission('read:all:users');
    }
    
    // Admin collections
    match /admin/{docId} {
      allow read, write: if isAdmin();
    }
    
    // System configuration
    match /system/{docId} {
      allow read: if true; // Public read for encryption config
      allow write: if isAdmin() && hasPermission('system:config');
    }
    
    // Feedback analytics
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if isAdmin() || hasPermission('read:feedback');
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```

### Phase 5: Component Updates

#### 5.1 Admin Dashboard Enhancements
```typescript
export function EnhancedAdminDashboard() {
  const { authorityProfile, hasPermission, adminDataService } = useAuth();
  
  if (!hasPermission(Permission.READ_ANALYTICS)) {
    return <AccessDenied requiredPermission="Analytics Access" />;
  }
  
  // Implementation with enhanced authority checks
  return (
    <div>
      {hasPermission(Permission.READ_ALL_USERS) && (
        <UserManagementPanel />
      )}
      {hasPermission(Permission.READ_FEEDBACK) && (
        <FeedbackAnalytics />
      )}
      {hasPermission(Permission.SYSTEM_CONFIG) && (
        <SystemConfiguration />
      )}
    </div>
  );
}
```

#### 5.2 Role Management Interface
```typescript
export function RoleManagementPanel() {
  const { hasPermission, updateUserRole } = useAuth();
  
  if (!hasPermission(Permission.MANAGE_USERS)) {
    return <AccessDenied />;
  }
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast({ title: "Role updated successfully" });
    } else {
      toast({ title: "Failed to update role", variant: "destructive" });
    }
  };
  
  return (
    <div>
      {/* Role management interface */}
    </div>
  );
}
```

### Phase 6: Migration Implementation

#### 6.1 Automatic Migration Detection
```typescript
const detectAndRunAuthorityMigration = async (dataService: DataService, userId: string) => {
  // Check if authority migration is needed
  const profileResult = await dataService.getDocument('profile', 'main');
  
  if (!profileResult.success || !profileResult.data) {
    // Create new authority profile
    return await createNewAuthorityProfile(dataService, userId);
  }
  
  const profile = profileResult.data as AuthorityProfile;
  
  if (profile.migrationStatus !== 'completed' || !profile.role) {
    // Run authority migration
    return await migrateUserToAuthoritySystem(dataService, userId, profile);
  }
  
  return { success: true };
};
```

#### 6.2 Admin Migration Tools
```typescript
export class AdminMigrationService {
  static async migrateAllUsers(): Promise<{ success: boolean; stats: MigrationStats }> {
    // Admin-only bulk migration functionality
    const stats: MigrationStats = {
      totalUsers: 0,
      migrated: 0,
      failed: 0,
      errors: []
    };
    
    // Implementation for bulk user migration
    return { success: true, stats };
  }
  
  static async validateMigration(userId: string): Promise<{ success: boolean; issues: string[] }> {
    // Validate user migration status
    return { success: true, issues: [] };
  }
}
```

## Testing Strategy

### Authority Testing
1. **Role-based access control tests**
2. **Permission validation tests**
3. **Admin operation tests**
4. **Data access boundary tests**
5. **Migration integrity tests**

### Integration Testing
1. **DataService authority integration**
2. **Firestore rules validation**
3. **Component permission checks**
4. **Cross-user operation tests**

## Deployment Plan

1. **Phase 1**: Deploy enhanced types and interfaces
2. **Phase 2**: Update DataService with authority integration
3. **Phase 3**: Implement migration logic
4. **Phase 4**: Update Firestore rules
5. **Phase 5**: Deploy component updates
6. **Phase 6**: Run bulk migration (admin-initiated)

## Benefits

1. **Enhanced Security**: Role-based access control with granular permissions
2. **Scalable Authority**: Flexible permission system for future roles
3. **DataService Integration**: Centralized authority management
4. **Migration Safety**: Backward compatibility with existing system
5. **Admin Tools**: Enhanced admin capabilities and user management

## Next Steps

1. Implement enhanced authority types
2. Integrate authority system with DataService
3. Update AuthContext with authority features
4. Implement migration logic
5. Deploy and test in stages
