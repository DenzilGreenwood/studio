/**
 * Auth Context Integration with DataService
 * Version: 2.1.0
 * Date: September 15, 2025
 * 
 * Authentication system with DataService architecture and ZKE v1.1.2
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
import { UserRole, Permission, type AuthorityUserProfile } from '@/types';
import { checkPassphrasesWithToast, checkPassphrasesDetailed, type PassphraseCheckResult } from '@/utils/passphrase-check';
import { encryptForStorage } from '@/lib/encryption-context';
import { canUserProceed } from '@/utils/passphrase-utils';

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
  canUserProceed: () => boolean;
  handlePassphraseError: () => Promise<void>;
  initializeDataService: (passphrase: string) => Promise<void>;
  checkPassphrasesWithToast: () => PassphraseCheckResult;
  checkPassphrasesDetailed: () => PassphraseCheckResult;

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
      // Store passphrase encrypted for security
      sessionStorage.setItem('userPassphrase', encryptForStorage(passphrase));
      
      // Validate that the user can now proceed with the new passphrase
      if (!canUserProceed()) {
        throw new Error('Invalid passphrase: cannot decrypt user data');
      }
      
      // Derive encryption key from passphrase (for compatibility)
      const salt = await getUserSalt(firebaseUser.uid);
      const key = await deriveKey(passphrase, salt);
      
      // Initialize authority system directly with passphrase
      const authorityDataService = new AuthorityDataService(firebaseUser.uid, passphrase);
      
      // Try to load authority profile
      const profileResult = await authorityDataService.getDocument('profile', 'main');
      let authorityProfile: AuthorityUserProfile | null = null;
      
      if (profileResult.success && profileResult.data) {
        authorityProfile = profileResult.data as AuthorityUserProfile;
        authorityDataService.setAuthorityProfile(authorityProfile);
      }
      
      // Set authority system state
      setAuthorityDataService(authorityDataService);
      setAuthorityProfile(authorityProfile);
      
      // Set regular DataService and user profile
      setEncryptionKey(key);
      setDataService(authorityDataService);
      setUser(authorityProfile as UserProfile || null);
      
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
    
    if (!canUserProceed()) {
      throw new Error('User passphrase validation failed - cannot proceed with account deletion');
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
    if (!canUserProceed()) {
      // User passphrase validation failed, cannot refresh profile
      return;
    }
    
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
   * Check if passphrase is available - using unified validation
   */
  const checkPassphraseAvailability = (): boolean => {
    return canUserProceed();
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
   * Check both user passphrase and session passphrase with toast notifications
   */
  const checkPassphrasesWithToastFunc = (): PassphraseCheckResult => {
    return checkPassphrasesWithToast();
  };

  /**
   * Check passphrases with detailed status and recommendations
   */
  const checkPassphrasesDetailedFunc = (): PassphraseCheckResult => {
    return checkPassphrasesDetailed();
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
    if (!canUserProceed()) {
      return { success: false, error: 'User passphrase validation failed' };
    }
    
    if (!authorityDataService) {
      return { success: false, error: 'Authority DataService not initialized' };
    }
    
    return await authorityDataService.adminUpdateUserRole(targetUserId, role);
  };

  /**
   * Grant permission to user (admin operation)
   */
  const grantPermission = async (targetUserId: string, permission: Permission): Promise<{ success: boolean; error?: string }> => {
    if (!canUserProceed()) {
      return { success: false, error: 'User passphrase validation failed' };
    }
    
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
    canUserProceed,
    handlePassphraseError,
    initializeDataService,
    checkPassphrasesWithToast: checkPassphrasesWithToastFunc,
    checkPassphrasesDetailed: checkPassphrasesDetailedFunc,

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
  
  // Guard against SSG/SSR by checking if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return a safe default during SSG/SSR - this should match AuthContextType exactly
    return {
      user: null,
      firebaseUser: null,
      dataService: null,
      encryptionKey: null,
      loading: true,
      logout: async () => {},
      deleteUserAccountAndData: async () => {},
      refreshUserProfile: async () => {},
      checkPassphraseAvailability: () => false,
      canUserProceed: () => false,
      handlePassphraseError: async () => {},
      initializeDataService: async () => {},
      checkPassphrasesWithToast: () => ({ userPassphraseAvailable: false, sessionPassphraseAvailable: false, bothAvailable: false, message: 'SSR not supported' }),
      checkPassphrasesDetailed: () => ({ userPassphraseAvailable: false, sessionPassphraseAvailable: false, bothAvailable: false, message: 'SSR not supported' }),
      authorityProfile: null,
      authorityDataService: null,
      hasPermission: () => false,
      hasRole: () => false,
      isAdmin: () => false,
      switchToAdminMode: async () => {},
      updateUserRole: async () => ({ success: false, error: 'SSR not supported' }),
      grantPermission: async () => ({ success: false, error: 'SSR not supported' }),
    };
  }

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
