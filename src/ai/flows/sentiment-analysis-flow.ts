/**
 * @fileOverview Analyzes user conversation history to detect prominent emotional states.
 *
 * - analyzeSentiment - A function that performs sentiment analysis on conversation text.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import { ai } from '@/ai/genkit';
import {
  SentimentAnalysisInputSchema,
  type SentimentAnalysisInput,
  SentimentAnalysisOutputSchema,
  type SentimentAnalysisOutput,
} from '@/types';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

export async function analyzeSentiment(
  input: SentimentAnalysisInput
): Promise<SentimentAnalysisOutput> {
  try {
    return await runGenkitFlowWithRetry(
      sentimentAnalysisFlow,
      input,
      'analyzeSentiment',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Sentiment Analysis');
    logAIFlowExecution('analyzeSentiment', input, undefined, error instanceof Error ? error : new Error(String(error)));
    throw new Error(formattedError);
  }
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
  async (input: SentimentAnalysisInput) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI failed to generate sentiment analysis. The output was empty.');
      }
      return output;
    } catch (error) {
      console.error('Error in sentimentAnalysisFlow:', error);
      throw error;
    }
  }
);