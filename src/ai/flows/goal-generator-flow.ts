/**
 * @fileOverview Generates actionable goals based on a user's session summary and reflection.
 *
 * - generateGoals - A function that generates goal suggestions.
 * - GoalGeneratorInput - The input type for the generateGoals function.
 * - GoalGeneratorOutput - The return type for the generateGoals function.
 */

import { ai } from '@/ai/genkit';
import {
  GoalGeneratorInputSchema,
  type GoalGeneratorInput,
  GoalGeneratorOutputSchema,
  type GoalGeneratorOutput,
} from '@/types';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

export async function generateGoals(
  input: GoalGeneratorInput
): Promise<GoalGeneratorOutput> {
  try {
    return await runGenkitFlowWithRetry(
      goalGeneratorFlow,
      input,
      'generateGoals',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Goal Generation');
    logAIFlowExecution('generateGoals', input, undefined, error instanceof Error ? error : new Error(String(error)));
    throw new Error(formattedError);
  }
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
  async (input: GoalGeneratorInput) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI failed to generate goal suggestions.');
      }
      return output;
    } catch (error) {
      console.error('Error in goalGeneratorFlow:', error);
      throw error;
    }
  }
);