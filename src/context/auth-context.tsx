// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, // Keep for createUserProfileDocument's check
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  Timestamp,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  query,
  onSnapshot, // Import onSnapshot
  where
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { encryptUserProfile, decryptUserProfile, getPassphraseSafely } from '@/lib/data-encryption';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteUserAccountAndData: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  checkPassphraseAvailability: () => boolean;
  handlePassphraseError: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function deleteCollection(collectionPath: string) {
  try {
    console.log(`Deleting collection: ${collectionPath}`);
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef); 
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`Collection ${collectionPath} is empty, nothing to delete`);
      return;
    }
    
    console.log(`Deleting ${snapshot.docs.length} documents from ${collectionPath}`);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Successfully deleted collection: ${collectionPath}`);
  } catch (error) {
    console.error(`Error deleting collection ${collectionPath}:`, error);
    // Don't throw the error - just log it and continue with other deletions
    // This prevents one failed collection from stopping the entire deletion process
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot(); 
        unsubscribeSnapshot = null;
      }

      if (fbUser) {
        setLoading(true); // Set loading true while fetching/subscribing to Firestore
        const userRef = doc(db, "users", fbUser.uid);
        unsubscribeSnapshot = onSnapshot(userRef, 
          (docSnap) => { 
            if (docSnap.exists()) {
              const encryptedProfileData = docSnap.data() as UserProfile;
              
              // Check if passphrase is available before attempting decryption
              const passphrase = sessionStorage.getItem('userPassphrase');
              
              if (passphrase) {
                // Decrypt profile data if passphrase is available
                decryptUserProfile(encryptedProfileData)
                  .then(profileData => {
                    const convertTimestamp = (field: unknown) =>
                      field instanceof Timestamp ? field.toDate() : (field && typeof (field as {toDate?: () => Date}).toDate === 'function' ? (field as {toDate: () => Date}).toDate() : field);

                    setUser({
                      ...(profileData as UserProfile),
                      createdAt: convertTimestamp((profileData as UserProfile).createdAt) as Date,
                      lastSessionAt: (profileData as UserProfile).lastSessionAt ? convertTimestamp((profileData as UserProfile).lastSessionAt) as Date : undefined,
                      lastCheckInAt: (profileData as UserProfile).lastCheckInAt ? convertTimestamp((profileData as UserProfile).lastCheckInAt) as Date : undefined,
                    });
                  })
                  .catch(error => {
                    console.error('Failed to decrypt user profile:', error);
                    // Fallback to showing encrypted data indicators
                    const convertTimestamp = (field: unknown) =>
                      field instanceof Timestamp ? field.toDate() : (field && typeof (field as {toDate?: () => Date}).toDate === 'function' ? (field as {toDate: () => Date}).toDate() : field);

                    setUser({
                      ...encryptedProfileData,
                      displayName: '[Encrypted Profile - Cannot Decrypt]',
                      createdAt: convertTimestamp(encryptedProfileData.createdAt) as Date,
                      lastSessionAt: encryptedProfileData.lastSessionAt ? convertTimestamp(encryptedProfileData.lastSessionAt) as Date : undefined,
                      lastCheckInAt: encryptedProfileData.lastCheckInAt ? convertTimestamp(encryptedProfileData.lastCheckInAt) as Date : undefined,
                    });
                  })
                  .finally(() => setLoading(false));
              } else {
                // No passphrase available - show encrypted profile temporarily
                console.log('No passphrase available, showing encrypted profile temporarily');
                const convertTimestamp = (field: unknown) =>
                  field instanceof Timestamp ? field.toDate() : (field && typeof (field as {toDate?: () => Date}).toDate === 'function' ? (field as {toDate: () => Date}).toDate() : field);

                setUser({
                  ...encryptedProfileData,
                  displayName: '[Encrypted Profile - Please Enter Passphrase]',
                  createdAt: convertTimestamp(encryptedProfileData.createdAt) as Date,
                  lastSessionAt: encryptedProfileData.lastSessionAt ? convertTimestamp(encryptedProfileData.lastSessionAt) as Date : undefined,
                  lastCheckInAt: encryptedProfileData.lastCheckInAt ? convertTimestamp(encryptedProfileData.lastCheckInAt) as Date : undefined,
                });
                setLoading(false);
              }
            } else {
              // Doc doesn't exist (e.g., new user, before createUserProfileDocument completes, or deleted)
              // Fallback to a minimal profile based on Firebase Auth data
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName, // From Firebase Auth
                createdAt: new Date(), // Temporary
              });
            }
            setLoading(false);
          },
          (error) => { 
            console.error("Error listening to user document:", error);
            setUser(null); 
            setLoading(false);
          }
        );
      } else { 
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setUser and setFirebaseUser will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading
    }
  };

  const deleteUserAccountAndData = async () => {
    if (!firebaseUser) {
      throw new Error("User not authenticated.");
    }
    setLoading(true);
    const userId = firebaseUser.uid;

    try {
      console.log('Starting account deletion for user:', userId);

      // Delete sessions and their subcollections
      const sessionsPath = `users/${userId}/sessions`;
      const sessionsQuery = query(collection(db, sessionsPath));
      const sessionsSnapshot = await getDocs(sessionsQuery);

      console.log(`Found ${sessionsSnapshot.docs.length} sessions to delete`);

      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionId = sessionDoc.id;
        // Delete messages subcollection for each session
        await deleteCollection(`users/${userId}/sessions/${sessionId}/messages`);
      }
      // Delete all sessions in one go
      await deleteCollection(sessionsPath);
      
      // Delete reports collection (new architecture)
      console.log('Deleting reports collection...');
      await deleteCollection(`users/${userId}/reports`);
      
      // Delete journals collection (new architecture)
      console.log('Deleting journals collection...');
      await deleteCollection(`users/${userId}/journals`);
      
      // Delete all feedback from the top-level collection in a batch
      console.log('Deleting user feedback...');
      const feedbackBatch = writeBatch(db);
      const feedbackQuery = query(collection(db, 'feedback'), where('userId', '==', userId));
      const feedbackSnapshot = await getDocs(feedbackQuery);
      feedbackSnapshot.forEach(doc => feedbackBatch.delete(doc.ref));
      if (feedbackSnapshot.docs.length > 0) {
        await feedbackBatch.commit();
      }

      // Delete the user document itself
      console.log('Deleting user document...');
      await deleteDoc(doc(db, "users", userId));
      
      // Finally, delete the Firebase Auth user
      console.log('Deleting Firebase Auth user...');
      await firebaseDeleteUser(firebaseUser);

      console.log('Account deletion completed successfully');

    } catch (error) {
      console.error("Error deleting user account and data: ", error);
      setLoading(false); 
      
      if ((error as {code?: string}).code === 'auth/requires-recent-login') {
        throw new Error("This operation is sensitive and requires recent authentication. Please log out and log back in, then try again.");
      }
      
      // Provide more specific error information
      let errorMessage = "Failed to delete account and data. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = "Permission denied. You may not have the necessary permissions to delete this data.";
        } else if (error.message.includes('not-found')) {
          errorMessage = "Some data was already deleted. Continuing with account deletion.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      throw new Error(errorMessage);
    }
    // setLoading(false) will be handled by onAuthStateChanged after user signs out
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser) return;
    
    const passphrase = sessionStorage.getItem('userPassphrase');
    if (!passphrase) return;
    
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const encryptedProfileData = docSnap.data() as UserProfile;
        const profileData = await decryptUserProfile(encryptedProfileData);
        
        const convertTimestamp = (field: unknown) =>
          field instanceof Timestamp ? field.toDate() : (field && typeof (field as {toDate?: () => Date}).toDate === 'function' ? (field as {toDate: () => Date}).toDate() : field);
        
        setUser({
          ...(profileData as UserProfile),
          createdAt: convertTimestamp((profileData as UserProfile).createdAt) as Date,
          lastSessionAt: (profileData as UserProfile).lastSessionAt ? convertTimestamp((profileData as UserProfile).lastSessionAt) as Date : undefined,
          lastCheckInAt: (profileData as UserProfile).lastCheckInAt ? convertTimestamp((profileData as UserProfile).lastCheckInAt) as Date : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const checkPassphraseAvailability = (): boolean => {
    return getPassphraseSafely() !== null;
  };

  const handlePassphraseError = async (): Promise<void> => {
    // Clear the user passphrase from session storage
    sessionStorage.removeItem('userPassphrase');
    
    // Log out the user to force re-authentication
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, deleteUserAccountAndData, refreshUserProfile, checkPassphraseAvailability, handlePassphraseError }}>
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

export const createUserProfileDocument = async (
  userAuth: FirebaseUser, // Renamed to avoid confusion with UserProfile type
  additionalData: Partial<UserProfile> = {}
): Promise<void> => {
  if (!userAuth) return;
  const userRef = doc(db, "users", userAuth.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { email, displayName: authDisplayName } = userAuth; // displayName from Firebase Auth user
    const createdAt = serverTimestamp();
    const pseudonymToStore = additionalData.pseudonym ? additionalData.pseudonym.trim() : "";
    
    try {
      // Prepare user profile data
      const userProfileData = {
        uid: userAuth.uid,
        email, // Email stays plain for authentication
        displayName: pseudonymToStore || authDisplayName || email?.split('@')[0] || 'Anonymous User',
        createdAt,
        pseudonym: pseudonymToStore,
        lastSessionAt: null,
        sessionCount: 0,
        lastCheckInAt: null,
        // Include encryption metadata if provided
        ...(additionalData.encryptedPassphrase && {
          encryptedPassphrase: additionalData.encryptedPassphrase,
          passphraseSalt: additionalData.passphraseSalt,
          passphraseIv: additionalData.passphraseIv,
        }),
      };

      // Encrypt sensitive profile data before storing
      const encryptedProfileData = await encryptUserProfile(userProfileData) as Record<string, unknown>;
      
      // Store both encrypted profile data and searchable email for recovery
      await setDoc(userRef, {
        ...encryptedProfileData,
        email: email, // Keep email unencrypted for search functionality
        uid: userAuth.uid, // Keep UID unencrypted for indexing
      });
    } catch (error) {
      console.error("Error creating user document: ", error);
      throw error;
    }
  }
};

export const updateUserProfileDocument = async (
  uid: string,
  dataToUpdate: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      ...dataToUpdate,
    });
  } catch (error) {
    console.error("Error updating user document: ", error);
    throw error;
  }
};
