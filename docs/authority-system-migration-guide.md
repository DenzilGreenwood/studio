# Authority System & Data Structure Migration Guide

## Overview

This document provides a comprehensive migration strategy for transitioning the MyImaginaryFriends.ai application from direct Firestore access to the new DataService architecture with Zero-Knowledge Encryption v1.1.2.

## Migration Strategy

### Phase 1: Core Infrastructure Update (✅ Complete)
- DataService implementation
- CryptoService with ZKE v1.1.2
- Updated Firestore rules
- Basic documentation

### Phase 2: Authentication System Migration

#### 2.1 AuthContext Updates
**File**: `src/context/auth-context-v2.tsx`

**Key Changes**:
- Integration with DataService
- Encryption key management
- User profile handling through DataService
- Migration support for existing users

**New Features**:
- `initializeDataService(passphrase: string)` - Initializes DataService with user's encryption key
- Enhanced user profile management with encryption
- Automatic migration detection and handling
- Improved error handling and logging

#### 2.2 Type System Updates

**Enhanced UserProfile Interface**:
```typescript
interface DataServiceUserProfile extends Record<string, unknown> {
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
  // DataService specific fields
  lastDataServiceUpdate?: Date;
  migrationStatus?: 'pending' | 'completed' | 'failed';
  encryptionVersion?: string;
}
```

### Phase 3: Component Integration

#### 3.1 Authentication Flow Updates

**Login Process**:
1. Firebase authentication (email/password)
2. Passphrase collection for encryption
3. DataService initialization with derived key
4. User profile loading through DataService
5. Migration check and execution if needed

**Updated Login Flow**:
```typescript
// In auth-form.tsx or similar component
const { initializeDataService } = useAuth();

const handleLogin = async (credentials: LoginCredentials) => {
  // 1. Firebase authentication
  await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  
  // 2. Initialize DataService with passphrase
  await initializeDataService(credentials.passphrase);
  
  // 3. Redirect to application
  router.push('/protocol');
};
```

#### 3.2 Data Access Pattern Updates

**Before (Direct Firestore)**:
```typescript
// Direct Firestore access
const userRef = doc(db, 'users', userId);
const userSnap = await getDoc(userRef);
const userData = userSnap.data();
```

**After (DataService)**:
```typescript
// DataService access
const { dataService } = useAuth();
const result = await dataService.getDocument('profile', 'main');
if (result.success) {
  const userData = result.data;
}
```

### Phase 4: Migration Implementation

#### 4.1 User Data Migration Strategy

**Migration Process**:
1. **Detection**: Check if user has been migrated (`migrationStatus` field)
2. **Assessment**: Inventory existing user data
3. **Encryption**: Encrypt existing data using DataService
4. **Verification**: Verify successful migration
5. **Cleanup**: Remove old unencrypted data (optional)

**Migration Implementation**:
```typescript
const migrateUserData = async (dataService: DataService, userId: string) => {
  // 1. Check migration status
  const profileResult = await dataService.getDocument('profile', 'main');
  if (profileResult.success && profileResult.data?.migrationStatus === 'completed') {
    return; // Already migrated
  }

  // 2. Migrate user collections
  const collections = ['journals', 'sessions', 'reports'];
  for (const collection of collections) {
    await migrateCollection(dataService, userId, collection);
  }

  // 3. Mark migration as complete
  await dataService.updateDocument('profile', 'main', {
    migrationStatus: 'completed',
    lastDataServiceUpdate: new Date(),
    encryptionVersion: '1.1.2'
  });
};
```

#### 4.2 Collection-Specific Migration

**Journal Migration**:
```typescript
const migrateJournals = async (dataService: DataService, userId: string) => {
  // Read existing journals from old structure
  const oldJournals = await getOldJournalData(userId);
  
  // Encrypt and save using DataService
  for (const journal of oldJournals) {
    await dataService.saveDocument('journals', journal.id, {
      content: journal.content,
      timestamp: journal.createdAt,
      metadata: journal.metadata || {}
    });
  }
};
```

**Session Migration**:
```typescript
const migrateSessions = async (dataService: DataService, userId: string) => {
  // Read existing sessions
  const oldSessions = await getOldSessionData(userId);
  
  // Encrypt and save using DataService
  for (const session of oldSessions) {
    await dataService.saveDocument('sessions', session.id, {
      circumstance: session.circumstance,
      startTime: session.startTime,
      completedPhases: session.completedPhases || 0,
      // ... other session fields
    });
    
    // Migrate session messages
    if (session.messages) {
      for (const message of session.messages) {
        await dataService.saveDocument(
          `sessions/${session.id}/messages`, 
          message.id, 
          message
        );
      }
    }
  }
};
```

### Phase 5: Component Updates

#### 5.1 Hook Updates

