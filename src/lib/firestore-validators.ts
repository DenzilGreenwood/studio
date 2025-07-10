// src/lib/firestore-validators.ts
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Firestore Timestamp schema
const FirestoreTimestampSchema = z.custom<Timestamp>((val) => val instanceof Timestamp, {
  message: "Expected Firestore Timestamp",
});

// Date or Timestamp schema for flexible handling
const DateOrTimestampSchema = z.union([
  z.date(),
  FirestoreTimestampSchema,
]);

// UserProfile validation schema
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  pseudonym: z.string().optional(),
  ageRange: z.string().optional(),
  primaryChallenge: z.string().optional(),
  createdAt: DateOrTimestampSchema,
  lastSessionAt: DateOrTimestampSchema.optional(),
  lastCheckInAt: DateOrTimestampSchema.optional(),
  fcmToken: z.string().optional(),
  sessionCount: z.number().optional(),
  // Encryption fields
  encryptedPassphrase: z.string().optional(),
  passphraseSalt: z.string().optional(),
  passphraseIv: z.string().optional(),
});

// ChatMessage validation schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(['user', 'ai']),
  text: z.string(),
  timestamp: DateOrTimestampSchema,
  phaseName: z.string(),
});

// Goal validation schema
export const GoalSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
  createdAt: DateOrTimestampSchema,
});

// Summary interaction schema
const SummaryInteractionSchema = z.object({
  aiQuestion: z.string(),
  userResponse: z.string(),
}).nullable();

// Session summary schema
const SessionSummarySchema = z.object({
  insightSummary: z.string(),
  actualReframedBelief: z.string(),
  actualLegacyStatement: z.string(),
  topEmotions: z.string(),
  reframedBeliefInteraction: SummaryInteractionSchema.optional(),
  legacyStatementInteraction: SummaryInteractionSchema.optional(),
  generatedAt: DateOrTimestampSchema,
  downloadUrl: z.string().optional(),
}).optional();

// ProtocolSession validation schema
export const ProtocolSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  circumstance: z.string(),
  ageRange: z.string().optional(),
  startTime: DateOrTimestampSchema,
  endTime: DateOrTimestampSchema.optional(),
  completedPhases: z.number(),
  summary: SessionSummarySchema,
  userReflection: z.string().optional(),
  userReflectionUpdatedAt: DateOrTimestampSchema.optional(),
  goals: z.array(GoalSchema).optional(),
  feedbackId: z.string().optional(),
  feedbackSubmittedAt: DateOrTimestampSchema.optional(),
});

// SessionFeedback validation schema
export const SessionFeedbackSchema = z.object({
  feedbackId: z.string().optional(),
  sessionId: z.string(),
  userId: z.string(),
  circumstance: z.string(),
  helpfulRating: z.enum(["Not helpful", "Somewhat helpful", "Very helpful", ""]),
  improvementSuggestion: z.string().optional(),
  email: z.string().email().optional(),
  timestamp: DateOrTimestampSchema,
});

// Validation functions
export const validateUserProfile = (data: unknown) => {
  return UserProfileSchema.safeParse(data);
};

export const validateProtocolSession = (data: unknown) => {
  return ProtocolSessionSchema.safeParse(data);
};

export const validateChatMessage = (data: unknown) => {
  return ChatMessageSchema.safeParse(data);
};

export const validateSessionFeedback = (data: unknown) => {
  return SessionFeedbackSchema.safeParse(data);
};

export const validateGoal = (data: unknown) => {
  return GoalSchema.safeParse(data);
};

// Firestore document path validators
export const validateFirestorePaths = {
  user: (userId: string) => {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid userId for Firestore path');
    }
    return `users/${userId}`;
  },
  
  session: (userId: string, sessionId: string) => {
    if (!userId || !sessionId || typeof userId !== 'string' || typeof sessionId !== 'string') {
      throw new Error('Invalid userId or sessionId for Firestore path');
    }
    return `users/${userId}/sessions/${sessionId}`;
  },
  
  message: (userId: string, sessionId: string, messageId?: string) => {
    const basePath = `users/${userId}/sessions/${sessionId}/messages`;
    if (messageId) {
      return `${basePath}/${messageId}`;
    }
    return basePath;
  },
  
  journal: (userId: string, journalId?: string) => {
    const basePath = `users/${userId}/journals`;
    if (journalId) {
      return `${basePath}/${journalId}`;
    }
    return basePath;
  },
  
  journalMessage: (userId: string, journalId: string, messageId?: string) => {
    const basePath = `users/${userId}/journals/${journalId}/messages`;
    if (messageId) {
      return `${basePath}/${messageId}`;
    }
    return basePath;
  },
  
  feedback: (feedbackId?: string) => {
    if (feedbackId) {
      return `feedback/${feedbackId}`;
    }
    return 'feedback';
  }
};

// Data consistency checker
export const checkDataConsistency = {
  session: (sessionData: any) => {
    const issues: string[] = [];
    
    // Check if session has required fields
    if (!sessionData.sessionId) issues.push('Missing sessionId');
    if (!sessionData.userId) issues.push('Missing userId');
    if (!sessionData.circumstance) issues.push('Missing circumstance');
    if (typeof sessionData.completedPhases !== 'number') issues.push('Invalid completedPhases');
    
    // Check timestamp consistency
    if (sessionData.endTime && sessionData.startTime) {
      const startDate = sessionData.startTime instanceof Timestamp 
        ? sessionData.startTime.toDate() 
        : new Date(sessionData.startTime);
      const endDate = sessionData.endTime instanceof Timestamp 
        ? sessionData.endTime.toDate() 
        : new Date(sessionData.endTime);
      
      if (endDate < startDate) {
        issues.push('End time is before start time');
      }
    }
    
    // Check summary consistency
    if (sessionData.completedPhases === 6 && !sessionData.summary) {
      issues.push('Completed session missing summary');
    }
    
    return issues;
  },
  
  feedback: (feedbackData: any) => {
    const issues: string[] = [];
    
    if (!feedbackData.sessionId) issues.push('Missing sessionId');
    if (!feedbackData.userId) issues.push('Missing userId');
    if (!feedbackData.helpfulRating) issues.push('Missing helpfulRating');
    
    return issues;
  }
};
