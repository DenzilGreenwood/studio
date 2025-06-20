// src/types/index.ts
import type { Timestamp } from 'firebase/firestore';

// User Profile Data stored in Firestore
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  pseudonym?: string;
  ageRange?: string; // e.g., "25-34"
  primaryChallenge?: string; // e.g., "Career", "Personal Growth"
  createdAt: Timestamp | Date; // Stored as Timestamp, can be Date in client
  lastSessionAt?: Timestamp | Date; // Stored as Timestamp, can be Date in client
  fcmToken?: string; // For push notifications
  sessionCount?: number;
  hasConsentedToDataUse?: boolean; // New field for consent
}

// Individual Chat Message stored in Firestore subcollection
export interface ChatMessage {
  id: string; // Document ID from Firestore
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp | Date; // Server timestamp
  phaseName: string; // Name of the protocol phase
}

// Session Data stored in Firestore
export interface ProtocolSession {
  sessionId: string; // Document ID (same as Firestore document ID)
  userId: string;
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  completedPhases: number;
  reframedBelief?: string; 
  legacyStatement?: string; 
  topEmotions?: string; 
  
  reframedBeliefInteraction?: {
    aiQuestion: string;
    userResponse: string;
  };
  legacyStatementInteraction?: {
    aiQuestion: string;
    userResponse: string;
  };

  summary?: {
    insightSummary: string; 
    actualReframedBelief: string; 
    actualLegacyStatement: string;
    topEmotions: string;
    reframedBeliefInteraction?: { aiQuestion: string; userResponse: string } | null; // Ensure can be null
    legacyStatementInteraction?: { aiQuestion: string; userResponse: string } | null; // Ensure can be null
    generatedAt: Timestamp | Date;
    downloadUrl?: string; 
  };

  feedbackId?: string; // ID of the feedback document in the 'feedback' collection
  feedbackSubmittedAt?: Timestamp | Date; // When feedback was submitted
}


// Feedback Data stored in the top-level 'feedback' collection
export interface SessionFeedback {
  feedbackId?: string; // Document ID from Firestore, generated automatically
  sessionId: string;
  userId: string; // UID of the authenticated user
  helpfulRating: "Not helpful" | "Somewhat helpful" | "Very helpful" | "";
  improvementSuggestion?: string;
  email?: string; // Optional email for follow-up
  timestamp: Timestamp | Date;
}


// For Phase 4: Cognitive Profile (Future use)
export interface CognitiveProfile {
  userId: string; 
  systemsThinking?: number; 
  legacyOrientation?: number;
  emotionalDepth?: number;
  patternRecognition?: number;
  lastUpdated: Timestamp | Date;
}
