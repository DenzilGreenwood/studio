/**
 * Feedback Data Types and Interfaces
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Defines the structure and validation for user feedback collection
 * within the MyImaginaryFriends.ai ecosystem.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Core feedback entry structure as defined in the Feedback Data Architecture v1.0.0
 */
export interface FeedbackEntry {
  userId: string;           // Firebase UID
  rating: number;           // 1–5 stars or emoji score
  message?: string;         // Optional comment
  createdAt: Timestamp;     // Server timestamp
  pageContext?: string;     // Context (e.g., 'onboarding', 'chat', 'journal')
  version?: string;         // App version
}

/**
 * Page context constants for feedback collection
 */
export const FEEDBACK_CONTEXTS = {
  ONBOARDING: 'onboarding',
  CHAT: 'chat',
  JOURNAL: 'journal',
  SESSION: 'session',
  REPORT: 'report',
  SETTINGS: 'settings',
  GENERAL: 'general'
} as const;

export type FeedbackContext = typeof FEEDBACK_CONTEXTS[keyof typeof FEEDBACK_CONTEXTS];

/**
 * Feedback creation request (client-side input)
 */
export interface CreateFeedbackRequest {
  rating: number;
  message?: string;
  pageContext?: FeedbackContext;
  version?: string;
}

/**
 * Feedback analytics aggregation
 */
export interface FeedbackAnalytics {
  averageRating: number;
  totalCount: number;
  ratingDistribution: Record<number, number>;
  commonThemes: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
  contextBreakdown?: Record<FeedbackContext, {
    count: number;
    averageRating: number;
  }>;
}

/**
 * Feedback report for admin dashboard
 */
export interface FeedbackReport {
  period: 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  analytics: FeedbackAnalytics;
  trends: {
    ratingTrend: 'improving' | 'declining' | 'stable';
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    topIssues: string[];
    improvements: string[];
  };
}

/**
 * Validation function for feedback data (client-side)
 */
export function validateFeedback(feedback: CreateFeedbackRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Rating validation
  if (typeof feedback.rating !== 'number') {
    errors.push('Rating must be a number');
  } else if (feedback.rating < 1 || feedback.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  } else if (!Number.isInteger(feedback.rating)) {
    errors.push('Rating must be a whole number');
  }

  // Message validation (optional)
  if (feedback.message !== undefined) {
    if (typeof feedback.message !== 'string') {
      errors.push('Message must be a string');
    } else if (feedback.message.length > 1000) {
      errors.push('Message must be 1000 characters or less');
    }
  }

  // Page context validation (optional)
  if (feedback.pageContext !== undefined) {
    if (!Object.values(FEEDBACK_CONTEXTS).includes(feedback.pageContext as FeedbackContext)) {
      errors.push('Invalid page context');
    }
  }

  // Version validation (optional)
  if (feedback.version !== undefined) {
    if (typeof feedback.version !== 'string') {
      errors.push('Version must be a string');
    } else if (feedback.version.length > 20) {
      errors.push('Version must be 20 characters or less');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize feedback message to remove potentially sensitive information
 */
export function sanitizeFeedbackMessage(message: string): string {
  // Remove common patterns that might contain sensitive info
  return message
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[email]') // Email addresses
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]') // Phone numbers
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]') // Credit card numbers
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]') // SSN patterns
    .trim();
}

/**
 * Get current app version for feedback
 */
export function getCurrentAppVersion(): string {
  // This would typically come from your build process or package.json
  return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
}
