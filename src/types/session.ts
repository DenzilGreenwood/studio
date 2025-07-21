// src/types/session.ts
import type { Timestamp } from 'firebase/firestore';

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
  statementType?: 'reframed_belief' | 'legacy_statement' | 'insight' | 'breakthrough' | 'mental_model' | 'cognitive_edge';
  aiRole?: 'strategist' | 'supporter' | 'facilitator' | 'deep_listener' | 'empowerment_coach';
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
  
  // Cognitive Edge Protocol specific tracking
  userMentalModel?: {
    discovered: string; // e.g., "10,950 days left" frame
    phase: string; // When discovered
    significance: string; // Why this matters to their identity
  };
  
  cognitiveEdge?: {
    identified: boolean;
    description: string; // Their unique thinking pattern
    strengths: string[]; // Key cognitive abilities
    valueProposition: string; // How it provides value
    discoveredInPhase: string;
  };
  
  aiRoleTransitions?: Array<{
    fromRole: 'strategist' | 'supporter' | 'facilitator' | 'deep_listener' | 'empowerment_coach';
    toRole: 'strategist' | 'supporter' | 'facilitator' | 'deep_listener' | 'empowerment_coach';
    trigger: string; // What caused the transition
    phase: string;
    timestamp: Timestamp | Date;
  }>;
  
  // Enhanced emotional progression tracking
  emotionalProgression?: EmotionalProgression[];
  keyStatements?: {
    reframedBelief?: {
      statement: string;
      phaseIndex: number;
      timestamp: Timestamp | Date;
      confidence: number;
      mentalModelAlignment: string; // How it aligns with their discovered mental model
    };
    legacyStatement?: {
      statement: string;
      phaseIndex: number;
      timestamp: Timestamp | Date;
      confidence: number;
      actionableAssets?: string[]; // Tangible deliverables created
    };
    insights?: Array<{
      insight: string;
      phaseIndex: number;
      timestamp: Timestamp | Date;
      emotionalContext: string;
      type: 'mental_model' | 'cognitive_edge' | 'breakthrough' | 'pattern_recognition';
    }>;
  };
  
  summary?: {
    insightSummary: string;
    actualReframedBelief: string;
    actualLegacyStatement: string;
    topEmotions: string;
    emotionalJourney?: string; // New: narrative of emotional progression
    cognitiveEdgeDiscovery?: string; // Summary of their unique cognitive abilities
    tangibleAssets?: string[]; // Assets co-created during session
    agencyRestoration?: string; // How their sense of control was restored
    identityAlignment?: string; // How session aligned with their core identity
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
    cognitiveEdgeActivation?: string; // How to activate their discovered strengths
    identityBasedActions?: string[]; // Actions aligned with their identity
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
