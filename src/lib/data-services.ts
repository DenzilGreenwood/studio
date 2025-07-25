/**
 * Data Services - Consolidated Database Operations
 * Version: 1.0.0
 * Date: July 21, 2025
 * 
 * Centralized module containing all database operations for the CognitiveInsight app.
 * This file consolidates database functions from various files to provide a single
 * source of truth for all Firestore interactions.
 * 
 * Original files consolidated:
 * - src/lib/firestore-operations.ts
 * - src/lib/user-limit.ts
 * - src/lib/session-utils.ts
 * - src/lib/journal-operations.ts
 * - src/lib/session-report-utils.ts
 * - src/lib/trash-cleanup.ts
 * - src/services/feedbackService.ts
 * - src/services/recoveryService.ts
 * - src/dataservice/dataservice.ts (partial consolidation)
 */

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
  Timestamp,
  limit,
  deleteDoc,
  onSnapshot
} from './firebase';

import { 
  increment,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
  type WhereFilterOp
} from 'firebase/firestore';

import { 
  validateUserProfile, 
  validateProtocolSession, 
  validateSessionFeedback,
  validateFirestorePaths,
  checkDataConsistency
} from './firestore-validators';

import { 
  reportError, 
  reportWarning, 
  reportInfo, 
  createUserFriendlyMessage,
  ERROR_CONTEXTS
} from './error-reporter';

import { 
  decryptDataWithMetadata,
  generateRecoveryKey,
  encryptDataWithMetadata,
  getEncryptionBlobInfo 
} from './encryption';

import type { 
  UserProfile, 
  ProtocolSession, 
  SessionFeedback, 
  ChatMessage
} from '@/types';

import type { JournalEntry, JournalMessage } from '@/types/journals';
import { 
  FeedbackEntry, 
  CreateFeedbackRequest, 
  FeedbackAnalytics,
  validateFeedback,
  sanitizeFeedbackMessage,
  getCurrentAppVersion,
  FEEDBACK_CONTEXTS
} from '@/types/feedback';

// =============================================================================
// USER OPERATIONS
// =============================================================================

const userOperations = {
  /**
   * Get user profile by ID
   */
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
        reportError('User data validation failed', ERROR_CONTEXTS.USER, validation.error);
        return null;
      }
      
      return validation.data as UserProfile;
    } catch (error) {
      reportError(createUserFriendlyMessage('fetch user profile'), ERROR_CONTEXTS.USER, error);
      throw error;
    }
  },

  /**
   * Create a new user profile
   */
  async create(userData: Omit<UserProfile, 'createdAt'> & { createdAt?: any }): Promise<void> {
    try {
      const userWithTimestamp = {
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
      };
      
      const userDocRef = doc(db, validateFirestorePaths.user(userData.uid));
      await setDoc(userDocRef, userWithTimestamp);
    } catch (error) {
      reportError(createUserFriendlyMessage('create user profile'), ERROR_CONTEXTS.USER, error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, validateFirestorePaths.user(userId));
      await updateDoc(userDocRef, updates);
    } catch (error) {
      reportError(createUserFriendlyMessage('update user profile'), ERROR_CONTEXTS.USER, error);
      throw error;
    }
  }
};

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

