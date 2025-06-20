'use server';

/**
 * @fileOverview Implements the Cognitive Edge Protocol as a Genkit flow.
 *
 * - cognitiveEdgeProtocol - The main function to run the protocol.
 * - CognitiveEdgeProtocolInput - Input type for the protocol.
 * - CognitiveEdgeProtocolOutput - Output type for the protocol.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CognitiveEdgeProtocolInputSchema = z.object({
  sessionId: z.string().describe('The unique session ID.'),
  userId: z.string().describe('The user ID.'),
  message: z.string().describe('The user message.'),
  phase: z.number().describe('The current phase of the protocol (1-6).'),
});
export type CognitiveEdgeProtocolInput = z.infer<typeof CognitiveEdgeProtocolInputSchema>;

const CognitiveEdgeProtocolOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
  nextPhase: z.number().describe('The next phase of the protocol.'),
});
export type CognitiveEdgeProtocolOutput = z.infer<typeof CognitiveEdgeProtocolOutputSchema>;

export async function cognitiveEdgeProtocol(input: CognitiveEdgeProtocolInput): Promise<CognitiveEdgeProtocolOutput> {
  return cognitiveEdgeProtocolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cognitiveEdgeProtocolPrompt',
  input: {schema: CognitiveEdgeProtocolInputSchema},
  output: {schema: CognitiveEdgeProtocolOutputSchema},
  prompt: `You are an AI assistant guiding a user through the Cognitive Edge Protocol, a structured process designed to help them gain clarity and make decisions.

  The protocol has 6 phases:
  1. Stabilize & Structure: Help the user organize their thoughts and identify key issues.
  2. Listen for Core Frame: Identify the user's underlying mental model or perspective.
  3. Validate Emotion / Reframe: Acknowledge the user's emotions and help them reframe their beliefs.
  4. Provide Grounded Support: Offer practical advice and encouragement.
  5. Reflective Pattern Discovery: Help the user identify patterns in their thinking and behavior.
  6. Empower & Legacy Statement: Guide the user to create a statement that reflects their values and goals.

  You are currently in phase {{phase}}. The user has sent the following message:
  {{message}}

  Your task is to respond to the user in a way that moves them forward in the protocol. Be supportive, encouraging, and insightful.

  After your response, determine the next phase of the protocol. If the user has completed all 6 phases, set nextPhase to 0.

  Example Response (Phase 1):
  "Okay, let's start by organizing your thoughts. What are the key issues you're facing right now?"
  Next Phase: 2

  Example Response (Phase 6):
  "Based on our conversation, your legacy statement is: [Legacy Statement]. How does that resonate with you?"
  Next Phase: 0

  Response:
`,
});

const cognitiveEdgeProtocolFlow = ai.defineFlow(
  {
    name: 'cognitiveEdgeProtocolFlow',
    inputSchema: CognitiveEdgeProtocolInputSchema,
    outputSchema: CognitiveEdgeProtocolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
