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
  // Encryption fields
  encryptedPassphrase?: string;
  passphraseSalt?: string;
  passphraseIv?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp | Date;
  phaseName: string;
  emotionalTone?: {
    primary: string;
    intensity: number; // 1-10 scale
    secondary?: string;
    confidence: number; // 0-1 scale
  };
  isKeyStatement?: boolean;
  statementType?: 'reframed_belief' | 'legacy_statement' | 'insight' | 'breakthrough';
}

export interface EmotionalProgression {
  phaseIndex: number;
  phaseName: string;
  primaryEmotion: string;
  intensity: number;
  timestamp: Timestamp | Date;
  triggerMessage?: string;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  priority?: 'low' | 'medium' | 'high';
}

export interface ProtocolSession {
  sessionId: string;
  userId: string;
  circumstance: string;
  ageRange?: string;
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  completedPhases: number;
  
  // Trash/deletion tracking
  isDeleted?: boolean;
  deletedAt?: Timestamp | Date;
  deletedBy?: string; // userId who deleted it
  
  // Enhanced emotional progression tracking
  emotionalProgression?: EmotionalProgression[];
  keyStatements?: {
    reframedBelief?: {
      statement: string;
      phaseIndex: number;
      timestamp: Timestamp | Date;
      confidence: number;
    };
    legacyStatement?: {
      statement: string;
      phaseIndex: number;
      timestamp: Timestamp | Date;
      confidence: number;
    };
    insights?: Array<{
      insight: string;
      phaseIndex: number;
      timestamp: Timestamp | Date;
      emotionalContext: string;
    }>;
  };
  