**useAuth Hook Enhancements**:
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Enhanced with DataService availability check
  const isDataServiceReady = () => {
    return !!context.dataService && !!context.encryptionKey;
  };
  
  return {
    ...context,
    isDataServiceReady,
  };
};
```

#### 5.2 Component Pattern Updates

**Data Loading Components**:
```typescript
const JournalListComponent = () => {
  const { dataService, isDataServiceReady } = useAuth();
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    if (!isDataServiceReady()) return;

    const loadJournals = async () => {
      const result = await dataService.getCollection('journals', {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 10
      });
      
      if (result.success) {
        setJournals(result.data);
      }
    };

    loadJournals();
  }, [dataService, isDataServiceReady]);

  // Component render logic
};
```

### Phase 6: Security & Validation

#### 6.1 Firestore Rules Updates

**Enhanced Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific data with encryption validation
    match /users/{userId}/{collection=**} {
      allow read, write: if isOwner(userId) && isEncryptedData(resource.data);
    }
    
    // Feedback collection (unencrypted analytics)
    match /feedback/{feedbackId} {
      allow create, delete: if isOwner(resource.data.userId);
      allow read: if isAdmin();
    }
  }

  // Helper functions
  function isOwner(userId) {
    return request.auth != null && request.auth.uid == userId;
  }

  function isEncryptedData(data) {
    return data.keys().hasAll(['encryptedData', 'metadata']) &&
           data.metadata.keys().hasAll(['salt', 'iv', 'version']);
  }

  function isAdmin() {
    return request.auth != null && 
           request.auth.token.email in ['admin@myimaginaryfriends.ai'];
  }
}
```

#### 6.2 Data Validation

**Client-Side Validation**:
```typescript
const validateDataServiceOperation = (operation: string, data: any) => {
  // Validate that sensitive data is properly encrypted
  if (operation === 'save' && !isDataEncrypted(data)) {
    throw new Error('Data must be encrypted before storage');
  }
  
  // Validate user ownership
  if (!isUserAuthorized()) {
    throw new Error('User not authorized for this operation');
  }
};
```

### Phase 7: Testing Strategy

#### 7.1 Migration Testing

**Test Scenarios**:
1. **New User Flow**: Fresh signup → DataService initialization → Data creation
2. **Existing User Migration**: Legacy user → Login → Migration → Data access
3. **Error Handling**: Failed migration → Recovery → Retry
4. **Data Integrity**: Pre/post migration data comparison

**Test Implementation**:
```typescript
describe('DataService Migration', () => {
  test('migrates existing user data successfully', async () => {
    // Setup existing user with legacy data
    const legacyUser = await createLegacyUser();
    
    // Initialize DataService
    const dataService = createDataService(legacyUser.uid, mockEncryptionKey);
    
    // Run migration
    await migrateUserData(dataService, legacyUser.uid);
    
    // Verify migration
    const migratedData = await dataService.getCollection('journals');
    expect(migratedData.success).toBe(true);
    expect(migratedData.data).toHaveLength(legacyUser.journals.length);
  });
});
```

#### 7.2 Integration Testing

**End-to-End Tests**:
```typescript
describe('Authentication Integration', () => {
  test('complete auth flow with DataService', async () => {
    // Login
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="passphrase"]', 'mySecurePassphrase');
    await page.click('[data-testid="login-button"]');
    
    // Verify DataService initialization
    await expect(page).toHaveURL('/protocol');
    
    // Test data operations
    await page.click('[data-testid="create-journal"]');
    await page.fill('[data-testid="journal-content"]', 'Test journal entry');
    await page.click('[data-testid="save-journal"]');
    
    // Verify encrypted storage
    const encryptedData = await getFirestoreDocument('users/test-uid/journals/journal-1');
    expect(encryptedData.encryptedData).toBeDefined();
    expect(encryptedData.metadata).toBeDefined();
  });
});
```

### Phase 8: Deployment Strategy

#### 8.1 Staged Rollout

**Deployment Phases**:
1. **Alpha**: Internal testing with select users
2. **Beta**: Limited rollout to early adopters
3. **Gradual**: Percentage-based rollout
4. **Full**: Complete migration

**Feature Flags**:
```typescript
const useDataService = () => {
  const isEnabled = useFeatureFlag('dataservice-migration');
  const userGroup = useUserGroup();
  
  return isEnabled && (userGroup === 'beta' || userGroup === 'production');
};
```

#### 8.2 Monitoring & Rollback

**Migration Monitoring**:
```typescript
const monitorMigration = (userId: string, status: string, error?: string) => {
  analytics.track('dataservice_migration', {
    userId: userId.substring(0, 8), // Privacy-safe partial ID
    status,
    error,
    timestamp: Date.now(),
    version: '1.1.2'
  });
};
```

**Rollback Strategy**:
1. **Immediate**: Disable DataService via feature flag
2. **Graceful**: Revert to legacy data access patterns
3. **Recovery**: Restore from backup if needed

### Phase 9: Performance Optimization

#### 9.1 Caching Strategy

**In-Memory Caching**:
```typescript
class DataServiceCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
}
```

#### 9.2 Batch Operations

**Optimized Data Loading**:
```typescript
const loadUserDashboard = async (dataService: DataService) => {
  // Batch multiple operations
  const [journals, sessions, reports] = await Promise.all([
    dataService.getCollection('journals', { limit: 5 }),
    dataService.getCollection('sessions', { limit: 3 }),
    dataService.getCollection('reports', { limit: 2 })
  ]);

  return { journals, sessions, reports };
};
```

## Summary

This migration strategy provides a comprehensive approach to transitioning the application to the new DataService architecture while maintaining data integrity, security, and user experience. The phased approach allows for gradual rollout with proper testing and monitoring at each stage.

### Key Benefits
- **Enhanced Security**: Zero-knowledge encryption for all sensitive data
- **Improved Performance**: Optimized data access patterns
- **Better Maintainability**: Centralized data service layer
- **Future-Proof**: Extensible architecture for new features

### Next Steps
1. Complete Phase 2: Implement AuthContext v2
2. Update authentication components
3. Implement migration logic
4. Comprehensive testing
5. Staged deployment with monitoring
