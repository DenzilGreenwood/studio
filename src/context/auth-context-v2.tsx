/**
 * Updated Auth Context Integration with DataService
 * Version: 2.1.0
 * Date: September 15, 2025
 * 
 * Migration guide for integrating the authentication system
 * with the new DataService architecture and ZKE v1.1.2
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { type DataService } from '@/dataservice/dataservice';
import { deriveKey } from '@/dataservice/cryptoService';
import { AuthorityDataService } from '@/dataservice/authorityDataService';
import { AuthorityInitializer } from '@/dataservice/authorityMigration';
import { UserRole, Permission, type AuthorityUserProfile } from '@/types';

/**
 * Enhanced Auth Context with DataService Integration
 */
interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  dataService: DataService | null;
  encryptionKey: CryptoKey | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteUserAccountAndData: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  checkPassphraseAvailability: () => boolean;
  handlePassphraseError: () => Promise<void>;
  initializeDataService: (passphrase: string) => Promise<void>;

  // Enhanced authority features
  authorityProfile: AuthorityUserProfile | null;
  authorityDataService: AuthorityDataService | null;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  
  // Admin operations
  switchToAdminMode: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  grantPermission: (userId: string, permission: Permission) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Service result interface for consistent error handling
 */
interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * DataService compatible user profile interface
 */
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dataService, setDataService] = useState<DataService | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorityProfile, setAuthorityProfile] = useState<AuthorityUserProfile | null>(null);
  const [authorityDataService, setAuthorityDataService] = useState<AuthorityDataService | null>(null);

  /**
   * Initialize DataService with authority system
   */
  const initializeDataService = async (passphrase: string): Promise<void> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Store passphrase
      sessionStorage.setItem('userPassphrase', passphrase);
      
      // Derive encryption key from passphrase
      const salt = await getUserSalt(firebaseUser.uid);
      const key = await deriveKey(passphrase, salt);
      
      // Initialize authority system
      const authorityResult = await AuthorityInitializer.initializeAuthoritySession(
        firebaseUser.uid,
        key
      );
      
      if (!authorityResult.success) {
        throw new Error(authorityResult.error || 'Failed to initialize authority system');
      }
      
      // Set authority system state
      setAuthorityDataService(authorityResult.authorityDataService || null);
      setAuthorityProfile(authorityResult.authorityProfile || null);
      
      // Set regular DataService and user profile
      setEncryptionKey(key);
      setDataService(authorityResult.authorityDataService || null);
      setUser(authorityResult.authorityProfile as UserProfile || null);
      
      // DataService initialized with authority system
    } catch (error) {
      // Clear sensitive data on error
      sessionStorage.removeItem('userPassphrase');
      setEncryptionKey(null);
      setDataService(null);
      setAuthorityDataService(null);
      setAuthorityProfile(null);
      throw error;
    }
  };

  /**
   * Get user's salt for key derivation
   */
  const getUserSalt = async (userId: string): Promise<Uint8Array> => {
    // This would typically be stored in a secure location
    // For now, we'll generate a deterministic salt based on userId
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash.slice(0, 32)); // 32 bytes for salt
  };

  /**
   * Load user profile using DataService
   */
  const loadUserProfileWithDataService = async (service: DataService): Promise<void> => {
    try {
      const result = await service.getDocument<DataServiceUserProfile>('profile', 'main');
      
      if (result.success && result.data) {
        setUser(result.data as UserProfile);
      } else {
        // Create initial profile if it doesn't exist
        await createInitialUserProfile(service);
      }
    } catch {
      // Failed to load user profile
      setUser(null);
    }
  };

  /**
   * Create initial user profile with DataService
   */
  const createInitialUserProfile = async (service: DataService): Promise<void> => {
    if (!firebaseUser) return;

    const initialProfile: DataServiceUserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
      createdAt: new Date(),
      sessionCount: 0,
    };

    const result = await service.saveDocument('profile', 'main', initialProfile);
    
    if (result.success) {
      setUser(initialProfile as UserProfile);
    } else {
      throw new Error('Failed to create user profile');
    }
  };

  /**
   * Migrate existing user data to DataService
   */
  const _migrateUserDataToDataService = async (service: DataService): Promise<ServiceResult> => {
    try {
      // This would contain migration logic for existing users
      // 1. Read existing data from Firestore using old structure
      // 2. Encrypt and save using DataService
      // 3. Mark migration as complete
      
      // Starting user data migration...
      
      // For now, just mark as completed
      const migrationResult = await service.updateDocument('profile', 'main', {
        migrationStatus: 'completed',
        lastDataServiceUpdate: new Date(),
        encryptionVersion: '1.1.2'
      });

      return migrationResult;
    } catch (error) {
      // Migration failed
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      };
    }
  };

  /**
   * Enhanced logout with DataService cleanup
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      // Clear DataService and encryption key
      setDataService(null);
      setEncryptionKey(null);
      
      // Clear session storage
      sessionStorage.removeItem('userPassphrase');
      sessionStorage.removeItem('session_encryption_key');
      
      // Firebase logout
      await firebaseSignOut(auth);
    } catch {
      // Error during logout
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enhanced account deletion with DataService
   */
  const deleteUserAccountAndData = async (): Promise<void> => {
    if (!firebaseUser || !dataService) {
      throw new Error('User not authenticated or DataService not initialized');
    }

    setLoading(true);
    const userId = firebaseUser.uid;

    try {
      // Starting account deletion with DataService...

      // Delete all user collections using DataService
      const collections = ['journals', 'sessions', 'reports', 'trash'];
      
      for (const collectionName of collections) {
        const result = await dataService.getCollection(collectionName);
        if (result.success && result.data) {
          for (const doc of result.data) {
            if (doc && typeof doc === 'object' && 'id' in doc && typeof doc.id === 'string') {
              await dataService.deleteDocument(collectionName, doc.id);
            }
          }
        }
      }

      // Delete user profile
      await dataService.deleteDocument('profile', 'main');
      
      // Delete feedback (this would need special handling as it's not encrypted)
      await deleteFeedbackData(userId);

      // Finally, delete the Firebase Auth user
      // Deleting Firebase Auth user...
      await firebaseDeleteUser(firebaseUser);

      // Account deletion completed successfully
    } catch (error) {
      // Error deleting user account
      setLoading(false);
      throw error;
    }
  };

  /**
   * Delete user feedback data (unencrypted)
   */
  const deleteFeedbackData = async (userId: string): Promise<void> => {
    // This would need to use direct Firestore access since feedback is unencrypted
    // Implementation would depend on your feedback system
    // Deleting feedback data for user: userId
    void userId; // Prevent unused parameter warning
  };

  /**
   * Refresh user profile using DataService
   */
  const refreshUserProfile = async (): Promise<void> => {
    if (!dataService) {
      // DataService not initialized, cannot refresh profile
      return;
    }

    try {
      await loadUserProfileWithDataService(dataService);
    } catch {
      // Failed to refresh user profile
    }
  };

  /**
   * Check if passphrase is available
   */
  const checkPassphraseAvailability = (): boolean => {
    return !!dataService && !!encryptionKey;
  };

  /**
   * Handle passphrase errors
   */
  const handlePassphraseError = async (): Promise<void> => {
    // Clear DataService and encryption key
    setDataService(null);
    setEncryptionKey(null);
    
    // Clear session storage
    sessionStorage.removeItem('userPassphrase');
    
    // Redirect to login would be handled by the calling component
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!authorityProfile) return false;
    
    // Admin has all permissions
    if (authorityProfile.role === UserRole.ADMIN) {
      return true;
    }
    
    return authorityProfile.permissions.includes(permission);
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: UserRole): boolean => {
    if (!authorityProfile) return false;
    return authorityProfile.role === role;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  /**
   * Switch to admin mode (placeholder)
   */
  const switchToAdminMode = async (): Promise<void> => {
    if (!isAdmin()) {
      throw new Error('Admin permissions required');
    }
    // Implementation for admin mode switching
  };

  /**
   * Update user role (admin operation)
   */
  const updateUserRole = async (targetUserId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!authorityDataService) {
      return { success: false, error: 'Authority DataService not initialized' };
    }
    
    return await authorityDataService.adminUpdateUserRole(targetUserId, role);
  };

  /**
   * Grant permission to user (admin operation)
   */
  const grantPermission = async (targetUserId: string, permission: Permission): Promise<{ success: boolean; error?: string }> => {
    if (!authorityDataService) {
      return { success: false, error: 'Authority DataService not initialized' };
    }
    
    return await authorityDataService.adminGrantPermission(targetUserId, permission);
  };

  /**
   * Auth state change handler
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (!fbUser) {
        // User logged out
        setUser(null);
        setDataService(null);
        setEncryptionKey(null);
        setLoading(false);
      } else {
        // User logged in, but we need passphrase to initialize DataService
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    dataService,
    encryptionKey,
    loading,
    logout,
    deleteUserAccountAndData,
    refreshUserProfile,
    checkPassphraseAvailability,
    handlePassphraseError,
    initializeDataService,

    // Enhanced authority features
    authorityProfile,
    authorityDataService,
    hasPermission,
    hasRole,
    isAdmin,
    
    // Admin operations
    switchToAdminMode,
    updateUserRole,
    grantPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Helper function to create user profile document (legacy compatibility)
 */
export const createUserProfileDocument = async (
  userAuth: FirebaseUser,
  additionalData: Partial<UserProfile> = {}
): Promise<void> => {
  // This function would need to be updated to work with DataService
  // For now, it's a placeholder that maintains the existing interface
  // Creating user profile document for: userAuth.uid, additionalData
  void userAuth;
  void additionalData;
};

/**
 * Helper function to update user profile document (legacy compatibility)
 */
export const updateUserProfileDocument = async (
  uid: string,
  dataToUpdate: Partial<UserProfile>
): Promise<void> => {
  // This function would need to be updated to work with DataService
  // For now, it's a placeholder that maintains the existing interface
  // Updating user profile document for: uid, dataToUpdate
  void uid;
  void dataToUpdate;
};
