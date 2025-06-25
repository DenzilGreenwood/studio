
/**
 * @fileOverview Analyzes user conversation history to detect prominent emotional states.
 *
 * - analyzeSentiment - A function that performs sentiment analysis on conversation text.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SentimentAnalysisInputSchema = z.object({
  userMessages: z
    .string()
    .describe(
      'A string containing all user messages from the conversation, concatenated.'
    ),
});
export type SentimentAnalysisInput = z.infer<
  typeof SentimentAnalysisInputSchema
>;

const SentimentAnalysisOutputSchema = z.object({
  detectedEmotions: z
    .string()
    .describe(
      'A comma-separated list of the most prominent emotions expressed by the user during the conversation. Aim for 3-5 key emotions that capture the overall emotional journey.'
    ),
});
export type SentimentAnalysisOutput = z.infer<
  typeof SentimentAnalysisOutputSchema
>;

export async function analyzeSentiment(
  input: SentimentAnalysisInput
): Promise<SentimentAnalysisOutput> {
  return sentimentAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: SentimentAnalysisInputSchema},
  output: {schema: SentimentAnalysisOutputSchema},
  prompt: `You are an expert in sentiment analysis and emotional intelligence.
  Analyze the following user messages from a conversation.
  Identify the key emotional states the user expressed or transitioned through.
  Focus only on the user's feelings and sentiments.
  Provide a comma-separated list of the 3 to 5 most prominent emotions. For example: "Concern, Frustration, Hope, Relief".

  User Messages:
  {{{userMessages}}}

  Detected Emotions:`,
});

export const sentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'sentimentAnalysisFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate sentiment analysis. The output was empty.');
    }
    return output;
  }
);
