// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile, // Keep for auth-form
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
import { ADMIN_USER_IDS } from '@/hooks/use-is-admin';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteUserAccountAndData: () => Promise<void>; 
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
              const profileData = docSnap.data() as UserProfile;
              const convertTimestamp = (field: any) =>
                field instanceof Timestamp ? field.toDate() : (field && typeof field.toDate === 'function' ? field.toDate() : field) ;

              setUser({
                ...profileData,
                createdAt: convertTimestamp(profileData.createdAt),
                lastSessionAt: profileData.lastSessionAt ? convertTimestamp(profileData.lastSessionAt) : undefined,
                lastCheckInAt: profileData.lastCheckInAt ? convertTimestamp(profileData.lastCheckInAt) : undefined,
              });
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
      
      if ((error as any).code === 'auth/requires-recent-login') {
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

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, deleteUserAccountAndData }}>
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
    const isUserAdmin = ADMIN_USER_IDS.includes(userAuth.uid);
    
    try {
      await setDoc(userRef, {
        uid: userAuth.uid,
        email,
        displayName: pseudonymToStore || authDisplayName || email?.split('@')[0] || 'Anonymous User',
        createdAt,
        pseudonym: pseudonymToStore,
        ageRange: additionalData.ageRange || '',
        primaryChallenge: additionalData.primaryChallenge || '',
        hasConsentedToDataUse: additionalData.hasConsentedToDataUse || false,
        lastSessionAt: null,
        sessionCount: 0,
        lastCheckInAt: null,
        isAdmin: isUserAdmin,
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
