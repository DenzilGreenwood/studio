// src/types/analytics.ts
import { z } from 'zod';

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
