
'use server';

/**
 * @fileOverview Generates actionable goals based on a user's session summary and reflection.
 *
 * - generateGoals - A function that generates goal suggestions.
 * - GoalGeneratorInput - The input type for the generateGoals function.
 * - GoalGeneratorOutput - The return type for the generateGoals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GoalGeneratorInputSchema = z.object({
  sessionSummary: z
    .string()
    .describe('The AI-generated summary of the cognitive session.'),
  userReflection: z
    .string()
    .describe(
      "The user's personal reflection or journal entry about the session."
    ),
});
export type GoalGeneratorInput = z.infer<typeof GoalGeneratorInputSchema>;

const GoalGeneratorOutputSchema = z.object({
  suggestedGoals: z
    .array(z.string())
    .describe(
      'An array of 3-5 actionable and meaningful goal suggestions based on the input.'
    ),
});
export type GoalGeneratorOutput = z.infer<typeof GoalGeneratorOutputSchema>;

export async function generateGoals(
  input: GoalGeneratorInput
): Promise<GoalGeneratorOutput> {
  return goalGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'goalGeneratorPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GoalGeneratorInputSchema},
  output: {schema: GoalGeneratorOutputSchema},
  prompt: `You are an empathetic and encouraging AI life coach. Your purpose is to help a user define actionable, meaningful goals after a cognitive therapy session.

You will be given the summary of their session and their personal reflection on it.
Based on this information, provide 3 to 5 concise, actionable, and encouraging goal suggestions. Frame them as positive actions. For example, instead of "Stop procrastinating," suggest "Dedicate 15 minutes each morning to my main project."

Session Summary:
{{{sessionSummary}}}

User's Reflection:
{{{userReflection}}}

Analyze both the summary and reflection to identify key themes, desired changes, and stated intentions. Then, generate your suggested goals.
`,
});

export const goalGeneratorFlow = ai.defineFlow(
  {
    name: 'goalGeneratorFlow',
    inputSchema: GoalGeneratorInputSchema,
    outputSchema: GoalGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate goal suggestions.');
    }
    return output;
  }
);
