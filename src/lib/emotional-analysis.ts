// src/lib/emotional-analysis.ts
export interface EmotionalTone {
  primaryEmotion: string;
  intensity: number;
  secondaryEmotion?: string;
  confidence: number;
  progression: 'improving' | 'stable' | 'declining' | 'breakthrough';
  triggerWords: string[];
}

// Client-side emotional tone analysis using keyword matching
export function analyzeEmotionalToneClient(
  userMessage: string,
  context?: string,
  previousTone?: string
): EmotionalTone {
  const message = userMessage.toLowerCase();
  
  // Define emotion keywords and their intensities
  const emotionPatterns = {
    anxiety: {
      keywords: ['anxious', 'worried', 'nervous', 'scared', 'fearful', 'panic', 'overwhelmed', 'stress'],
      intensity: 7,
      color: 'red'
    },
    depression: {
      keywords: ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'down', 'lost', 'defeated'],
      intensity: 6,
      color: 'blue'
    },
    anger: {
      keywords: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage', 'bitter'],
      intensity: 8,
      color: 'red'
    },
    hope: {
      keywords: ['hope', 'hopeful', 'optimistic', 'positive', 'better', 'improving', 'progress', 'forward'],
      intensity: 7,
      color: 'green'
    },
    clarity: {
      keywords: ['clear', 'understand', 'see', 'realize', 'insight', 'aha', 'breakthrough', 'enlightened'],
      intensity: 8,
      color: 'purple'
    },
    confusion: {
      keywords: ['confused', 'lost', 'unclear', 'dont understand', 'puzzled', 'bewildered'],
      intensity: 5,
      color: 'yellow'
    },
    acceptance: {
      keywords: ['accept', 'peaceful', 'calm', 'serene', 'content', 'balanced', 'centered'],
      intensity: 6,
      color: 'green'
    },
    resistance: {
      keywords: ['resist', 'refuse', 'deny', 'stubborn', 'wont', 'cant', 'impossible'],
      intensity: 6,
      color: 'orange'
    },
    determination: {
      keywords: ['determined', 'motivated', 'committed', 'ready', 'will', 'gonna', 'going to'],
      intensity: 7,
      color: 'blue'
    },
    vulnerability: {
      keywords: ['vulnerable', 'open', 'honest', 'share', 'trust', 'scared to', 'afraid to'],
      intensity: 6,
      color: 'pink'
    }
  };

  // Find matching emotions
  const matchedEmotions: Array<{
    emotion: string;
    intensity: number;
    matches: string[];
    count: number;
  }> = [];

  for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
    const matches = pattern.keywords.filter(keyword => message.includes(keyword));
    if (matches.length > 0) {
      matchedEmotions.push({
        emotion,
        intensity: pattern.intensity,
        matches,
        count: matches.length
      });
    }
  }

  // Determine primary emotion
  let primaryEmotion = 'neutral';
  let intensity = 5;
  let triggerWords: string[] = [];
  let secondaryEmotion: string | undefined;

  if (matchedEmotions.length > 0) {
    // Sort by count of matches and intensity
    matchedEmotions.sort((a, b) => (b.count * b.intensity) - (a.count * a.intensity));
    
    const primary = matchedEmotions[0];
    primaryEmotion = primary.emotion;
    intensity = primary.intensity + (primary.count - 1); // Boost intensity with multiple matches
    triggerWords = primary.matches;
    
    if (matchedEmotions.length > 1) {
      secondaryEmotion = matchedEmotions[1].emotion;
    }
  }

  // Determine progression
  let progression: 'improving' | 'stable' | 'declining' | 'breakthrough' = 'stable';
  
  // Check for breakthrough indicators
  const breakthroughWords = ['breakthrough', 'aha', 'suddenly understand', 'realize', 'see now', 'makes sense'];
  if (breakthroughWords.some(word => message.includes(word))) {
    progression = 'breakthrough';
  }
  // Check for improvement indicators
  else if (['better', 'improving', 'progress', 'clearer', 'easier'].some(word => message.includes(word))) {
    progression = 'improving';
  }
  // Check for declining indicators
  else if (['worse', 'harder', 'more difficult', 'giving up', 'cant do'].some(word => message.includes(word))) {
    progression = 'declining';
  }

  // Calculate confidence based on number of emotional indicators
  const confidence = Math.min(0.9, 0.5 + (matchedEmotions.length * 0.1) + (triggerWords.length * 0.05));

  // Cap intensity at 10
  intensity = Math.min(10, Math.max(1, intensity));

  return {
    primaryEmotion,
    intensity,
    secondaryEmotion,
    confidence,
    progression,
    triggerWords
  };
}

// Helper function to get emotion color for UI
export function getEmotionColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    anxiety: 'text-red-600 bg-red-50 border-red-200',
    depression: 'text-blue-600 bg-blue-50 border-blue-200',
    anger: 'text-red-700 bg-red-100 border-red-300',
    hope: 'text-green-600 bg-green-50 border-green-200',
    clarity: 'text-purple-600 bg-purple-50 border-purple-200',
    confusion: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    acceptance: 'text-green-700 bg-green-100 border-green-300',
    resistance: 'text-orange-600 bg-orange-50 border-orange-200',
    determination: 'text-blue-700 bg-blue-100 border-blue-300',
    vulnerability: 'text-pink-600 bg-pink-50 border-pink-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200'
  };
  
  return colorMap[emotion] || colorMap.neutral;
}
