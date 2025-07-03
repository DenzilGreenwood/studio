// src/types/session-reports.ts
import type { Timestamp } from 'firebase/firestore';
import type { ProtocolSession } from './index';

/**
 * New data structures for improved session architecture
 * Separates interaction tracking from reporting and journaling
 */

// Core session report - clean data for display and AI analysis
export interface SessionReport {
  reportId: string;                          // Same as sessionId for easy linking
  sessionId: string;                         // Link back to original session
  userId: string;                           // Owner UID
  
  // Session Metadata
  circumstance: string;                     // What was discussed
  startTime: Timestamp | Date;             // When session started
  endTime: Timestamp | Date;               // When session completed
  duration: number;                         // Session length in minutes
  
  // Core Session Insights (Clean, report-focused data)
  insights: {
    primaryReframe: string;                 // User's main reframed belief
    legacyStatement: string;                // User's legacy statement
    keyBreakthroughs: string[];             // Major breakthrough moments
    emotionalJourney: string;               // Narrative of emotional progression
    topEmotions: string;                    // Primary emotions identified
    cognitiveShifts: string[];              // Observable cognitive changes
    insightSummary: string;                 // Overall session summary
  };
  
  // Interaction Summary (Clean data for AI journaling)
  interactionSummary: {
    totalMessages: number;                  // Message count
    userEngagement: 'high' | 'medium' | 'low'; // Engagement assessment
    breakthroughPhase: number;              // Which phase had breakthroughs
    aiAssessment: string;                   // AI's overall session assessment
    keyQuestions: Array<{                   // Important Q&A pairs
      question: string;
      answer: string;
      phase: number;
      phaseName: string;
      importance: 'high' | 'medium' | 'low';
    }>;
    phaseProgression: Array<{               // How user progressed through phases
      phase: number;
      phaseName: string;
      timeSpent: number;                    // Minutes in this phase
      messageCount: number;                 // Messages in this phase
      breakthroughs: boolean;               // Had breakthroughs in this phase
    }>;
  };
  
  // Report Generation
  generatedAt: Timestamp | Date;           // When report was created
  reportVersion: number;                   // For future report improvements
  generationSource: 'auto' | 'manual';    // How report was created
  
  // Status Flags
  isComplete: boolean;                     // Report fully generated
  hasJournal: boolean;                     // User has added journal content
  hasFeedback: boolean;                    // User has submitted feedback
  
  // Links to related data
  feedbackId?: string;                     // Link to feedback document
  downloadUrl?: string;                    // PDF download link if generated
}

// Enhanced journaling with AI assistance
export interface SessionJournal {
  journalId: string;                       // Same as sessionId
  reportId: string;                        // Link to session report
  sessionId: string;                       // Link to original session
  userId: string;                          // Owner UID
  
  // User Reflection
  userReflection: string;                  // User's personal reflection
  reflectionUpdatedAt: Timestamp | Date;  // Last update
  reflectionWordCount: number;             // Track engagement
  
  // Goals & Actions
  goals: Goal[];                           // User-created goals
  completedGoals: number;                  // Count of completed goals
  goalsUpdatedAt: Timestamp | Date;        // Last goal update
  
  // Quick reflections from session cards
  quickReflections?: Array<{
    text: string;
    createdAt: Timestamp | Date;
    sessionDate: string;
  }>;
  
  // AI Journal Assistance (generated from clean report data)
  aiJournalSupport?: {
    conversationalHighlights: string;      // AI summary for journaling
    reflectionPrompts: string[];           // Questions to help user reflect
    actionableInsights: string[];          // Practical takeaways
    progressTracking: string;              // How this relates to past sessions
    encouragement: string;                 // Supportive message
    personalizedQuestions: string[];       // Custom questions based on session
    crossSessionInsights?: string;         // Insights from multiple sessions
    generatedAt: Timestamp | Date;        // When AI support was generated
    generationContext: {                   // What data was used
      previousSessionCount: number;
      reportVersion: number;
      personalityProfile?: string;
    };
  };
  
  // Journal Metadata
  createdAt: Timestamp | Date;            // When journal was first created
  lastAccessedAt: Timestamp | Date;       // When user last opened journal
  journalCompleteness: number;            // 0-100% how complete the journal is
  timeSpentJournaling: number;            // Total minutes spent journaling
  
  // Privacy & Sharing
  isPrivate: boolean;                     // User preference for privacy
  allowAILearning: boolean;               // Allow AI to learn from this journal
}

// Simplified session for pure interaction tracking
export interface ProtocolSessionInteraction {
  sessionId: string;                       // Unique identifier
  userId: string;                          // Owner UID
  circumstance: string;                    // Initial challenge
  
  // Progress Tracking
  currentPhase: number;                    // Current phase (1-6)
  completedPhases: number;                 // Completed phases (0-6)
  startTime: Timestamp | Date;            // Session start
  
  // Real-time State
  isActive: boolean;                       // Is session currently in progress
  lastActivity: Timestamp | Date;         // Last message timestamp
  lastMessageId?: string;                  // For resuming conversations
  
  // Completion Status
  isCompleted: boolean;                    // Has reached phase 6
  completedAt?: Timestamp | Date;         // When completed
  
  // Generated Content References (lightweight)
  hasReport: boolean;                      // Report has been generated
  hasJournal: boolean;                     // Journal has been created
  reportGeneratedAt?: Timestamp | Date;   // When report was created
  
  // Soft Delete (unchanged)
  isDeleted?: boolean;
  deletedAt?: Timestamp | Date;
  deletedBy?: string;
  
  // Legacy Support (for migration)
  legacyData?: {
    hadSummary: boolean;                   // Original session had summary
    migratedAt: Timestamp | Date;         // When migrated to new structure
    migrationVersion: number;              // Migration version
  };
}

// Supporting types
export interface Goal {
  id: string;                             // Unique goal identifier
  text: string;                           // Goal description
  completed: boolean;                     // Achievement status
  createdAt: Timestamp | Date;           // When created
  completedAt?: Timestamp | Date;        // When completed
  priority: 'high' | 'medium' | 'low';   // User-set priority
  category?: string;                      // Optional categorization
}

// For AI assistance in generating reports
export interface ReportGenerationInput {
  sessionId: string;
  messages: Array<{
    sender: 'user' | 'ai';
    text: string;
    timestamp: Timestamp | Date;
    phaseName: string;
  }>;
  circumstance: string;
  sessionDuration: number;
  userEngagement?: 'high' | 'medium' | 'low';
  previousReports?: SessionReport[];      // For context
}

// For AI assistance in journaling
export interface JournalAssistanceInput {
  reportData: SessionReport;
  userReflection?: string;
  existingGoals?: Goal[];
  previousJournals?: SessionJournal[];    // For progress tracking
  userPreferences?: {
    reflectionStyle: 'detailed' | 'concise' | 'guided';
    focusAreas: string[];
    privacyLevel: 'open' | 'cautious' | 'private';
  };
}

// Migration utilities
export interface SessionMigrationData {
  originalSession: ProtocolSession;       // Original ProtocolSession
  targetReport: Partial<SessionReport>;
  targetJournal: Partial<SessionJournal>;
  targetSession: Partial<ProtocolSessionInteraction>;
  migrationErrors?: string[];
}
