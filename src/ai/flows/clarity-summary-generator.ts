// src/ai/flows/clarity-summary-generator.ts
'use server';

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

export async function generateClaritySummary(
  input: ClaritySummaryInput
): Promise<ClaritySummaryOutput> {
  return claritySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'claritySummaryPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: ClaritySummaryInputSchema},
  output: {schema: ClaritySummaryOutputSchema},
  prompt: `You are an AI assistant designed to generate insightful summaries of Cognitive Edge Protocol sessions.

  Based on the user's reframed belief, legacy statement, and top emotions, create a concise and impactful insight summary.
  The summary should be written in a supportive and encouraging tone, and it should highlight the user's growth and progress during the session.

  Reframed Belief: {{{reframedBelief}}}
  Legacy Statement: {{{legacyStatement}}}
  Top Emotions: {{{topEmotions}}}

  Insight Summary:`,
});

export const claritySummaryFlow = ai.defineFlow(
  {
    name: 'claritySummaryFlow',
    inputSchema: ClaritySummaryInputSchema,
    outputSchema: ClaritySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a clarity summary. The output was empty.');
    }
    return output;
  }
);