const sessionOperations = {
  /**
   * Get session by ID
   */
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
        reportError('Session data validation failed', ERROR_CONTEXTS.SESSION, validation.error);
        return null;
      }
      
      // Check data consistency
      const consistencyIssues = checkDataConsistency.session(sessionData);
      if (consistencyIssues.length > 0) {
        reportWarning('Session data consistency issues detected', ERROR_CONTEXTS.SESSION, consistencyIssues);
      }
      
      return validation.data as ProtocolSession;
    } catch (error) {
      reportError(createUserFriendlyMessage('fetch session'), ERROR_CONTEXTS.SESSION, error);
      throw error;
    }
  },

  /**
   * Create a new session
   */
  async create(userId: string, sessionData: Omit<ProtocolSession, 'sessionId' | 'startTime'> & { startTime?: ReturnType<typeof serverTimestamp> }): Promise<string> {
    try {
      const sessionWithTimestamp = {
        ...sessionData,
        startTime: sessionData.startTime || serverTimestamp(),
      };
      
      const sessionsCollectionRef = collection(db, `users/${userId}/sessions`);
      const newSessionRef = await addDoc(sessionsCollectionRef, sessionWithTimestamp);
      
      return newSessionRef.id;
    } catch (error) {
      reportError(createUserFriendlyMessage('create session'), ERROR_CONTEXTS.SESSION, error);
      throw error;
    }
  },

  /**
   * Update session
   */
  async update(userId: string, sessionId: string, updates: Partial<ProtocolSession>): Promise<void> {
    try {
      const sessionDocRef = doc(db, validateFirestorePaths.session(userId, sessionId));
      await updateDoc(sessionDocRef, updates);
    } catch (error) {
      reportError(createUserFriendlyMessage('update session'), ERROR_CONTEXTS.SESSION, error);
      throw error;
    }
  },

  /**
   * Get user sessions with options
   */
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
      reportError(createUserFriendlyMessage('fetch user sessions'), ERROR_CONTEXTS.SESSION, error);
      throw error;
    }
  },

  /**
   * Check for active session
   */
  async checkForActiveSession(userId: string): Promise<{sessionId: string; circumstance: string; completedPhases: number; startTime: Date} | null> {
    try {
      // First try with the composite query
      try {
        const allSessionsQuery = query(
          collection(db, `users/${userId}/sessions`),
          where('isDeleted', '!=', true), // Exclude deleted sessions
          orderBy("startTime", "desc")
        );
        const allSessionsSnap = await getDocs(allSessionsQuery);
        
        // Find the first active session (completedPhases < 6)
        const activeSessionDoc = allSessionsSnap.docs.find(doc => {
          const data = doc.data();
          return (data.completedPhases || 0) < 6;
        });
        
        if (activeSessionDoc) {
          const sessionData = activeSessionDoc.data() as ProtocolSession;
          return {
            sessionId: activeSessionDoc.id,
            circumstance: sessionData.circumstance,
            completedPhases: sessionData.completedPhases,
            startTime: sessionData.startTime instanceof Date ? sessionData.startTime : sessionData.startTime.toDate()
          };
        }
      } catch (indexError) {
        reportInfo("Composite index not available, falling back to basic query", ERROR_CONTEXTS.SESSION, indexError);
        
        // Fallback: Get all sessions without isDeleted filter
        const allSessionsQuery = query(
          collection(db, `users/${userId}/sessions`),
          orderBy("startTime", "desc")
        );
        const allSessionsSnap = await getDocs(allSessionsQuery);
        
        // Find the first active session that's not deleted
        const activeSessionDoc = allSessionsSnap.docs.find(doc => {
          const data = doc.data();
          return !data.isDeleted && (data.completedPhases || 0) < 6;
        });
        
        if (activeSessionDoc) {
          const sessionData = activeSessionDoc.data() as ProtocolSession;
          return {
            sessionId: activeSessionDoc.id,
            circumstance: sessionData.circumstance,
            completedPhases: sessionData.completedPhases,
            startTime: sessionData.startTime instanceof Date ? sessionData.startTime : sessionData.startTime.toDate()
          };
        }
      }
      
      return null;
    } catch (error) {
      reportError(createUserFriendlyMessage('check for active sessions'), ERROR_CONTEXTS.SESSION, error);
      return null;
    }
  },

  /**
   * Get completed sessions
   */
  async getCompletedSessions(userId: string): Promise<ProtocolSession[]> {
    try {
      // First try with the composite query
      try {
        const sessionsQuery = query(
          collection(db, `users/${userId}/sessions`),
          where('isDeleted', '!=', true), // Exclude deleted sessions
          where('completedPhases', '==', 6),
          orderBy("startTime", "desc")
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        
        return sessionsSnap.docs.map(doc => ({
          ...doc.data(),
          sessionId: doc.id
        })) as ProtocolSession[];
      } catch (indexError) {
        reportInfo("Composite index not available for completed sessions, falling back", ERROR_CONTEXTS.SESSION, indexError);
        
        // Fallback: Get all sessions and filter in memory
        const allSessionsQuery = query(
          collection(db, `users/${userId}/sessions`),
          orderBy("startTime", "desc")
        );
        const allSessionsSnap = await getDocs(allSessionsQuery);
        
        return allSessionsSnap.docs
          .filter(doc => {
            const data = doc.data();
            return !data.isDeleted && data.completedPhases === 6;
          })
          .map(doc => ({
            ...doc.data(),
            sessionId: doc.id
          })) as ProtocolSession[];
      }
    } catch (error) {
      reportError(createUserFriendlyMessage('fetch completed sessions'), ERROR_CONTEXTS.SESSION, error);
      return [];
    }
  }
};

