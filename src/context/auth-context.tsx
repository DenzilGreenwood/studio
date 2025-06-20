'use client';

import type {User} from 'firebase/auth';
import {createContext, useContext, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  onAuthStateChanged,
  signOut,
  deleteUser as deleteFirebaseUser,
} from 'firebase/auth';
import {auth, db} from '@/lib/firebase';
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  deleteUserAccountAndData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  deleteUserAccountAndData: async () => {},
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const deleteUserAccountAndData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No user found to delete');
      return;
    }

    try {
      const userId = currentUser.uid;

      const batch = writeBatch(db);

      // 1. Delete all sessions and their subcollections (messages, phases)
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      for (const sessionDoc of sessionsSnapshot.docs) {
        const messagesRef = collection(sessionDoc.ref, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.forEach(doc => batch.delete(doc.ref));

        const phasesRef = collection(sessionDoc.ref, 'phases');
        const phasesSnapshot = await getDocs(phasesRef);
        phasesSnapshot.forEach(doc => batch.delete(doc.ref));

        batch.delete(sessionDoc.ref);
      }
      
      // 2. Delete all feedback from the root collection
      const feedbackQuery = query(collection(db, 'feedback'), where('userId', '==', userId));
      const feedbackSnapshot = await getDocs(feedbackQuery);
      feedbackSnapshot.forEach(doc => batch.delete(doc.ref));
      
      // 3. Delete the user profile document
      const userDocRef = doc(db, 'users', userId);
      batch.delete(userDocRef);
      
      await batch.commit();

      // 4. Delete the user from Firebase Auth
      await deleteFirebaseUser(currentUser);
      
      router.push('/signup');
    } catch (error) {
      console.error('Error deleting user account and data:', error);
      alert(
        'Error deleting account. You may need to log out and log back in to complete this action.'
      );
    }
  };

  const value = {
    user,
    loading,
    logout,
    deleteUserAccountAndData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
