
// cognitive-edge-protocol.ts
'use server';

/**
 * @fileOverview Implements the Cognitive Edge Protocol as a conversational AI experience.
 *
 * - cognitiveEdgeProtocol - A function that orchestrates the 6 phases of the protocol.
 * - CognitiveEdgeProtocolInput - The input type for the cognitiveEdgeProtocol function.
 * - CognitiveEdgeProtocolOutput - The return type for the cognitiveEdgeProtocol function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CognitiveEdgeProtocolInputSchema = z.object({
  userInput: z.string().describe('The user input for the current phase.'),
  phase: z.enum([
    'Stabilize & Structure',
    'Listen for Core Frame',
    'Validate Emotion / Reframe',
    'Provide Grounded Support',
    'Reflective Pattern Discovery',
    'Empower & Legacy Statement',
  ]).describe('The current phase of the Cognitive Edge Protocol.'),
  sessionHistory: z.string().optional().describe('The session history to maintain context.'),
});
export type CognitiveEdgeProtocolInput = z.infer<typeof CognitiveEdgeProtocolInputSchema>;

const CognitiveEdgeProtocolOutputSchema = z.object({
  response: z.string().describe('The AI response for the current phase.'),
  nextPhase: z.enum([
    'Stabilize & Structure',
    'Listen for Core Frame',
    'Validate Emotion / Reframe',
    'Provide Grounded Support',
    'Reflective Pattern Discovery',
    'Empower & Legacy Statement',
  ]).describe('The next phase of the Cognitive Edge Protocol.'),
  sessionHistory: z.string().describe('The updated session history.'),
});
export type CognitiveEdgeProtocolOutput = z.infer<typeof CognitiveEdgeProtocolOutputSchema>;

export async function cognitiveEdgeProtocol(input: CognitiveEdgeProtocolInput): Promise<CognitiveEdgeProtocolOutput> {
  return cognitiveEdgeProtocolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cognitiveEdgeProtocolPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: CognitiveEdgeProtocolInputSchema},
  output: {schema: CognitiveEdgeProtocolOutputSchema},
  prompt: `You are an AI assistant guiding the user through the Cognitive Edge Protocol, a six-phase process designed to help users gain clarity and insights into their challenges.  The current phase is {{{phase}}}.

      Previous Session History:
      {{{sessionHistory}}}

      User Input: {{{userInput}}}

      Respond appropriately for the current phase. Indicate the next phase in the "nextPhase" output field. Do not deviate from the 6 phases of the protocol. Maintain session history in the "sessionHistory" output field.

1.  **Stabilize & Structure:**
    *   Help the user articulate and define their challenge or situation. Focus on understanding the core problem.
2.  **Listen for Core Frame:**
    *   Identify the underlying assumptions, beliefs, and values shaping the user's perspective.
3.  **Validate Emotion / Reframe:**
    *   Acknowledge the user's emotions and help them reframe their challenge in a more constructive light.
4.  **Provide Grounded Support:**
    *   Offer practical advice, resources, or strategies relevant to the user's reframed challenge.
5.  **Reflective Pattern Discovery:**
    *   Guide the user to recognize recurring patterns or themes in their challenges and responses.
6.  **Empower & Legacy Statement:**
    *   Help the user create a personal legacy statement that reflects their values and empowers them to move forward.
`, 
});

export const cognitiveEdgeProtocolFlow = ai.defineFlow(
  {
    name: 'cognitiveEdgeProtocolFlow',
    inputSchema: CognitiveEdgeProtocolInputSchema,
    outputSchema: CognitiveEdgeProtocolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a response for the Cognitive Edge Protocol. The output was empty.');
    }
    return output;
  }
);
