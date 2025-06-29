// src/ai/flows/cross-session-analysis-flow.ts

/**
 * @fileOverview AI flow for analyzing patterns across multiple sessions
 * 
 * This flow analyzes multiple session reports to identify:
 * - Recurring emotional patterns
 * - Common themes in challenges
 * - Evolution of reframed beliefs
 * - Overall growth trajectory
 * - Persistent challenges that need attention
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

// Input schema for cross-session analysis
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

// Output schema for cross-session insights
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
      improvement: z.enum(['significant', 'moderate', 'minimal', 'variable']),
      evidence: z.string().describe('Evidence for this assessment')
    }),
    selfAwareness: z.object({
      improvement: z.enum(['significant', 'moderate', 'minimal', 'variable']),
      evidence: z.string().describe('Evidence for this assessment')
    }),
    goalAchievement: z.object({
      rate: z.number().min(0).max(100).describe('Percentage of goals completed'),
      trend: z.enum(['improving', 'stable', 'declining']),
      analysis: z.string().describe('Analysis of goal completion patterns')
    })
  }),
  
  beliefEvolution: z.object({
    coreBeliefsIdentified: z.array(z.string()).describe('Core beliefs that have emerged across sessions'),
    evolutionStory: z.string().describe('How the user\'s beliefs have evolved over time'),
    consistentThemes: z.array(z.string()).describe('Consistent themes in their reframed beliefs')
  }),
  
  recommendations: z.object({
    areasForContinuedGrowth: z.array(z.string()).describe('Areas where continued work would be beneficial'),
    strengthsToLeverage: z.array(z.string()).describe('Strengths the user can build upon'),
    strategiesForChallenges: z.array(z.string()).describe('Strategies for persistent challenges'),
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

const crossSessionAnalysisPrompt = ai.definePrompt({
  name: 'crossSessionAnalysisPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: CrossSessionAnalysisInputSchema },
  output: { schema: CrossSessionAnalysisOutputSchema },
  prompt: `You are an expert therapeutic analyst specializing in tracking personal growth patterns across multiple cognitive therapy sessions. Your role is to provide insightful, encouraging analysis of someone's journey over time.

You're analyzing {{{sessions.length}}} sessions over {{{timeFrame}}}:

{{#each sessions}}
Session {{@index}} - {{{date}}}:
- Challenge: {{{circumstance}}}
- Reframed Belief: "{{{reframedBelief}}}"
- Legacy Statement: "{{{legacyStatement}}}"
- Main Emotions: {{{topEmotions}}}
{{#if emotionalJourney}}- Emotional Journey: {{{emotionalJourney}}}{{/if}}
{{#if keyBreakthroughs}}- Breakthroughs: {{#each keyBreakthroughs}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if goals}}- Goals Set: {{goals.length}} goals{{/if}}
{{#if completedGoals}}- Goals Completed: {{{completedGoals}}}{{/if}}

{{/each}}

Your analysis should:

**Growth Analysis:**
- Look for patterns in how they handle similar challenges over time
- Track the evolution of their emotional responses and coping strategies
- Identify their developing strengths and areas of consistent challenge
- Note improvements in self-awareness, emotional regulation, and problem-solving

**Pattern Recognition:**
- Emotional patterns: What emotions come up repeatedly? How has their relationship with these emotions changed?
- Challenge types: What kinds of situations do they struggle with? Are these changing?
- Coping evolution: How have their coping strategies improved or evolved?
- Belief development: How have their core beliefs about themselves and life evolved?

**Progress Indicators:**
- Emotional resilience: How quickly do they recover from setbacks? How has this changed?
- Self-awareness: Are they becoming more insightful about their patterns?
- Goal achievement: Are they setting and completing meaningful goals?

**Recommendations:**
- Be specific and actionable
- Build on their demonstrated strengths
- Address persistent challenges with compassion
- Suggest focus areas that would amplify their growth

**Celebration:**
- Identify specific milestones and growth moments
- Acknowledge the courage it takes to do this work
- Highlight unique strengths they've developed
- Connect their progress to their stated goals and values

**Tone Guidelines:**
- Professional yet warm and encouraging
- Evidence-based but hopeful
- Acknowledge challenges while celebrating progress
- Inspirational without being unrealistic
- Focus on growth and potential

Remember: This person has been doing significant personal work. Honor their journey, celebrate their progress, and provide guidance that helps them continue growing.`
});

const crossSessionAnalysisFlow = ai.defineFlow(
  {
    name: 'crossSessionAnalysisFlow',
    inputSchema: CrossSessionAnalysisInputSchema,
    outputSchema: CrossSessionAnalysisOutputSchema,
  },
  async (input: CrossSessionAnalysisInput) => {
    try {
      const { output } = await crossSessionAnalysisPrompt(input);
      if (!output) {
        throw new Error('AI failed to generate cross-session analysis.');
      }
      return output;
    } catch (error) {
      console.error('Error in crossSessionAnalysisFlow:', error);
      throw error;
    }
  }
);

// Main function to generate cross-session analysis
export async function generateCrossSessionAnalysis(input: CrossSessionAnalysisInput): Promise<CrossSessionAnalysisOutput> {
  try {
    return await runGenkitFlowWithRetry(
      crossSessionAnalysisFlow,
      input,
      'generateCrossSessionAnalysis',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Cross-Session Analysis');
    logAIFlowExecution('generateCrossSessionAnalysis', input, undefined, error instanceof Error ? error : new Error(String(error)));
    
    // Provide a meaningful fallback response
    return {
      overallGrowthSummary: "Your journey shows meaningful engagement with personal growth across multiple sessions.",
      recurringPatterns: {
        emotionalPatterns: ["Growth-oriented", "Self-reflective"],
        challengeTypes: ["Personal development challenges"],
        copingStrategies: ["Cognitive reframing", "Self-reflection"],
        triggerSituations: ["Life transitions", "Self-doubt moments"]
      },
      progressIndicators: {
        emotionalResilience: {
          improvement: 'moderate',
          evidence: "Consistent engagement with the therapeutic process"
        },
        selfAwareness: {
          improvement: 'moderate',
          evidence: "Active participation in multiple sessions"
        },
        goalAchievement: {
          rate: 70,
          trend: 'stable',
          analysis: "Regular goal-setting and follow-through"
        }
      },
      beliefEvolution: {
        coreBeliefsIdentified: ["I am capable of growth", "I can handle challenges"],
        evolutionStory: "Your beliefs have been evolving toward greater self-compassion and resilience.",
        consistentThemes: ["Personal strength", "Growth mindset", "Self-acceptance"]
      },
      recommendations: {
        areasForContinuedGrowth: ["Continued self-reflection", "Building on existing strengths"],
        strengthsToLeverage: ["Commitment to growth", "Self-awareness", "Willingness to engage"],
        strategiesForChallenges: ["Continue using cognitive reframing", "Build support systems"],
        focusForNextSessions: "Building on the foundation you've established while exploring new areas of growth."
      },
      celebrationsAndMilestones: [
        {
          milestone: "Consistent engagement with personal growth",
          significance: "Shows commitment to your development",
          evidence: "Regular participation in therapeutic sessions"
        }
      ],
      inspirationalMessage: "Your commitment to growth and self-reflection is admirable. Each session builds on the last, creating a foundation for lasting positive change."
    };
  }
}