// =============================================================================
// MESSAGE OPERATIONS
// =============================================================================

const messageOperations = {
  /**
   * Create a new message
   */
  async create(userId: string, sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp?: ReturnType<typeof serverTimestamp> }): Promise<string> {
    try {
      const messageWithTimestamp = {
        ...messageData,
        timestamp: messageData.timestamp || serverTimestamp(),
      };
      
      const messagesCollectionRef = collection(db, validateFirestorePaths.message(userId, sessionId));
      const newMessageRef = await addDoc(messagesCollectionRef, messageWithTimestamp);
      
      return newMessageRef.id;
    } catch (error) {
      reportError(createUserFriendlyMessage('create message'), ERROR_CONTEXTS.MESSAGE, error);
      throw error;
    }
  },

  /**
   * Get session messages
   */
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
      reportError(createUserFriendlyMessage('fetch session messages'), ERROR_CONTEXTS.MESSAGE, error);
      throw error;
    }
  }
};

// =============================================================================
// FEEDBACK OPERATIONS
// =============================================================================

const feedbackOperations = {
  /**
   * Create feedback
   */
  async create(feedbackData: Omit<SessionFeedback, 'feedbackId' | 'timestamp'> & { timestamp?: ReturnType<typeof serverTimestamp> }): Promise<string> {
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
      reportError(createUserFriendlyMessage('create feedback'), ERROR_CONTEXTS.FEEDBACK, error);
      throw error;
    }
  },

  /**
   * Get all feedback
   */
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
      reportError(createUserFriendlyMessage('fetch feedback'), ERROR_CONTEXTS.FEEDBACK, error);
      throw error;
    }
  },

  /**
   * Submit user feedback to Firestore
   */
  async submitFeedback(
    userId: string,
    feedbackRequest: CreateFeedbackRequest
  ): Promise<{ success: boolean; error?: string; feedbackId?: string }> {
    try {
      // Validate feedback data
      const validation = validateFeedback(feedbackRequest);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid feedback: ${validation.errors.join(', ')}`
        };
      }

      // Sanitize message if provided
      const sanitizedMessage = feedbackRequest.message 
        ? sanitizeFeedbackMessage(feedbackRequest.message)
        : undefined;

      // Prepare feedback entry
      const feedbackEntry: Omit<FeedbackEntry, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
        userId,
        rating: feedbackRequest.rating,
        message: sanitizedMessage,
        createdAt: serverTimestamp(),
        pageContext: feedbackRequest.pageContext,
        version: feedbackRequest.version || getCurrentAppVersion()
      };

      // Submit to Firestore
      const feedbackRef = collection(db, 'feedback');
      const docRef = await addDoc(feedbackRef, feedbackEntry);

      return {
        success: true,
        feedbackId: docRef.id
      };

    } catch (error) {
      // Log error for debugging (remove in production or use proper logging service)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error submitting feedback:', error);
      }
      return {
        success: false,
        error: 'Failed to submit feedback. Please try again.'
      };
    }
  },

  /**
   * Delete user's own feedback (user-initiated)
   */
  async deleteFeedback(
    feedbackId: string,
    _userId: string // Underscore prefix to indicate intentionally unused parameter
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      await deleteDoc(feedbackRef);

      return { success: true };

    } catch (error) {
      // Log error for debugging (remove in production or use proper logging service)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error deleting feedback:', error);
      }
      return {
        success: false,
        error: 'Failed to delete feedback. Please try again.'
      };
    }
  },

  /**
   * Get user's own feedback history (limited view)
   */
  async getUserFeedbackHistory(
    userId: string,
    limitCount: number = 10
  ): Promise<{ success: boolean; feedback?: FeedbackEntry[]; error?: string }> {
    try {
      const feedbackRef = collection(db, 'feedback');
      const q = query(
        feedbackRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const feedback: FeedbackEntry[] = [];

      querySnapshot.forEach((doc) => {
        feedback.push({
          ...doc.data() as FeedbackEntry,
          // Ensure we have the document ID for potential deletion
          id: doc.id
        } as FeedbackEntry & { id: string });
      });

      return {
        success: true,
        feedback
      };

    } catch (error) {
      // Log error for debugging (remove in production or use proper logging service)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error fetching user feedback:', error);
      }
      return {
        success: false,
        error: 'Failed to fetch feedback history.'
      };
    }
  },

  /**
   * Admin-only: Get feedback analytics for reporting
   */
  async getFeedbackAnalytics(
    startDate: Date,
    endDate: Date,
    pageContext?: string
  ): Promise<{ success: boolean; analytics?: FeedbackAnalytics; error?: string }> {
    try {
      const feedbackRef = collection(db, 'feedback');
      let q = query(
        feedbackRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );

      // Add page context filter if specified
      if (pageContext) {
        q = query(q, where('pageContext', '==', pageContext));
      }

      const querySnapshot = await getDocs(q);
      const feedbackList: FeedbackEntry[] = [];

      querySnapshot.forEach((doc) => {
        feedbackList.push(doc.data() as FeedbackEntry);
      });

      // Calculate analytics
      const totalCount = feedbackList.length;
      if (totalCount === 0) {
        return {
          success: true,
          analytics: {
            averageRating: 0,
            totalCount: 0,
            ratingDistribution: {},
            commonThemes: [],
            timeRange: { start: startDate, end: endDate }
          }
        };
      }

      // Rating distribution and average
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      feedbackList.forEach(feedback => {
        totalRating += feedback.rating;
        ratingDistribution[feedback.rating]++;
      });

      const averageRating = totalRating / totalCount;

      // Extract common themes from messages
      const messages = feedbackList
        .filter(f => f.message && f.message.trim().length > 0)
        .map(f => f.message!.toLowerCase());

      const commonThemes = this.extractCommonThemes(messages);

      // Context breakdown
      const contextBreakdown: Record<string, { count: number; averageRating: number }> = {};
      
      Object.values(FEEDBACK_CONTEXTS).forEach(context => {
        const contextFeedback = feedbackList.filter(f => f.pageContext === context);
        if (contextFeedback.length > 0) {
          const contextRatingSum = contextFeedback.reduce((sum, f) => sum + f.rating, 0);
          contextBreakdown[context] = {
            count: contextFeedback.length,
            averageRating: contextRatingSum / contextFeedback.length
          };
        }
      });

      const analytics: FeedbackAnalytics = {
        averageRating,
        totalCount,
        ratingDistribution,
        commonThemes,
        timeRange: { start: startDate, end: endDate },
        contextBreakdown
      };

      return {
        success: true,
        analytics
      };

    } catch (error) {
      // Log error for debugging (remove in production or use proper logging service)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error fetching feedback analytics:', error);
      }
      return {
        success: false,
        error: 'Failed to fetch feedback analytics.'
      };
    }
  },

  /**
   * Extract common themes from feedback messages
   */
  extractCommonThemes(messages: string[]): string[] {
    if (messages.length === 0) return [];

    // Common positive and negative keywords
    const positiveKeywords = ['great', 'good', 'excellent', 'amazing', 'helpful', 'useful', 'love', 'like', 'easy', 'simple'];
    const negativeKeywords = ['bad', 'terrible', 'difficult', 'hard', 'confusing', 'slow', 'bug', 'error', 'problem', 'issue'];
    const featureKeywords = ['ui', 'interface', 'design', 'speed', 'performance', 'feature', 'function', 'navigation'];

    const allKeywords = [...positiveKeywords, ...negativeKeywords, ...featureKeywords];
    const keywordCounts: Record<string, number> = {};

    // Count keyword occurrences
    messages.forEach(message => {
      allKeywords.forEach(keyword => {
        if (message.includes(keyword)) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
    });

    // Return top themes
    return Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }
};

// =============================================================================
// JOURNAL OPERATIONS
// =============================================================================

const journalOperations = {
  /**
   * Create a new journal entry
   */
  async create(journal: Omit<JournalEntry, 'id'>): Promise<string> {
    const journalsCollectionRef = collection(db, `users/${journal.userId}/journals`);
    const newJournalRef = await addDoc(journalsCollectionRef, {
      ...journal,
      metadata: {
        ...journal.metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    });
    return newJournalRef.id;
  },

  /**
   * Update journal entry
   */
  async update(userId: string, journalId: string, updates: Partial<JournalEntry>): Promise<void> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}`);
    await updateDoc(docRef, {
      ...updates,
      metadata: {
        ...updates.metadata,
        updatedAt: serverTimestamp()
      }
    });
  },

  /**
   * Get journal entry by ID
   */
  async get(userId: string, journalId: string, userPassphrase?: string): Promise<JournalEntry | null> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = { id: docSnap.id, ...docSnap.data() } as JournalEntry;
    
    if (data.encryptedContent && userPassphrase) {
      try {
        const decryptedContent = await decryptDataWithMetadata(
          data.encryptedContent,
          userPassphrase
        );
        return {
          ...data,
          content: decryptedContent
        };
      } catch {
        // Silent fallback to encrypted data if decryption fails
        return data;
      }
    }

    return data;
  },

  /**
   * Get journal entries by user
   */
  async getByUser(userId: string, userPassphrase?: string): Promise<JournalEntry[]> {
    const q = query(
      collection(db, `users/${userId}/journals`),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const journals: JournalEntry[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as JournalEntry;
      
      if (data.encryptedContent && userPassphrase) {
        try {
          const decryptedContent = await decryptDataWithMetadata(
            data.encryptedContent,
            userPassphrase
          );
          journals.push({
            ...data,
            content: decryptedContent
          });
        } catch {
          // Silent fallback to encrypted data if decryption fails
          journals.push(data);
        }
      } else {
        journals.push(data);
      }
    }
    
    return journals;
  },

  /**
   * Delete journal entry
   */
  async delete(userId: string, journalId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}`);
    await deleteDoc(docRef);
  }
};

// =============================================================================
// JOURNAL MESSAGE OPERATIONS
// =============================================================================

const journalMessageOperations = {
  /**
   * Create a new journal message
   */
  async create(userId: string, journalId: string, message: Omit<JournalMessage, 'id' | 'journalId'>): Promise<string> {
    const messagesCollectionRef = collection(db, `users/${userId}/journals/${journalId}/messages`);
    const newMessageRef = await addDoc(messagesCollectionRef, {
      ...message,
      journalId,
      timestamp: serverTimestamp()
    });
    return newMessageRef.id;
  },

  /**
   * Get journal messages by journal ID
   */
  async getByJournal(userId: string, journalId: string, userPassphrase?: string): Promise<JournalMessage[]> {
    const q = query(
      collection(db, `users/${userId}/journals/${journalId}/messages`),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages: JournalMessage[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as JournalMessage;
      
      if (data.encryptedContent && userPassphrase) {
        try {
          const decryptedContent = await decryptDataWithMetadata(
            data.encryptedContent,
            userPassphrase
          );
          messages.push({
            ...data,
            content: decryptedContent
          });
        } catch {
          // Silent fallback to encrypted data if decryption fails
          messages.push(data);
        }
      } else {
        messages.push(data);
      }
    }
    
    return messages;
  },

  /**
   * Delete journal message
   */
  async delete(userId: string, journalId: string, messageId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}/messages/${messageId}`);
    await deleteDoc(docRef);
  }
};

