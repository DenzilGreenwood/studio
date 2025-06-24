
'use server';

/**
 * @fileOverview Generates a summary of the Cognitive Edge Protocol session, 
 * including the reframed belief and legacy statement.
 *
 * - generateClaritySummary - A function that generates the clarity summary.
 * - ClaritySummaryInput - The input type for the generateClaritySummary function.
 * - ClaritySummaryOutput - The return type for the generateClaritySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ClaritySummaryInputSchema = z.object({
  reframedBelief: z
    .string()
    .describe('The reframed belief of the user after the session.'),
  legacyStatement: z
    .string()
    .describe('The legacy statement created by the user during the session.'),
  topEmotions: z
    .string()
    .describe('The top emotions expressed by the user during the session.'),
});
export type ClaritySummaryInput = z.infer<typeof ClaritySummaryInputSchema>;

const ClaritySummaryOutputSchema = z.object({
  insightSummary: z.string().describe('The generated insight summary.'),
});
export type ClaritySummaryOutput = z.infer<typeof ClaritySummaryOutputSchema>;

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

  Reframed Belief: {{{reframedBelief}}}
  Legacy Statement: {{{legacyStatement}}}
  Top Emotions: {{{topEmotions}}}

  Insight Summary:`,
});

const claritySummaryFlow = ai.defineFlow(
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
