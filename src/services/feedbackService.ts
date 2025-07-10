/**
 * Feedback Service
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Handles feedback collection, submission, and basic analytics
 * while maintaining user privacy and zero-knowledge principles.
 */

import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  FeedbackEntry, 
  CreateFeedbackRequest, 
  FeedbackAnalytics,
  validateFeedback,
  sanitizeFeedbackMessage,
  getCurrentAppVersion,
  FEEDBACK_CONTEXTS
} from '@/types/feedback';

/**
 * Submit user feedback to Firestore
 */
export async function submitFeedback(
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
}

/**
 * Delete user's own feedback (user-initiated)
 */
export async function deleteFeedback(
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
}

/**
 * Get user's own feedback history (limited view)
 */
export async function getUserFeedbackHistory(
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
}

/**
 * Admin-only: Get feedback analytics for reporting
 * Note: This function should only be called by authenticated admin users
 */
export async function getFeedbackAnalytics(
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

    const commonThemes = extractCommonThemes(messages);

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
}

/**
 * Extract common themes from feedback messages
 * Simple keyword extraction for basic sentiment analysis
 */
function extractCommonThemes(messages: string[]): string[] {
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

/**
 * Helper function to determine feedback quality score
 */
export function calculateFeedbackQuality(feedback: FeedbackEntry): {
  score: number;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Rating contributes to quality
  score += feedback.rating * 20; // 20-100 points
  factors.push(`Rating: ${feedback.rating}/5`);

  // Message presence and length
  if (feedback.message && feedback.message.trim().length > 0) {
    if (feedback.message.length >= 20) {
      score += 20;
      factors.push('Detailed message provided');
    } else {
      score += 10;
      factors.push('Message provided');
    }
  }

  // Context information
  if (feedback.pageContext) {
    score += 10;
    factors.push('Context specified');
  }

  // Version information helps with debugging
  if (feedback.version) {
    score += 5;
    factors.push('Version included');
  }

  return {
    score: Math.min(score, 100), // Cap at 100
    factors
  };
}
