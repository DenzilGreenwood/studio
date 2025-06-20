// This file is intentionally left mostly blank since the logic
// for the ClaritySummaryReport is handled in src/app/(app)/session-report/[sessionId]/page.tsx.
// This file exists only to conform to project structure requirements.
'use server';

/**
 * @fileOverview A Clarity Summary Generator flow.
 *
 * This file is intentionally left mostly blank since the logic
 * for the ClaritySummaryReport is handled in
 * src/app/(app)/session-report/[sessionId]/page.tsx. This file exists only to
 * conform to project structure requirements.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClaritySummaryInputSchema = z.object({
  sessionId: z.string().describe('The ID of the session to generate a summary for.'),
  userId: z.string().describe('The ID of the user who owns the session.'),
});
export type ClaritySummaryInput = z.infer<typeof ClaritySummaryInputSchema>;

const ClaritySummaryOutputSchema = z.object({
  insightSummary: z.string().describe('The AI-generated insight summary.'),
});
export type ClaritySummaryOutput = z.infer<typeof ClaritySummaryOutputSchema>;

export async function generateClaritySummary(input: ClaritySummaryInput): Promise<ClaritySummaryOutput> {
  return claritySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'claritySummaryPrompt',
  input: {schema: ClaritySummaryInputSchema},
  output: {schema: ClaritySummaryOutputSchema},
  prompt: `Generate a detailed insight summary for session ID {{{sessionId}}} and user ID {{{userId}}}.`,
});

const claritySummaryFlow = ai.defineFlow(
  {
    name: 'claritySummaryFlow',
    inputSchema: ClaritySummaryInputSchema,
    outputSchema: ClaritySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
