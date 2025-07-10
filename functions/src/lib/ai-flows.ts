/**
 * AI Flows Wrapper for Firebase Functions
 * Provides access to Genkit AI flows from the main application
 * Uses dynamic imports to avoid compilation issues
 */

// Type definitions for the AI flows
type ClaritySummaryInput = {
  reframedBelief: string;
  legacyStatement: string;
  topEmotions: string;
};

type ClaritySummaryOutput = {
  insightSummary: string;
};

type SentimentAnalysisInput = {
  userMessages: string;
};

type SentimentAnalysisOutput = {
  detectedEmotions: string;
};

type CognitiveEdgeProtocolInput = {
  userInput: string;
  phase: 'Stabilize & Structure' | 'Listen for Core Frame' | 'Validate Emotion / Reframe' | 'Provide Grounded Support' | 'Reflective Pattern Discovery' | 'Empower & Legacy Statement' | 'Complete';
  sessionHistory?: string;
  attemptCount?: number;
};

type CognitiveEdgeProtocolOutput = {
  response: string;
  nextPhase: 'Stabilize & Structure' | 'Listen for Core Frame' | 'Validate Emotion / Reframe' | 'Provide Grounded Support' | 'Reflective Pattern Discovery' | 'Empower & Legacy Statement' | 'Complete';
  sessionHistory: string;
};

type EmotionalToneInput = {
  userMessage: string;
  context?: string;
  previousTone?: string;
};

type EmotionalToneOutput = {
  primaryEmotion: string;
  intensity: number;
  secondaryEmotion?: string;
  confidence: number;
  progression: 'improving' | 'stable' | 'declining' | 'breakthrough';
  triggerWords: string[];
};

type SessionReflectionInput = {
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

type SessionReflectionOutput = {
  conversationalHighlights: string;
  actionableItems: string[];
  emotionalInsights: string;
  progressReflection: string;
  encouragingMessage: string;
  reflectionPrompts: string[];
};

type JournalingAssistantInput = {
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

type JournalingAssistantOutput = {
  response: string;
  suggestedQuestions: string[];
  encouragement: string;
  concernsDetected?: string[];
  reflectionPrompt?: string;
  goalSuggestion?: string;
};

/**
 * Generate clarity summary using Genkit AI flow
 */
export async function generateClaritySummary(
  input: ClaritySummaryInput
): Promise<ClaritySummaryOutput> {
  try {
    const { generateClaritySummary: genkitFlow } = await import('../../../src/ai/flows/clarity-summary-generator.js');
    return await genkitFlow(input);
  } catch (error) {
    console.error('Error calling clarity summary AI flow:', error);
    
    return {
      insightSummary: `Based on your session, you've developed a meaningful reframed belief: "${input.reframedBelief}". Your legacy statement "${input.legacyStatement}" reflects your commitment to growth. The emotions you experienced (${input.topEmotions}) show your authentic engagement with the process. This session represents important progress in your personal development journey.`
    };
  }
}

/**
 * Analyze sentiment using Genkit AI flow
 */
export async function analyzeSentiment(
  input: SentimentAnalysisInput
): Promise<SentimentAnalysisOutput> {
  try {
    const { analyzeSentiment: genkitFlow } = await import('../../../src/ai/flows/sentiment-analysis-flow.js');
    return await genkitFlow(input);
  } catch (error) {
    console.error('Error calling sentiment analysis AI flow:', error);
    
    return {
      detectedEmotions: "contemplative, hopeful, determined"
    };
  }
}

/**
 * Analyze emotional tone using Genkit AI flow
 */
export async function analyzeEmotionalTone(
  input: EmotionalToneInput
): Promise<EmotionalToneOutput> {
  try {
    const { analyzeEmotionalTone } = await import('../../../src/ai/flows/emotional-tone-analyzer.js');
    return await analyzeEmotionalTone(input);
  } catch (error) {
    console.error('Error calling emotional tone AI flow:', error);
    
    return {
      primaryEmotion: "contemplative",
      intensity: 5,
      confidence: 0.7,
      progression: "stable",
      triggerWords: ["thinking", "processing", "understanding"]
    };
  }
}

/**
 * Generate session reflection using Genkit AI flow
 */
export async function generateSessionReflection(
  input: SessionReflectionInput
): Promise<SessionReflectionOutput> {
  try {
    const { generateSessionReflection: genkitFlow } = await import('../../../src/ai/flows/session-reflection-flow.js');
    return await genkitFlow(input);
  } catch (error) {
    console.error('Error calling session reflection AI flow:', error);
    
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
}

/**
 * Process Cognitive Edge Protocol using Genkit AI flow
 */
export async function processCognitiveEdgeProtocol(
  input: CognitiveEdgeProtocolInput
): Promise<CognitiveEdgeProtocolOutput> {
  try {
    const { cognitiveEdgeProtocol: genkitFlow } = await import('../../../src/ai/flows/cognitive-edge-protocol.js');
    return await genkitFlow(input);
  } catch (error) {
    console.error('Error calling cognitive edge protocol AI flow:', error);
    
    // Provide a basic phase progression fallback
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
}

/**
 * Generate journaling assistance using Genkit AI flow
 */
export async function generateJournalingAssistance(
  input: JournalingAssistantInput
): Promise<JournalingAssistantOutput> {
  try {
    const { generateJournalingResponse: genkitFlow } = await import('../../../src/ai/flows/journaling-assistant-flow.js');
    return await genkitFlow(input);
  } catch (error) {
    console.error('Error calling journaling assistance AI flow:', error);
    
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
}

/**
 * Validate that required environment variables are available
 */
export function validateAIEnvironment(): void {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is required for AI flows');
  }
}
