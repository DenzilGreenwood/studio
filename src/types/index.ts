import type {Timestamp} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  pseudonym?: string;
  ageRange?: string;
  primaryChallenge?: string;
  createdAt: Timestamp | Date;
  lastSessionAt?: Timestamp | Date;
  hasConsentedToDataUse?: boolean;
  isAdmin?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  phaseName: string;
}

export interface KeyInteraction {
  aiQuestion: string;
  userResponse: string;
}

export interface ClaritySummaryContentType {
  insightSummary: string;
  actualReframedBelief: string;
  actualLegacyStatement: string;
  topEmotions: string;
  reframedBeliefInteraction: KeyInteraction | null;
  legacyStatementInteraction: KeyInteraction | null;
  generatedAt?: Timestamp | Date;
}

export interface ProtocolSession {
  id: string;
  userId: string;
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  completedPhases: number;
  isComplete: boolean;
  summary?: ClaritySummaryContentType;
  feedbackId?: string;
  feedbackSubmittedAt?: Timestamp | Date;
}

export interface PhaseStep {
  id?: string;
  phaseName: string;
  userInput: string;
  aiOutput: string;
  timestamp: Timestamp | Date;
  userId: string;
}

export interface SessionFeedback {
  id?: string;
  sessionId: string;
  userId: string;
  helpfulRating: 'Not helpful' | 'Somewhat helpful' | 'Very helpful' | '';
  improvementSuggestion?: string;
  email?: string;
  timestamp: Timestamp | Date;
}

export interface Review {
  id: string;
  userId: string;
  sessionId: string;
  rating: number;
  comments: string;
  clarityGained: string;
  recommend: boolean;
  createdAt: Timestamp;
}

export interface CognitiveProfile {
  // For future use, e.g., storing cognitive signature results
}