  summary?: {
    insightSummary: string;
    actualReframedBelief: string;
    actualLegacyStatement: string;
    topEmotions: string;
    emotionalJourney?: string; // New: narrative of emotional progression
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
  aiReflection?: {
    conversationalHighlights: string;
    actionableItems: string[];
    emotionalInsights: string;
    progressReflection: string;
    encouragingMessage: string;
    reflectionPrompts: string[];
    generatedAt: Timestamp | Date;
  };
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


// For cross-session-analysis-flow
export const CrossSessionAnalysisInputSchema = z.object({
  sessions: z.array(z.object({
    date: z.string().describe('Session date'),
    circumstance: z.string().describe('Challenge or situation addressed'),
    reframedBelief: z.string().describe('The reframed belief developed'),
    legacyStatement: z.string().describe('The legacy statement created'),
    topEmotions: z.string().describe('Primary emotions from the session'),
    emotionalJourney: z.string().optional().describe('Narrative of emotional progression'),
    keyBreakthroughs: z.array(z.string()).optional().describe('Major breakthrough moments'),
    goals: z.array(z.string()).optional().describe('Goals set after the session'),
    completedGoals: z.number().optional().describe('Number of goals completed'),
    duration: z.number().optional().describe('Session duration in minutes')
  })).min(2).describe('Array of session data to analyze'),
  
  timeFrame: z.string().describe('Time period being analyzed (e.g., "last 3 months")'),
  userAge: z.string().optional().describe('User age range for context'),
  focusArea: z.string().optional().describe('Specific area of focus if any (e.g., "anxiety", "relationships")')
});
export type CrossSessionAnalysisInput = z.infer<typeof CrossSessionAnalysisInputSchema>;

export const CrossSessionAnalysisOutputSchema = z.object({
  overallGrowthSummary: z.string().describe('High-level summary of the user\'s growth journey'),
  recurringPatterns: z.object({
    emotionalPatterns: z.array(z.string()).describe('Recurring emotional themes across sessions'),
    challengeTypes: z.array(z.string()).describe('Common types of challenges the user faces'),
    copingStrategies: z.array(z.string()).describe('Effective coping strategies the user has developed'),
    triggerSituations: z.array(z.string()).describe('Situations that commonly trigger difficulties')
  }),
  
  progressIndicators: z.object({
    emotionalResilience: z.object({
      improvement: z.enum(['significant', 'moderate', 'minimal', 'none']),
      evidence: z.string().describe('Specific evidence of improvement')
    }),
    selfAwareness: z.object({
      improvement: z.enum(['significant', 'moderate', 'minimal', 'none']),
      evidence: z.string().describe('Evidence of growing self-awareness')
    }),
    goalAchievement: z.object({
      rate: z.number().min(0).max(100).describe('Percentage of goals achieved'),
      trend: z.enum(['improving', 'stable', 'declining']).describe('Trend in goal achievement'),
      analysis: z.string().describe('Analysis of goal completion patterns'),
      evidence: z.string().describe('Evidence of goal achievement patterns')
    }),
    copingSkills: z.object({
      improvement: z.enum(['significant', 'moderate', 'minimal', 'none']),
      evidence: z.string().describe('Evidence of improved coping abilities')
    })
  }),
  
  areasOfGrowth: z.object({
    strengths: z.array(z.string()).describe('Areas where the user shows consistent strength'),
    improvements: z.array(z.string()).describe('Areas showing notable improvement'),
    opportunities: z.array(z.string()).describe('Areas with potential for further growth')
  }),
  
  futureRecommendations: z.object({
    focusAreas: z.array(z.string()).describe('Suggested areas to focus on in future sessions'),
    strategies: z.array(z.string()).describe('Specific strategies to continue growth'),
    milestones: z.array(z.string()).describe('Suggested milestones to work towards')
  }),
  
  sessionQualityInsights: z.object({
    mostImpactfulSessions: z.array(z.object({
      date: z.string(),
      reason: z.string().describe('Why this session was particularly impactful')
    })),
    patternsThatWork: z.array(z.string()).describe('Patterns in sessions that seem most effective'),
    suggestedImprovements: z.array(z.string()).describe('Ways to enhance future sessions')
  }),

  // Additional fields that the my-progress page expects
  beliefEvolution: z.object({
    coreBeliefsIdentified: z.array(z.string()).describe('Core beliefs that have emerged across sessions'),
    evolutionStory: z.string().describe('How the user\'s beliefs have evolved over time'),
    consistentThemes: z.array(z.string()).optional().describe('Consistent themes in their reframed beliefs')
  }),
  
  recommendations: z.object({
    areasForContinuedGrowth: z.array(z.string()).describe('Areas where continued work would be beneficial'),
    strengthsToLeverage: z.array(z.string()).describe('Strengths the user can build upon'),
    strategiesForChallenges: z.array(z.string()).optional().describe('Strategies for persistent challenges'),
    focusForNextSessions: z.string().describe('Suggested focus for upcoming sessions')
  }),
  
  celebrationsAndMilestones: z.array(z.object({
    milestone: z.string().describe('What they achieved'),
    significance: z.string().describe('Why this is meaningful'),
    evidence: z.string().describe('How this is evidenced in their sessions')
  })),
  
  inspirationalMessage: z.string().describe('An encouraging message about their journey and progress')
});
export type CrossSessionAnalysisOutput = z.infer<typeof CrossSessionAnalysisOutputSchema>;


// For journaling-assistant-flow
export const JournalingAssistantInputSchema = z.object({
  userMessage: z.string().describe('The user\'s message or question for journaling assistance'),
  sessionContext: z.object({
    date: z.string().describe('Session date'),
    circumstance: z.string().describe('Challenge or situation from the session'),
    reframedBelief: z.string().describe('The reframed belief from the session'),
    legacyStatement: z.string().describe('The legacy statement from the session'),
    topEmotions: z.string().describe('Primary emotions from the session'),
    aiSummary: z.string().optional().describe('AI-generated session summary')
  }).describe('Context from the session being reflected upon'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().describe('Previous conversation history for context')
});
export type JournalingAssistantInput = z.infer<typeof JournalingAssistantInputSchema>;

export const JournalingAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to help with journaling and reflection'),
  suggestedPrompts: z.array(z.string()).optional().describe('Follow-up prompts to deepen reflection')
});
export type JournalingAssistantOutput = z.infer<typeof JournalingAssistantOutputSchema>;