// =============================================================================
// USER LIMIT OPERATIONS
// =============================================================================

const MAX_USERS = 30;

const userLimitOperations = {
  /**
   * Get current user count
   */
  async getCurrentUserCount(): Promise<number> {
    try {
      const counterRef = doc(db, 'system', 'userCount');
      const counterDoc = await getDoc(counterRef);
      
      if (counterDoc.exists()) {
        return counterDoc.data().count || 0;
      } else {
        // Initialize counter if it doesn't exist
        try {
          await setDoc(counterRef, { count: 0 });
          return 0;
        } catch {
          // Error initializing user count - return 0 to allow signup to proceed
          return 0;
        }
      }
    } catch {
      // Return 0 instead of throwing to allow signup flow to continue
      // Defaulting to user count of 0 due to access error
      return 0;
    }
  },

  /**
   * Increment user count
   */
  async incrementUserCount(): Promise<void> {
    try {
      const counterRef = doc(db, 'system', 'userCount');
      
      // First try to update if the document exists
      const counterDoc = await getDoc(counterRef);
      if (counterDoc.exists()) {
        await updateDoc(counterRef, {
          count: increment(1)
        });
      } else {
        // If document doesn't exist, create it with count 1
        await setDoc(counterRef, { count: 1 });
      }
    } catch {
      // Don't throw error - let signup proceed even if count increment fails
      // User count increment failed, but allowing signup to proceed
    }
  },

  /**
   * Check if new user can be created
   */
  async canCreateNewUser(): Promise<{ allowed: boolean; message?: string }> {
    try {
      const currentCount = await this.getCurrentUserCount();
      
      if (currentCount >= MAX_USERS) {
        return {
          allowed: false,
          message: `Registration is currently closed. We have reached our maximum capacity of ${MAX_USERS} users for this beta version.`
        };
      }
      
      return { allowed: true };
    } catch {
      // Default to allowing registration if check fails to avoid blocking users
      // User limit check failed, defaulting to allow registration
      return { 
        allowed: true, 
        message: 'Unable to verify user capacity, but registration is open' 
      };
    }
  },

  /**
   * Get maximum users allowed
   */
  getMaxUsers(): number {
    return MAX_USERS;
  }
};

