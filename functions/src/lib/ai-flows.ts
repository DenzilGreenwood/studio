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
  discoveredMentalModel?: string;
  cognitiveEdgeIdentified?: boolean;
  currentAIRole?: 'strategist' | 'supporter' | 'facilitator' | 'deep_listener' | 'empowerment_coach';
};

export type CognitiveEdgeProtocolOutput = {
  response: string;
  nextPhase: 'Stabilize & Structure' | 'Listen for Core Frame' | 'Validate Emotion / Reframe' | 'Provide Grounded Support' | 'Reflective Pattern Discovery' | 'Empower & Legacy Statement' | 'Complete';
  sessionHistory: string;
  discoveredMentalModel?: string;
  cognitiveEdgeInsight?: string;
  aiRoleTransition?: {
    newRole: 'strategist' | 'supporter' | 'facilitator' | 'deep_listener' | 'empowerment_coach';
    reason: string;
  };
  keyStatement?: {
    type: 'reframed_belief' | 'legacy_statement' | 'mental_model' | 'cognitive_edge';
    statement: string;
    significance: string;
  };
  tangibleAsset?: string;
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

export async function analyzeSentiment(_input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
  return {
    detectedEmotions: "contemplative, hopeful, determined"
  };
}

export async function analyzeEmotionalTone(_input: EmotionalToneInput): Promise<EmotionalToneOutput> {
  return {
    primaryEmotion: "contemplative",
    intensity: 5,
    confidence: 0.7,
    progression: "stable",
    triggerWords: ["thinking", "processing", "understanding"]
  };
}

export async function generateSessionReflection(input: SessionReflectionInput): Promise<SessionReflectionOutput> {
  const hasProgressHistory = input.previousSessions && input.previousSessions.length > 0;
  
  return {
    conversationalHighlights: `In your session focused on "${input.circumstance}", you demonstrated remarkable courage and insight. Your journey from feeling challenged to developing the reframed belief "${input.actualReframedBelief}" shows the power of your unique cognitive abilities. Your legacy statement "${input.actualLegacyStatement}" reflects not just growth, but a profound connection to your authentic self and future vision.`,
    
    actionableItems: [
      'Practice embodying your new belief in daily situations, especially when facing similar challenges',
      'Create a daily reminder or ritual that reinforces your legacy statement',
      'Notice and celebrate moments when you naturally use the cognitive strengths you discovered',
      'Identify one person who could benefit from your unique perspective and consider how to share it',
      'Design a simple system to track how your new mindset influences your decisions'
    ],
    
    emotionalInsights: `The emotions you experienced - ${input.topEmotions} - represent authentic engagement with your growth process. These feelings are not obstacles but indicators of deep, meaningful change happening within you. Your willingness to sit with discomfort while seeking new perspectives shows emotional maturity and courage.`,
    
    progressReflection: hasProgressHistory ? 
      `Looking at your journey across multiple sessions, there's a clear pattern of increasing self-awareness and strategic thinking. Each session builds on the last, showing your natural ability to integrate insights and apply them meaningfully. This consistency reveals a core strength in how you approach personal development.` :
      `Starting this work takes tremendous courage. The insights you've gained in this single session demonstrate your natural capacity for deep thinking and authentic self-reflection. This is just the beginning of what's possible when you trust your unique cognitive abilities.`,
    
    encouragingMessage: `Your combination of analytical thinking, emotional intelligence, and commitment to growth creates a powerful foundation for transformation. The way you've approached this session - with openness, honesty, and a willingness to challenge old patterns - shows the kind of character that creates lasting change. Trust in the wisdom you've uncovered about yourself.`,
    
    reflectionPrompts: [
      'What surprised you most about your own thinking patterns during this session?',
      'How does your reframed belief align with your deepest values and aspirations?',
      'In what situations will your legacy statement be most challenging to live out, and how will you prepare for those moments?',
      'What unique perspective or insight do you bring that others might benefit from hearing?',
      'How do you want to honor the growth you experienced in this session over the next week?'
    ]
  };
}

export async function generateJournalingAssistance(input: JournalingAssistantInput): Promise<JournalingAssistantOutput> {
  const isReflectiveQuestion = input.userMessage.toLowerCase().includes('how') || 
                              input.userMessage.toLowerCase().includes('why') ||
                              input.userMessage.toLowerCase().includes('what');
  
  const isIdentityExploration = input.userMessage.toLowerCase().includes('i am') ||
                               input.userMessage.toLowerCase().includes('my way') ||
                               input.userMessage.toLowerCase().includes('i think');

  let response = '';
  let encouragement = '';
  
  if (isIdentityExploration) {
    response = `I notice you're exploring something important about your identity and way of being. This kind of self-recognition is exactly how we discover our cognitive edge - those unique thinking patterns that make you who you are. Your insight about ${input.circumstance} seems to be revealing something deeper about your authentic self.`;
    encouragement = `This level of self-awareness is a gift. Trust these insights about who you are - they're pointing toward your unique strengths and perspective.`;
  } else if (isReflectiveQuestion) {
    response = `Your question shows the kind of thoughtful reflection that leads to real growth. Given your session focus on ${input.circumstance} and your reframed belief "${input.reframedBelief}", this seems like an important thread to explore further.`;
    encouragement = `The fact that you're asking these deeper questions shows your natural wisdom and commitment to understanding yourself fully.`;
  } else {
    response = `Thank you for sharing these thoughts about ${input.circumstance}. I can see how your session insights - particularly around "${input.reframedBelief}" - are still working in your mind. This kind of continued processing is how transformation really takes root.`;
    encouragement = `Your willingness to keep exploring and questioning shows the kind of intellectual courage that creates lasting change.`;
  }

  return {
    response,
    suggestedQuestions: [
      "How does this new understanding change how you see yourself?",
      "What unique perspective do you bring to this type of situation?",
      "In what ways does your reframed belief feel like 'coming home' to who you really are?",
      "How might your insights help others facing similar challenges?"
    ],
    encouragement,
    reflectionPrompt: `Given your legacy statement "${input.legacyStatement}", how does this exploration connect to the future you're creating?`,
    goalSuggestion: "Consider identifying one specific way to practice living out your reframed belief this week."
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
  
  // Enhanced fallback responses based on Cognitive Edge Protocol principles
  const phaseResponses = {
    'Stabilize & Structure': `I hear that you're facing ${input.userInput.includes('overwhelm') ? 'overwhelming circumstances' : 'significant challenges'}. Let's start by structuring this situation so we can understand what you're truly dealing with. Can you help me understand what aspect of this situation feels most pressing to you right now?`,
    
    'Listen for Core Frame': `Thank you for sharing that context. I'm listening for how you naturally think about this situation. When you think about this challenge, what timeframe or perspective comes to mind? How do you typically measure progress or success in your life?`,
    
    'Validate Emotion / Reframe': `I can sense the weight of what you're experiencing, and those feelings are completely valid. Based on what you've shared, I'm curious - if you could step back and see this situation through the lens of your unique strengths and perspective, how might you reframe this challenge as an opportunity for growth or discovery?`,
    
    'Provide Grounded Support': `Let's focus on some practical steps that align with your new perspective. What's one small, concrete action you could take in the next 24 hours that would honor both your reframed belief and move you forward?`,
    
    'Reflective Pattern Discovery': `You've shown remarkable insight in how you've approached this challenge. I'm curious about your thinking patterns - what do you notice about how your mind naturally processes complex situations? What cognitive strengths do you recognize in yourself?`,
    
    'Empower & Legacy Statement': `Based on everything we've explored together - your reframed perspective, your unique thinking patterns, and your growth through this session - how do you want this insight to shape your future actions? What legacy do you want to build from this point forward?`,
    
    'Complete': `You've demonstrated remarkable courage and wisdom in this session. Your journey from where you started to where you are now shows the power of your unique cognitive abilities. Trust in the insights you've gained and the strength you've discovered within yourself.`
  };
  
  const response = phaseResponses[input.phase] || `Let's continue exploring this together. What feels most important to address next?`;
  
  return {
    response,
    nextPhase: nextPhase,
    sessionHistory: input.sessionHistory || '',
    discoveredMentalModel: input.userInput.includes('days') || input.userInput.includes('time') || input.userInput.includes('age') ? 
      'User may be operating from a time-conscious mental model' : undefined,
    cognitiveEdgeInsight: input.phase === 'Reflective Pattern Discovery' ? 
      'User shows evidence of systems thinking and self-reflection capabilities' : undefined,
    aiRoleTransition: currentPhaseIndex <= 1 ? 
      { newRole: 'strategist' as const, reason: 'Providing structure and framework' } :
      currentPhaseIndex === 3 ? 
      { newRole: 'supporter' as const, reason: 'User needs emotional support and grounding' } :
      currentPhaseIndex >= 4 ?
      { newRole: 'facilitator' as const, reason: 'Guiding self-discovery and empowerment' } : undefined
  };
}

export function validateAIEnvironment(): void {
  if (!process.env.GOOGLE_API_KEY) {
    // GOOGLE_API_KEY environment variable not found - AI flows will use fallback responses
  }
}
