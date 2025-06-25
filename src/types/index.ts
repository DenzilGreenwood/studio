// src/types/index.ts
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// Core Data Models

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  pseudonym?: string;
  ageRange?: string;
  primaryChallenge?: string;
  createdAt: Timestamp | Date;
  lastSessionAt?: Timestamp | Date;
  lastCheckInAt?: Timestamp | Date;
  fcmToken?: string;
  sessionCount?: number;
  hasConsentedToDataUse?: boolean;
  isAdmin?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp | Date;
  phaseName: string;
}

export interface Goal {
  text: string;
  completed: boolean;
  createdAt: Timestamp | Date;
}

export interface ProtocolSession {
  sessionId: string;
  userId: string;
  circumstance: string;
  ageRange?: string; // Added from profile for admin view
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  completedPhases: number;
  summary?: {
    insightSummary: string;
    actualReframedBelief: string;
    actualLegacyStatement: string;
    topEmotions: string;
    reframedBeliefInteraction?: { aiQuestion: string; userResponse: string } | null;
    legacyStatementInteraction?: { aiQuestion: string; userResponse: string } | null;
    generatedAt: Timestamp | Date;
    downloadUrl?: string;
  };
  userReflection?: string;
  userReflectionUpdatedAt?: Timestamp | Date;
  goals?: Goal[];
  feedbackId?: string;
  feedbackSubmittedAt?: Timestamp | Date;
}

export interface SessionFeedback {
  feedbackId?: string;
  sessionId: string;
  userId: string;
  circumstance: string;
  helpfulRating: "Not helpful" | "Somewhat helpful" | "Very helpful" | "";
  improvementSuggestion?: string;
  email?: string;
  timestamp: Timestamp | Date;
}

export interface CognitiveProfile {
  userId: string;
  systemsThinking?: number;
  legacyOrientation?: number;
  emotionalDepth?: number;
  patternRecognition?: number;
  lastUpdated: Timestamp | Date;
}


// AI Flow Schemas and Types

// For cognitive-edge-protocol
export const protocolPhaseNames = [
  'Stabilize & Structure',
  'Listen for Core Frame',
  'Validate Emotion / Reframe',
  'Provide Grounded Support',
  'Reflective Pattern Discovery',
  'Empower & Legacy Statement',
  'Complete',
] as const;
export const ProtocolPhaseEnum = z.enum(protocolPhaseNames);
export type ProtocolPhase = z.infer<typeof ProtocolPhaseEnum>;

export const CognitiveEdgeProtocolInputSchema = z.object({
  userInput: z.string().describe('The user input for the current phase.'),
  phase: ProtocolPhaseEnum.describe('The current phase of the Cognitive Edge Protocol.'),
  sessionHistory: z.string().optional().describe('The session history to maintain context.'),
  attemptCount: z.number().optional().describe('The number of attempts to get a key response (like a reframe or legacy statement).')
});
export type CognitiveEdgeProtocolInput = z.infer<typeof CognitiveEdgeProtocolInputSchema>;

export const CognitiveEdgeProtocolOutputSchema = z.object({
  response: z.string().describe('The AI response for the current phase.'),
  nextPhase: ProtocolPhaseEnum.describe('The next phase of the Cognitive Edge Protocol.'),
  sessionHistory: z.string().describe('The updated session history.'),
});
export type CognitiveEdgeProtocolOutput = z.infer<typeof CognitiveEdgeProtocolOutputSchema>;


// For clarity-summary-generator
export const ClaritySummaryInputSchema = z.object({
  reframedBelief: z.string().describe('The reframed belief of the user after the session.'),
  legacyStatement: z.string().describe('The legacy statement created by the user during the session.'),
  topEmotions: z.string().describe('The top emotions expressed by the user during the session.'),
});
export type ClaritySummaryInput = z.infer<typeof ClaritySummaryInputSchema>;

export const ClaritySummaryOutputSchema = z.object({
  insightSummary: z.string().describe('The generated insight summary.'),
});
export type ClaritySummaryOutput = z.infer<typeof ClaritySummaryOutputSchema>;


// For sentiment-analysis-flow
export const SentimentAnalysisInputSchema = z.object({
  userMessages: z.string().describe('A string containing all user messages from the conversation, concatenated.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

export const SentimentAnalysisOutputSchema = z.object({
  detectedEmotions: z.string().describe('A comma-separated list of the most prominent emotions expressed by the user during the conversation. Aim for 3-5 key emotions that capture the overall emotional journey.'),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;


// For goal-generator-flow
export const GoalGeneratorInputSchema = z.object({
  sessionSummary: z.string().describe('The AI-generated summary of the cognitive session.'),
  userReflection: z.string().describe("The user's personal reflection or journal entry about the session."),
});
export type GoalGeneratorInput = z.infer<typeof GoalGeneratorInputSchema>;

export const GoalGeneratorOutputSchema = z.object({
  suggestedGoals: z.array(z.string()).describe('An array of 3-5 actionable and meaningful goal suggestions based on the input.'),
});
export type GoalGeneratorOutput = z.infer<typeof GoalGeneratorOutputSchema>;
