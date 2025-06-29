// src/app/api/journal-assistance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import type { JournalAssistanceInput } from '@/types/session-reports';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for journal assistance
const JournalAssistanceInputSchema = z.object({
  reportData: z.object({
    circumstance: z.string(),
    insights: z.object({
      primaryReframe: z.string(),
      legacyStatement: z.string(),
      emotionalJourney: z.string(),
      topEmotions: z.string(),
      insightSummary: z.string()
    }),
    interactionSummary: z.object({
      userEngagement: z.enum(['high', 'medium', 'low']),
      aiAssessment: z.string(),
      breakthroughPhase: z.number()
    })
  }),
  userReflection: z.string().optional(),
  previousJournals: z.array(z.any()).optional()
});

// Output schema for journal assistance
const JournalAssistanceOutputSchema = z.object({
  conversationalHighlights: z.string(),
  reflectionPrompts: z.array(z.string()),
  actionableInsights: z.array(z.string()),
  progressTracking: z.string(),
  encouragement: z.string(),
  personalizedQuestions: z.array(z.string()),
  crossSessionInsights: z.string().optional()
});

const journalAssistancePrompt = ai.definePrompt({
  name: 'journalAssistancePrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: JournalAssistanceInputSchema },
  output: { schema: JournalAssistanceOutputSchema },
  prompt: `You are a supportive AI assistant helping someone reflect on their cognitive therapy session through journaling. Your role is to provide gentle guidance, thoughtful prompts, and encouraging insights to help them process their experience.

Session Report Summary:
- Challenge addressed: {{{reportData.circumstance}}}
- Primary reframed belief: {{{reportData.insights.primaryReframe}}}
- Legacy statement: {{{reportData.insights.legacyStatement}}}
- Emotional journey: {{{reportData.insights.emotionalJourney}}}
- Top emotions: {{{reportData.insights.topEmotions}}}
- Session insight: {{{reportData.insights.insightSummary}}}
- User engagement level: {{{reportData.interactionSummary.userEngagement}}}
- Breakthrough phase: {{{reportData.interactionSummary.breakthroughPhase}}}

{{#if userReflection}}
User's Current Reflection:
{{{userReflection}}}
{{/if}}

{{#if previousJournals}}
Previous Journal Context:
{{#each previousJournals}}
- Previous session focused on similar themes of growth and self-awareness
{{/each}}
{{/if}}

Your task is to create supportive journal assistance that includes:

1. **Conversational Highlights** (150-200 words): Write a warm, encouraging summary of their session that celebrates their insights and growth. Focus on the positive aspects of their journey and the courage they showed in the session.

2. **Reflection Prompts** (4-6 questions): Create thoughtful, open-ended questions that help them explore their experience deeper. Make these personal and specific to their session content.

3. **Actionable Insights** (3-5 items): Extract practical, specific actions they can take based on their session. These should be:
   - Concrete and achievable
   - Connected to their reframed belief and legacy statement
   - Focused on applying their insights to daily life

4. **Progress Tracking** (100-150 words): {{#if previousJournals}}Acknowledge their continued growth journey and how this session builds on previous work.{{else}}Celebrate this important step in their personal growth journey and encourage them to continue.{{/if}}

5. **Encouragement** (75-100 words): Write a genuine, heartfelt message that acknowledges their specific challenges and celebrates their progress. Be warm and supportive without being overly effusive.

6. **Personalized Questions** (3-4 questions): Create questions specifically tailored to their circumstance and insights that help them apply their learning to their specific situation.

{{#if previousJournals}}
7. **Cross-Session Insights** (100-125 words): Identify patterns or themes across their sessions and highlight their overall growth trajectory.
{{/if}}

**Tone Guidelines:**
- Warm, supportive, and genuinely encouraging
- Personal and specific to their session content
- Celebratory of their courage and insights
- Practical and actionable
- Emotionally intelligent and validating

**Avoid:**
- Generic advice or platitudes
- Clinical or overly therapeutic language
- Overwhelming them with too many suggestions
- Minimizing their challenges
- Being prescriptive rather than exploratory

Remember: This person just completed meaningful inner work. Honor that courage and help them continue their growth journey through thoughtful reflection.`
});

export const journalAssistanceFlow = ai.defineFlow(
  {
    name: 'journalAssistanceFlow',
    inputSchema: JournalAssistanceInputSchema,
    outputSchema: JournalAssistanceOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await journalAssistancePrompt(input);
      if (!output) {
        throw new Error('AI failed to generate journal assistance');
      }
      return output;
    } catch (error) {
      console.error('Error in journalAssistanceFlow:', error);
      throw error;
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const input: JournalAssistanceInput = await request.json();
    
    // Validate input
    const validatedInput = JournalAssistanceInputSchema.parse(input);
    
    // Generate journal assistance
    const assistance = await journalAssistanceFlow(validatedInput);
    
    return NextResponse.json(assistance);
  } catch (error) {
    console.error('Journal assistance API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate journal assistance' },
      { status: 500 }
    );
  }
}