// =============================================================================
// RECOVERY OPERATIONS
// =============================================================================

// Enhanced recovery data structure with comprehensive metadata
interface RecoveryData {
  encryptedPassphrase: string;
  createdAt: Date;
  userId: string;
  version?: string;
  lastUpdated?: Date;
  algorithm?: string;
}

// UID-based recovery result interface
export interface UIDRecoveryResult {
  uid: string | null;
  exists: boolean;
  error?: string;
}

// Enhanced recovery result interface
export interface RecoveryResult {
  passphrase: string | null;
  success: boolean;
  error?: string;
  metadata?: {
    version?: string;
    algorithm?: string;
    isLegacyFormat?: boolean;
    uid?: string;
  };
}

const recoveryOperations = {
  /**
   * Store encrypted passphrase with recovery key
   */
  async storeEncryptedPassphrase(userId: string, passphrase: string) {
    try {
      const recoveryKey = generateRecoveryKey();
      
      // Use unified encryption with metadata
      const encryptedBlob = await encryptDataWithMetadata(passphrase, recoveryKey);
      
      // Extract metadata for audit purposes
      const blobInfo = getEncryptionBlobInfo(encryptedBlob);
      
      const recoveryData: RecoveryData = {
        encryptedPassphrase: encryptedBlob,
        createdAt: new Date(),
        userId: userId,
        version: blobInfo.version,
        algorithm: blobInfo.algorithm
      };

      // Store encrypted passphrase blob - server never sees plaintext passphrase
      await setDoc(doc(db, `users/${userId}/recovery/data`), recoveryData);
      
      return recoveryKey;
    } catch {
      throw new Error("Failed to store recovery data");
    }
  },

  /**
   * Get encrypted passphrase blob for client-side decryption
   */
  async getEncryptedPassphraseBlob(userId: string): Promise<string | null> {
    try {
      const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));
      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data() as RecoveryData;
      return data.encryptedPassphrase || null;
    } catch {
      return null;
    }
  },

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UIDRecoveryResult> {
    try {
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(emailQuery);

      if (querySnapshot.empty) {
        return {
          uid: null,
          exists: false,
          error: 'No user found with this email address'
        };
      }

      // Should only be one user per email due to Firebase Auth constraints
      const userDoc = querySnapshot.docs[0];
      return {
        uid: userDoc.id,
        exists: true
      };
    } catch (error) {
      return {
        uid: null,
        exists: false,
        error: `Failed to search for user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Zero-Knowledge Recovery: Decrypt passphrase client-side using recovery key
   */
  async recoverPassphraseZeroKnowledge(uid: string, recoveryKey: string): Promise<RecoveryResult> {
    try {
      const snapshot = await getDoc(doc(db, `users/${uid}/recovery/data`));
      if (!snapshot.exists()) {
        return {
          passphrase: null,
          success: false,
          error: 'No recovery data found for this user'
        };
      }

      const data = snapshot.data() as RecoveryData;
      const encryptedBlob = data.encryptedPassphrase;

      if (!encryptedBlob) {
        return {
          passphrase: null,
          success: false,
          error: 'Recovery data is corrupted'
        };
      }

      try {
        // Use unified decryption with automatic format detection
        const decryptedPassphrase = await decryptDataWithMetadata(encryptedBlob, recoveryKey);
        
        return {
          passphrase: decryptedPassphrase,
          success: true,
          metadata: {
            version: data.version,
            algorithm: data.algorithm,
            isLegacyFormat: false,
            uid: uid
          }
        };
      } catch (decryptionError) {
        // Log error and return failure
        reportError(createUserFriendlyMessage('recover passphrase'), ERROR_CONTEXTS.RECOVERY, decryptionError);
        return {
          passphrase: null,
          success: false,
          error: 'Invalid recovery key or corrupted recovery data: ' + (decryptionError instanceof Error ? decryptionError.message : 'Unknown error')
        };
      }
    } catch (error) {
        reportError(createUserFriendlyMessage('recover passphrase'), ERROR_CONTEXTS.RECOVERY, error);
      return {
        passphrase: null,
        success: false,
        error: 'Failed to access recovery data'
      };
    }
  },

  /**
   * Check if recovery data exists for user
   */
  async hasRecoveryData(userId: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));
      return snapshot.exists();
    } catch {
      return false;
    }
  }
};

// =============================================================================
// TRASH AND CLEANUP OPERATIONS
// =============================================================================

const trashOperations = {
  /**
   * Cleanup sessions that have been in trash for more than 30 days
   */
  async cleanupOldDeletedSessions(userId: string): Promise<number> {
    try {
      // Calculate the cutoff date (30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query for sessions that are deleted and older than 30 days
      const sessionsRef = collection(db, `users/${userId}/sessions`);
      const oldDeletedQuery = query(
        sessionsRef,
        where('isDeleted', '==', true),
        where('deletedAt', '<', Timestamp.fromDate(thirtyDaysAgo))
      );

      const snapshot = await getDocs(oldDeletedQuery);
      const deletePromises = snapshot.docs.map(sessionDoc => 
        deleteDoc(doc(db, `users/${userId}/sessions/${sessionDoc.id}`))
      );

      await Promise.all(deletePromises);
      reportInfo(`Cleaned up ${snapshot.docs.length} old deleted sessions for user ${userId}`, ERROR_CONTEXTS.TRASH);
      return snapshot.docs.length;
    } catch (error) {
      reportError(createUserFriendlyMessage('cleanup old deleted sessions'), ERROR_CONTEXTS.TRASH, error);
      throw error;
    }
  },

  /**
   * Get sessions that will be automatically deleted soon (within 7 days)
   */
  async getSessionsToBeDeleted(userId: string): Promise<(ProtocolSession & { daysUntilDeletion: number })[]> {
    try {
      // Calculate dates for sessions that will be deleted in 7 days
      const twentyThreeDaysAgo = new Date();
      twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23); // 30 - 7 = 23

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sessionsRef = collection(db, `users/${userId}/sessions`);
      const warningQuery = query(
        sessionsRef,
        where('isDeleted', '==', true),
        where('deletedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        where('deletedAt', '<', Timestamp.fromDate(twentyThreeDaysAgo))
      );

      const snapshot = await getDocs(warningQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        sessionId: doc.id,
        daysUntilDeletion: Math.max(0, 30 - Math.floor((Date.now() - doc.data().deletedAt.toDate().getTime()) / (1000 * 60 * 60 * 24)))
      })) as (ProtocolSession & { daysUntilDeletion: number })[];
    } catch (error) {
      reportError(createUserFriendlyMessage('get sessions to be deleted'), ERROR_CONTEXTS.TRASH, error);
      throw error;
    }
  }
};

// =============================================================================
// BATCH OPERATIONS FOR COMPLEX TRANSACTIONS
// =============================================================================

const batchOperations = {
  /**
   * Update session and user in a batch transaction
   */
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
      reportError(createUserFriendlyMessage('batch update session and user'), ERROR_CONTEXTS.SESSION, error);
      throw error;
    }
  },

  /**
   * Create feedback and update session in a batch transaction
   */
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
      reportError(createUserFriendlyMessage('batch create feedback and update session'), ERROR_CONTEXTS.FEEDBACK, error);
      throw error;
    }
  }
};

// =============================================================================
// REAL-TIME LISTENERS
// =============================================================================

const listenerOperations = {
  /**
   * Listen to real-time updates for a collection
   */
  onCollectionSnapshot<T extends Record<string, unknown>>(
    userId: string,
    collectionName: string,
    callback: (data: T[], error?: string) => void,
    options?: {
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      where?: { field: string; operator: WhereFilterOp; value: unknown }[];
    }
  ): Unsubscribe {
    try {
      const collectionPath = `users/${userId}/${collectionName}`;
      const collectionRef = collection(db, collectionPath);
      
      let q = query(collectionRef);

      // Apply filters
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      return onSnapshot(q, 
        (snapshot: QuerySnapshot<DocumentData>) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as unknown as T[];
          callback(data);
        },
        (error) => {
          reportError(createUserFriendlyMessage('listener error'), ERROR_CONTEXTS.TRASH, error);
          callback([], error.message);
        }
      );
    } catch (error) {
      reportError(createUserFriendlyMessage('Error setting up listener'), ERROR_CONTEXTS.TRASH, error);
      callback([], error instanceof Error ? error.message : 'Unknown error');
      return () => {}; // Return empty unsubscribe function
    }
  },

  /**
   * Listen to real-time updates for a single document
   */
  onDocumentSnapshot<T extends Record<string, unknown>>(
    documentPath: string,
    callback: (data: T | null, error?: string) => void
  ): Unsubscribe {
    try {
      const docRef = doc(db, documentPath);
      
      return onSnapshot(docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = {
              id: snapshot.id,
              ...snapshot.data()
            } as unknown as T;
            callback(data);
          } else {
            callback(null);
          }
        },
        (error) => {
          reportError(createUserFriendlyMessage('Document listener error'), ERROR_CONTEXTS.TRASH, error);
          callback(null, error.message);
        }
      );
    } catch (error) {
      reportError(createUserFriendlyMessage('Error setting up document listener'), ERROR_CONTEXTS.TRASH, error);
      callback(null, error instanceof Error ? error.message : 'Unknown error');
      return () => {}; // Return empty unsubscribe function
    }
  }
};

// =============================================================================
// EXPORT ALL OPERATIONS
// =============================================================================

export const dataServices = {
  user: userOperations,
  session: sessionOperations,
  message: messageOperations,
  feedback: feedbackOperations,
  journal: journalOperations,
  journalMessage: journalMessageOperations,
  userLimit: userLimitOperations,
  recovery: recoveryOperations,
  trash: trashOperations,
  batch: batchOperations,
  listener: listenerOperations
};

// Export individual operation objects for convenience
export {
  userOperations,
  sessionOperations,
  messageOperations,
  feedbackOperations,
  journalOperations,
  journalMessageOperations,
  userLimitOperations,
  recoveryOperations,
  trashOperations,
  batchOperations,
  listenerOperations
};

// Export as default
export default dataServices;
