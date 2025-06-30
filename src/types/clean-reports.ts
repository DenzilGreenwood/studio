// src/types/clean-reports.ts

// Clean, user-friendly report data structure
export interface CleanSessionReport {
  // Core identifiers
  reportId: string;
  sessionId: string;
  userId: string;
  
  // Session metadata
  sessionDate: Date;
  duration: number; // minutes
  circumstance: string;
  
  // Clean insights (no raw conversation data)
  coreInsights: {
    // Primary breakthrough - clean, concise statement
    primaryBreakthrough: string;
    
    // Reframed belief - simplified, action-oriented
    newPerspective: string;
    
    // Legacy statement - clear, personal
    personalLegacy: string;
    
    // Emotional journey - narrative summary
    emotionalSummary: string;
    
    // Key learning - main takeaway
    keyLearning: string;
  };
  
  // Progress indicators
  progressMetrics: {
    engagementLevel: 'high' | 'medium' | 'low';
    breakthroughPhase: number;
    emotionalShift: 'significant' | 'moderate' | 'mild';
    clarityGained: number; // 1-10 scale
  };
  
  // Actionable outcomes
  actionableOutcomes: {
    immediateSteps: string[];
    practiceAreas: string[];
    reflectionPrompts: string[];
    followUpGoals: string[];
  };
  
  // Clean interaction summary (no raw messages)
  sessionHighlights: {
    keyMoments: Array<{
      moment: string;
      phase: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    
    conversationFlow: {
      openingFocus: string;
      middleExploration: string;
      closingInsights: string;
    };
    
    aiGuidanceStyle: 'supportive' | 'challenging' | 'explorative';
  };
  
  // Report metadata
  generatedAt: Date;
  reportVersion: number;
  completeness: number; // 0-100%
}

// Clean journal data for user reflection
export interface CleanSessionJournal {
  journalId: string;
  reportId: string;
  
  // User's personal space
  personalReflection: {
    mainTakeaway: string;
    emotionalExperience: string;
    personalGrowth: string;
    challengesIdentified: string[];
    strengthsRecognized: string[];
  };
  
  // Goal setting
  futureCommitments: {
    dailyPractices: string[];
    weeklyGoals: string[];
    monthlyTargets: string[];
    longTermVision: string;
  };
  
  // AI assistance (based on clean report data)
  aiGuidance: {
    encouragement: string;
    practicalTips: string[];
    reflectionQuestions: string[];
    progressTracking: string;
    nextStepsRecommendation: string;
  };
  
  // Journal metadata
  createdAt: Date;
  lastUpdated: Date;
  completionLevel: number; // 0-100%
}

// Simplified interaction tracking (separate from reports)
export interface SessionInteractionLog {
  sessionId: string;
  userId: string;
  
  // Minimal interaction tracking
  interactionStats: {
    totalExchanges: number;
    averageResponseLength: number;
    phaseCompletion: number[];
    timePerPhase: number[];
  };
  
  // Key moments only (not full conversation)
  significantExchanges: Array<{
    phase: number;
    userInput: string; // shortened/cleaned
    aiResponse: string; // shortened/cleaned
    importance: 'critical' | 'important' | 'notable';
  }>;
  
  // Quality metrics
  sessionQuality: {
    userEngagement: number; // 1-10
    aiEffectiveness: number; // 1-10
    breakthroughAchieved: boolean;
    sessionFlow: 'smooth' | 'challenging' | 'breakthrough';
  };
}

// PDF-optimized data structure
export interface CleanPDFData {
  // Header information
  header: {
    title: string;
    sessionDate: string;
    duration: string;
    focus: string;
  };
  
  // Executive summary
  summary: {
    headline: string;
    keyAchievement: string;
    emotionalJourney: string;
    mainInsight: string;
  };
  
  // Core content sections
  insights: {
    newPerspective: string;
    personalLegacy: string;
    keyLearning: string;
    actionSteps: string[];
  };
  
  // Personal section
  reflection: {
    userThoughts: string;
    goals: string[];
    commitments: string[];
  };
  
  // AI guidance section
  guidance: {
    encouragement: string;
    practicalTips: string[];
    nextSteps: string[];
  };
  
  // Footer info
  footer: {
    generatedDate: string;
    sessionId: string;
    reportVersion: string;
  };
}
