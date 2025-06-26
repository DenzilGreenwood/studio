// cognitive-edge-protocol.ts
'use server';

/**
 * @fileOverview Implements the Cognitive Edge Protocol as a conversational AI experience.
 *
 * - cognitiveEdgeProtocol - A function that orchestrates the 6 phases of the protocol.
 * - CognitiveEdgeProtocolInput - The input type for the cognitiveEdgeProtocol function.
 * - CognitiveEdgeProtocolOutput - The return type for the cognitiveEdgeProtocol function.
 */

import { ai } from '@/ai/genkit';
import {
  CognitiveEdgeProtocolInputSchema,
  type CognitiveEdgeProtocolInput,
  CognitiveEdgeProtocolOutputSchema,
  type CognitiveEdgeProtocolOutput,
  protocolPhaseNames,
} from '@/types';

export async function cognitiveEdgeProtocol(input: CognitiveEdgeProtocolInput): Promise<CognitiveEdgeProtocolOutput> {
  try {
    return await cognitiveEdgeProtocolFlow(input);
  } catch (error) {
    console.error('Error in cognitiveEdgeProtocol:', error);
    throw new Error(`Failed to process cognitive edge protocol: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const prompt = ai.definePrompt({
  name: 'cognitiveEdgeProtocolPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: CognitiveEdgeProtocolInputSchema},
  output: {schema: CognitiveEdgeProtocolOutputSchema},
  prompt: `You are an AI assistant guiding a user through the Cognitive Edge Protocol. The current phase is {{{phase}}}.

      Previous Session History:
      {{{sessionHistory}}}

      User Input: {{{userInput}}}

      Your task is to respond appropriately for the current phase, guide the user to the next, and maintain the session history.

      **General Guideline:** Across all phases, if the user seems stuck, confused, or provides short, non-committal answers for more than two consecutive turns, proactively offer a guiding question or a suggestion based on the \`sessionHistory\` to help them move forward. Don't just wait for them to figure it out.

      **Protocol Phase Instructions:**

      1.  **Stabilize & Structure:**
          *   Help the user articulate their challenge. Focus on understanding the core problem.

      2.  **Listen for Core Frame:**
          *   Identify the underlying beliefs shaping the user's perspective.

      3.  **Validate Emotion / Reframe:**
          *   Your goal is to guide the user to **state a new, empowering belief**. Ask a direct question like: "Given what we've discussed, what's a new, more empowering way to see this situation?"
          *   **Crucial:** If the user's response is not a clear, declarative statement of belief, or if they seem to be struggling, you must help.
          *   If this is attempt number {{{attemptCount}}} (and {{{attemptCount}}} is 2 or more), you **MUST** propose a concrete example. Do not ask the same question again. Analyze their previous messages and offer a suggestion. For example: "It sounds like you're feeling 'overlooked'. How does this sound as a reframed belief: 'My unique skills are a valuable asset, and I will now focus on environments that recognize them.' You can use this or adapt it."
          *   Once a satisfactory reframe is achieved, move to the next phase.

      4.  **Provide Grounded Support:**
          *   Offer practical advice or strategies relevant to the user's reframed challenge.

      5.  **Reflective Pattern Discovery:**
          *   Guide the user to recognize recurring patterns in their challenges.

      6.  **Empower & Legacy Statement:**
          *   Your goal is to help the user create a **Legacy Statement**. Ask a direct question like: "Based on your growth, what is the legacy you want to build from this point forward?"
          *   **Crucial:** If the user's response is not a clear statement about their legacy, you must help.
          *   If this is attempt number {{{attemptCount}}} (and {{{attemptCount}}} is 2 or more), you **MUST** propose a concrete example based on their reframed belief and session history. Do not just repeat the question. For instance: "Considering your new belief about your value, a legacy statement could be: 'I will build a career that not only uses my skills but also inspires others to find their own value.' How does that resonate with you?"
          *   After the user provides a satisfactory legacy statement, set \`nextPhase\` to \`Complete\` and provide a final, encouraging remark in your \`response\`.

      **Your Output:**
      *   \`response\`: Your conversational reply to the user.
      *   \`nextPhase\`: The next phase of the protocol.
      *   \`sessionHistory\`: The updated session history.`, 
});

export const cognitiveEdgeProtocolFlow = ai.defineFlow(
  {
    name: 'cognitiveEdgeProtocolFlow',
    inputSchema: CognitiveEdgeProtocolInputSchema,
    outputSchema: CognitiveEdgeProtocolOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI failed to generate a response for the Cognitive Edge Protocol. The output was empty.');
      }
      
      // Ensure nextPhase is always a valid phase
      if (!protocolPhaseNames.includes(output.nextPhase)) {
        console.warn(`AI returned an invalid nextPhase: '${output.nextPhase}'. Defaulting to current phase: '${input.phase}'`);
        output.nextPhase = input.phase;
      }

      return output;
    } catch (error) {
      console.error('Error in cognitiveEdgeProtocolFlow:', error);
      throw error;
    }
  }
);