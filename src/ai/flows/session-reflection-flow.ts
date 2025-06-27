// src/ai/flows/session-reflection-flow.ts
'use server';

/**
 * @fileOverview AI flow for generating conversational session highlights and reflection support
 * 
 * This flow takes session data and creates:
 * - Conversational highlights of the session
 * - Actionable items extracted from the conversation
 * - Progress reflection and emotional support
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

// Input schema for session reflection
export const SessionReflectionInputSchema = z.object({
  sessionSummary: z.string().describe('The AI-generated insight summary from the session'),
  actualReframedBelief: z.string().describe('The reframed belief the user developed'),
  actualLegacyStatement: z.string().describe('The legacy statement the user created'),
  topEmotions: z.string().describe('The main emotions expressed during the session'),
  userReflection: z.string().optional().describe('Any personal reflection the user has written'),
  circumstance: z.string().describe('The challenge or situation the user was addressing'),
  sessionDate: z.string().describe('When the session took place'),
  previousSessions: z.array(z.object({
    date: z.string(),
    circumstance: z.string(),
    reframedBelief: z.string().optional(),
    legacyStatement: z.string().optional(),
    goals: z.array(z.string()).optional(),
    completed: z.boolean().optional()
  })).optional().describe('Previous sessions for context and progress tracking')
});

export type SessionReflectionInput = z.infer<typeof SessionReflectionInputSchema>;

// Output schema for session reflection
export const SessionReflectionOutputSchema = z.object({
  conversationalHighlights: z.string().describe('A warm, conversational summary of the session highlights'),
  actionableItems: z.array(z.string()).describe('3-5 specific, actionable items the user can work on'),
  emotionalInsights: z.string().describe('Supportive insights about the user\'s emotional journey'),
  progressReflection: z.string().describe('Reflection on progress if previous sessions exist'),
  encouragingMessage: z.string().describe('A personalized, encouraging message for the user'),
  reflectionPrompts: z.array(z.string()).describe('3-4 thoughtful questions to help the user reflect further')
});

export type SessionReflectionOutput = z.infer<typeof SessionReflectionOutputSchema>;

// Main function to generate session reflection
export async function generateSessionReflection(input: SessionReflectionInput): Promise<SessionReflectionOutput> {
  try {
    return await runGenkitFlowWithRetry(
      sessionReflectionFlow,
      input,
      'sessionReflection',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Session Reflection');
    logAIFlowExecution('sessionReflection', input, undefined, error instanceof Error ? error : new Error(String(error)));
    throw new Error(formattedError);
  }
}

const sessionReflectionPrompt = ai.definePrompt({
  name: 'sessionReflectionPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: SessionReflectionInputSchema },
  output: { schema: SessionReflectionOutputSchema },
  prompt: `You are a warm, supportive AI companion helping someone reflect on their cognitive therapy session. Your role is to provide emotional support, celebrate progress, and help them see their growth journey clearly.

Session Details:
- Date: {{{sessionDate}}}
- Challenge addressed: {{{circumstance}}}
- Reframed belief: {{{actualReframedBelief}}}
- Legacy statement: {{{actualLegacyStatement}}}
- Main emotions: {{{topEmotions}}}
- AI insights: {{{sessionSummary}}}
- User's personal reflection: {{{userReflection}}}

{{#if previousSessions}}
Previous Sessions Context:
{{#each previousSessions}}
- {{date}}: {{circumstance}} (Belief: {{reframedBelief}}, Legacy: {{legacyStatement}})
{{/each}}
{{/if}}

Your task is to create a supportive, encouraging reflection that helps the user:

1. **Conversational Highlights**: Write a warm, friend-like summary of their session. Use "you" and speak directly to them. Highlight their insights, breakthroughs, and growth moments. Make it feel like a caring friend reflecting back what they shared.

2. **Actionable Items**: Extract 3-5 specific, practical actions they can take based on their session. These should be:
   - Concrete and achievable
   - Connected to their reframed belief and legacy statement
   - Supportive of their emotional growth
   - Varied (some quick wins, some longer-term commitments)

3. **Emotional Insights**: Acknowledge their emotional journey with empathy. Validate their feelings and help them see the strength they showed in working through their challenges.

4. **Progress Reflection**: {{#if previousSessions}}Compare this session to previous ones. Celebrate growth, acknowledge patterns, and highlight their evolving self-awareness.{{else}}Since this is early in their journey, focus on the courage it took to start and the insights they've already gained.{{/if}}

5. **Encouraging Message**: Write a personalized, heartfelt message that acknowledges their specific situation and growth. Be genuine and supportive without being overly effusive.

6. **Reflection Prompts**: Create 3-4 thoughtful questions that invite deeper self-reflection. These should help them:
   - Connect their insights to daily life
   - Explore how they want to apply their learning
   - Consider their support systems and resources
   - Think about their future growth

**Tone Guidelines:**
- Warm, supportive, and genuine (like a caring friend or mentor)
- Celebratory of their courage and insights
- Practical and grounded
- Emotionally intelligent and validating
- Hopeful and forward-looking

**Avoid:**
- Clinical or overly therapeutic language
- Minimizing their challenges
- Generic platitudes
- Overwhelming them with too much at once
- Being prescriptive rather than supportive

Remember: This person just completed a meaningful session of self-work. They deserve recognition for that courage and support for their continued growth.`
});

export const sessionReflectionFlow = ai.defineFlow(
  {
    name: 'sessionReflectionFlow',
    inputSchema: SessionReflectionInputSchema,
    outputSchema: SessionReflectionOutputSchema,
  },
  async input => {
    try {
      const { output } = await sessionReflectionPrompt(input);
      if (!output) {
        throw new Error('AI failed to generate session reflection. The output was empty.');
      }
      return output;
    } catch (error) {
      console.error('Error in sessionReflectionFlow:', error);
      throw error;
    }
  }
);
