// src/ai/flows/clarity-summary-generator.ts

/**
 * @fileOverview Generates a summary of the Cognitive Edge Protocol session, 
 * including the reframed belief and legacy statement.
 *
 * - generateClaritySummary - A function that generates the clarity summary.
 * - ClaritySummaryInput - The input type for the generateClaritySummary function.
 * - ClaritySummaryOutput - The return type for the generateClaritySummary function.
 */

import { ai } from '@/ai/genkit';
import {
  ClaritySummaryInputSchema,
  type ClaritySummaryInput,
  ClaritySummaryOutputSchema,
  type ClaritySummaryOutput,
} from '@/types';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

export async function generateClaritySummary(
  input: ClaritySummaryInput
): Promise<ClaritySummaryOutput> {
  try {
    return await runGenkitFlowWithRetry(
      claritySummaryFlow,
      input,
      'generateClaritySummary',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Clarity Summary Generation');
    logAIFlowExecution('generateClaritySummary', input, undefined, error instanceof Error ? error : new Error(String(error)));
    throw new Error(formattedError);
  }
}

const prompt = ai.definePrompt({
  name: 'claritySummaryPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: ClaritySummaryInputSchema},
  output: {schema: ClaritySummaryOutputSchema},
  prompt: `You are an AI assistant generating insight summaries for Cognitive Edge Protocol™ sessions. These summaries should reflect the transformative journey from crisis to identity-driven empowerment.

  **Session Outcomes:**
  - Reframed Belief: {{{reframedBelief}}}
  - Legacy Statement: {{{legacyStatement}}}
  - Top Emotions: {{{topEmotions}}}

  **Summary Guidelines:**
  1. **Transformation Focus**: Highlight the journey from where they were to where they are now
  2. **Identity Alignment**: Connect their discoveries to their core identity and unique strengths
  3. **Agency Restoration**: Emphasize how they moved from feeling acted upon to being empowered
  4. **Cognitive Edge**: If evident, highlight their unique thinking patterns or mental abilities
  5. **Tangible Value**: Reference any practical assets or insights they can immediately use

  **Tone**: Supportive, empowering, and focused on their unique potential. Write as if celebrating a meaningful breakthrough that connects to their deeper identity.

  Create a concise yet impactful insight summary that captures the essence of their cognitive edge discovery and transformation:`,
});

export const claritySummaryFlow = ai.defineFlow(
  {
    name: 'claritySummaryFlow',
    inputSchema: ClaritySummaryInputSchema,
    outputSchema: ClaritySummaryOutputSchema,
  },
  async (input: ClaritySummaryInput) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI failed to generate a clarity summary. The output was empty.');
      }
      return output;
    } catch (error) {
      logAIFlowExecution('claritySummaryFlow', input, undefined, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
);