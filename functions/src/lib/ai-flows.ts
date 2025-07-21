/**
 * AI Flows Wrapper for Firebase Functions
 * Provides fallback responses for AI functionality
 */

// Type definitions
export type ClaritySummaryInput = {
  reframedBelief: string;
  legacyStatement: string;
  topEmotions: string;
};

export type ClaritySummaryOutput = {
  insightSummary: string;
};

export type SentimentAnalysisInput = {
  userMessages: string;
};

export type SentimentAnalysisOutput = {
  detectedEmotions: string;
};

export type CognitiveEdgeProtocolInput = {
  userInput: string;
  phase: 'Stabilize & Structure' | 'Listen for Core Frame' | 'Validate Emotion / Reframe' | 'Provide Grounded Support' | 'Reflective Pattern Discovery' | 'Empower & Legacy Statement' | 'Complete';
  sessionHistory?: string;
  attemptCount?: number;
};

export type CognitiveEdgeProtocolOutput = {
  response: string;
  nextPhase: 'Stabilize & Structure' | 'Listen for Core Frame' | 'Validate Emotion / Reframe' | 'Provide Grounded Support' | 'Reflective Pattern Discovery' | 'Empower & Legacy Statement' | 'Complete';
  sessionHistory: string;
};

export type EmotionalToneInput = {
  userMessage: string;
  context?: string;
  previousTone?: string;
};

export type EmotionalToneOutput = {
  primaryEmotion: string;
  intensity: number;
  secondaryEmotion?: string;
  confidence: number;
  progression: 'improving' | 'stable' | 'declining' | 'breakthrough';
  triggerWords: string[];
};

export type SessionReflectionInput = {
  sessionSummary: string;
  actualReframedBelief: string;
  actualLegacyStatement: string;
  topEmotions: string;
  userReflection?: string;
  circumstance: string;
  sessionDate: string;
  previousSessions?: Array<{
    date: string;
    circumstance: string;
    reframedBelief?: string;
    legacyStatement?: string;
    goals?: string[];
    completed?: boolean;
  }>;
};

export type SessionReflectionOutput = {
  conversationalHighlights: string;
  actionableItems: string[];
  emotionalInsights: string;
  progressReflection: string;
  encouragingMessage: string;
  reflectionPrompts: string[];
};

export type JournalingAssistantInput = {
  sessionSummary: string;
  reframedBelief: string;
  legacyStatement: string;
  topEmotions: string;
  circumstance: string;
  userMessage: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
  currentReflection?: string;
  currentGoals?: string[];
  previousSessions?: Array<{
    date: string;
    circumstance: string;
    reframedBelief: string;
    emotions: string;
  }>;
};

export type JournalingAssistantOutput = {
  response: string;
  suggestedQuestions: string[];
  encouragement: string;
  concernsDetected?: string[];
  reflectionPrompt?: string;
  goalSuggestion?: string;
};

// Export wrapper functions with fallback responses
export async function generateClaritySummary(input: ClaritySummaryInput): Promise<ClaritySummaryOutput> {
  return {
    insightSummary: `Based on your session, you've developed a meaningful reframed belief: "${input.reframedBelief}". Your legacy statement "${input.legacyStatement}" reflects your commitment to growth. The emotions you experienced (${input.topEmotions}) show your authentic engagement with the process. This session represents important progress in your personal development journey.`
  };
}

export async function analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
  return {
    detectedEmotions: "contemplative, hopeful, determined"
  };
}

export async function analyzeEmotionalTone(input: EmotionalToneInput): Promise<EmotionalToneOutput> {
  return {
    primaryEmotion: "contemplative",
    intensity: 5,
    confidence: 0.7,
    progression: "stable",
    triggerWords: ["thinking", "processing", "understanding"]
  };
}

export async function generateSessionReflection(input: SessionReflectionInput): Promise<SessionReflectionOutput> {
  return {
    conversationalHighlights: `In this session focused on ${input.circumstance}, you've shown remarkable growth. Your reframed belief "${input.actualReframedBelief}" represents a significant shift from your legacy statement "${input.actualLegacyStatement}".`,
    actionableItems: [
      'Practice your new belief in daily situations',
      'Notice when old patterns emerge',
      'Celebrate small wins along the way',
      'Journal about your progress regularly'
    ],
    emotionalInsights: `The emotions you experienced (${input.topEmotions}) are valid and show your authentic engagement with the growth process.`,
    progressReflection: 'You have shown courage in exploring difficult topics and developing new perspectives.',
    encouragingMessage: 'Your commitment to growth and willingness to challenge old beliefs is truly inspiring. Keep moving forward with confidence.',
    reflectionPrompts: [
      'What surprised you most about this session?',
      'How might you apply your new belief in challenging situations?',
      'What support do you need to maintain this new perspective?',
      'What are you most grateful for in your growth journey?'
    ]
  };
}

export async function generateJournalingAssistance(input: JournalingAssistantInput): Promise<JournalingAssistantOutput> {
  return {
    response: `Thank you for sharing your thoughts about ${input.circumstance}. It sounds like you've gained valuable insights from your session.`,
    suggestedQuestions: [
      "What surprised you most about your session today?",
      "How do you feel about the new perspective you've gained?",
      "What would you like to explore further in your next session?"
    ],
    encouragement: "You've shown great courage in exploring these topics. Your willingness to grow is admirable.",
    reflectionPrompt: `How might you apply "${input.reframedBelief}" in your daily life?`,
    goalSuggestion: "Consider setting a small, daily practice to reinforce your new perspective."
  };
}

export async function processCognitiveEdgeProtocol(input: CognitiveEdgeProtocolInput): Promise<CognitiveEdgeProtocolOutput> {
  const phaseNames = [
    'Stabilize & Structure',
    'Listen for Core Frame',
    'Validate Emotion / Reframe',
    'Provide Grounded Support',
    'Reflective Pattern Discovery',
    'Empower & Legacy Statement',
    'Complete'
  ] as const;
  
  const currentPhaseIndex = phaseNames.indexOf(input.phase);
  const nextPhaseIndex = Math.min(currentPhaseIndex + 1, phaseNames.length - 1);
  const nextPhase = phaseNames[nextPhaseIndex];
  
  return {
    response: `Thank you for your input. Let's continue exploring this together. Can you tell me more about how this situation makes you feel?`,
    nextPhase: nextPhase,
    sessionHistory: input.sessionHistory || ''
  };
}

export function validateAIEnvironment(): void {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY environment variable not found - AI flows will use fallback responses');
  }
}
