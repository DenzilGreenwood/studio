// src/lib/firestore-operations.ts
// 
// ENCRYPTION INTEGRATION STATUS:
// - User profiles: Encryption will be integrated when passphrase is available
// - Session data: Encryption will be integrated when passphrase is available  
// - Chat messages: Encryption will be integrated when passphrase is available
// - Journal entries: Encryption will be integrated when passphrase is available
// - Feedback: Encryption will be integrated when passphrase is available
//
// Next step: Integrate encryption/decryption helpers from data-encryption.ts
// into all storage/retrieval operations below.
//
import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp
} from './firebase';
import { 
  validateUserProfile, 
  validateProtocolSession, 
  validateSessionFeedback,
  validateFirestorePaths,
  checkDataConsistency
} from './firestore-validators';
import type { UserProfile, ProtocolSession, SessionFeedback, ChatMessage } from '@/types';

// Safe user operations
export const userOperations = {
  async get(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, validateFirestorePaths.user(userId));
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        return null;
      }
      
      const userData = userSnap.data();
      const validation = validateUserProfile(userData);
      
      if (!validation.success) {
        console.error('User data validation failed:', validation.error);
        return null;
      }
      
      return validation.data as UserProfile;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async create(userData: Omit<UserProfile, 'createdAt'> & { createdAt?: any }): Promise<void> {
    try {
      const userWithTimestamp = {
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
      };
      
      const userDocRef = doc(db, validateFirestorePaths.user(userData.uid));
      await setDoc(userDocRef, userWithTimestamp);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async update(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, validateFirestorePaths.user(userId));
      await updateDoc(userDocRef, updates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
};

// Safe session operations
export const sessionOperations = {
  async get(userId: string, sessionId: string): Promise<ProtocolSession | null> {
    try {
      const sessionDocRef = doc(db, validateFirestorePaths.session(userId, sessionId));
      const sessionSnap = await getDoc(sessionDocRef);
      
      if (!sessionSnap.exists()) {
        return null;
      }
      
      const sessionData = { ...sessionSnap.data(), sessionId };
      const validation = validateProtocolSession(sessionData);
      
      if (!validation.success) {
        console.error('Session data validation failed:', validation.error);
        return null;
      }
      
      // Check data consistency
      const consistencyIssues = checkDataConsistency.session(sessionData);
      if (consistencyIssues.length > 0) {
        console.warn('Session data consistency issues:', consistencyIssues);
      }
      
      return validation.data as ProtocolSession;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  },

  async create(userId: string, sessionData: Omit<ProtocolSession, 'sessionId' | 'startTime'> & { startTime?: any }): Promise<string> {
    try {
      const sessionWithTimestamp = {
        ...sessionData,
        startTime: sessionData.startTime || serverTimestamp(),
      };
      
      const sessionsCollectionRef = collection(db, `users/${userId}/sessions`);
      const newSessionRef = await addDoc(sessionsCollectionRef, sessionWithTimestamp);
      
      return newSessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async update(userId: string, sessionId: string, updates: Partial<ProtocolSession>): Promise<void> {
    try {
      const sessionDocRef = doc(db, validateFirestorePaths.session(userId, sessionId));
      await updateDoc(sessionDocRef, updates);
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  async getUserSessions(userId: string, options?: { completedOnly?: boolean; limit?: number }): Promise<ProtocolSession[]> {
    try {
      let sessionQuery = query(
        collection(db, `users/${userId}/sessions`),
        orderBy('startTime', 'desc')
      );

      if (options?.completedOnly) {
        sessionQuery = query(
          collection(db, `users/${userId}/sessions`),
          where('completedPhases', '==', 6),
          orderBy('startTime', 'desc')
        );
      }

      const querySnapshot = await getDocs(sessionQuery);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        sessionId: doc.id,
        startTime: (doc.data().startTime as Timestamp)?.toDate() || new Date(),
        endTime: doc.data().endTime ? (doc.data().endTime as Timestamp)?.toDate() : undefined,
      } as ProtocolSession));
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }
};

// Safe message operations
export const messageOperations = {
  async create(userId: string, sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp?: any }): Promise<string> {
    try {
      const messageWithTimestamp = {
        ...messageData,
        timestamp: messageData.timestamp || serverTimestamp(),
      };
      
      const messagesCollectionRef = collection(db, validateFirestorePaths.message(userId, sessionId));
      const newMessageRef = await addDoc(messagesCollectionRef, messageWithTimestamp);
      
      return newMessageRef.id;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  },

  async getSessionMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    try {
      const messagesQuery = query(
        collection(db, validateFirestorePaths.message(userId, sessionId)),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
      } as ChatMessage));
    } catch (error) {
      console.error('Error fetching session messages:', error);
      throw error;
    }
  }
};

// Safe feedback operations
export const feedbackOperations = {
  async create(feedbackData: Omit<SessionFeedback, 'feedbackId' | 'timestamp'> & { timestamp?: any }): Promise<string> {
    try {
      const feedbackWithTimestamp = {
        ...feedbackData,
        timestamp: feedbackData.timestamp || serverTimestamp(),
      };
      
      const validation = validateSessionFeedback({ ...feedbackWithTimestamp, feedbackId: 'temp' });
      if (!validation.success) {
        throw new Error(`Feedback validation failed: ${validation.error.message}`);
      }
      
      const consistencyIssues = checkDataConsistency.feedback(feedbackWithTimestamp);
      if (consistencyIssues.length > 0) {
        throw new Error(`Feedback consistency issues: ${consistencyIssues.join(', ')}`);
      }
      
      const feedbackCollectionRef = collection(db, validateFirestorePaths.feedback());
      const newFeedbackRef = await addDoc(feedbackCollectionRef, feedbackWithTimestamp);
      
      return newFeedbackRef.id;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  },

  async getAllFeedback(): Promise<SessionFeedback[]> {
    try {
      const feedbackQuery = query(
        collection(db, validateFirestorePaths.feedback()),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(feedbackQuery);
      
      return querySnapshot.docs.map(doc => ({
        feedbackId: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
      } as SessionFeedback));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }
};

// Batch operations for complex transactions
export const batchOperations = {
  async updateSessionAndUser(
    userId: string, 
    sessionId: string, 
    sessionUpdates: Partial<ProtocolSession>,
    userUpdates: Partial<UserProfile>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      const sessionDocRef = doc(db, validateFirestorePaths.session(userId, sessionId));
      const userDocRef = doc(db, validateFirestorePaths.user(userId));
      
      batch.update(sessionDocRef, sessionUpdates);
      batch.update(userDocRef, userUpdates);
      
      await batch.commit();
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  },

  async createFeedbackAndUpdateSession(
    feedbackData: Omit<SessionFeedback, 'feedbackId' | 'timestamp'>,
    userId: string,
    sessionId: string
  ): Promise<string> {
    try {
      const batch = writeBatch(db);
      
      // Create feedback
      const feedbackCollectionRef = collection(db, validateFirestorePaths.feedback());
      const feedbackDocRef = doc(feedbackCollectionRef);
      const feedbackWithTimestamp = {
        ...feedbackData,
        timestamp: serverTimestamp(),
      };
      
      batch.set(feedbackDocRef, feedbackWithTimestamp);
      
      // Update session with feedback ID
      const sessionDocRef = doc(db, validateFirestorePaths.session(userId, sessionId));
      batch.update(sessionDocRef, {
        feedbackId: feedbackDocRef.id,
        feedbackSubmittedAt: serverTimestamp(),
      });
      
      await batch.commit();
      
      return feedbackDocRef.id;
    } catch (error) {
      console.error('Error in feedback creation batch:', error);
      throw error;
    }
  }
};
