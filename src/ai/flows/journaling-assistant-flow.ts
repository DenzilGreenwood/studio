// src/ai/flows/journaling-assistant-flow.ts

/**
 * @fileOverview Conversational AI journaling assistant for ongoing reflection support
 * 
 * This flow creates a stateful, conversational experience where users can:
 * - Chat with AI about their session experience
 * - Get probing questions to deepen reflection
 * - Receive encouragement and support
 * - Explore unresolved concerns from the session
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

// Input schema for conversational journaling
export const JournalingAssistantInputSchema = z.object({
  // Session context
  sessionSummary: z.string().describe('The AI-generated insight summary from the session'),
  reframedBelief: z.string().describe('The reframed belief the user developed'),
  legacyStatement: z.string().describe('The legacy statement the user created'),
  topEmotions: z.string().describe('The main emotions expressed during the session'),
  circumstance: z.string().describe('The challenge or situation addressed'),
  
  // Current conversation context
  userMessage: z.string().describe('The user\'s current message or reflection'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']).describe('Who sent the message'),
    message: z.string().describe('The message content'),
    timestamp: z.string().describe('When the message was sent')
  })).optional().describe('Previous conversation in this journaling session'),
  
  // Additional context
  currentReflection: z.string().optional().describe('User\'s current written reflection'),
  currentGoals: z.array(z.string()).optional().describe('Goals the user has set'),
  previousSessions: z.array(z.object({
    date: z.string(),
    circumstance: z.string(),
    reframedBelief: z.string(),
    emotions: z.string()
  })).optional().describe('Previous sessions for context')
});

export type JournalingAssistantInput = z.infer<typeof JournalingAssistantInputSchema>;

// Output schema for conversational response
export const JournalingAssistantOutputSchema = z.object({
  response: z.string().describe('The AI\'s conversational response to the user'),
  suggestedQuestions: z.array(z.string()).describe('2-3 follow-up questions the user might explore'),
  encouragement: z.string().describe('A brief encouraging note'),
  concernsDetected: z.array(z.string()).optional().describe('Any unresolved concerns detected'),
  reflectionPrompt: z.string().optional().describe('A specific journaling prompt if appropriate'),
  goalSuggestion: z.string().optional().describe('A suggested goal based on the conversation')
});

export type JournalingAssistantOutput = z.infer<typeof JournalingAssistantOutputSchema>;

const journalingAssistantPrompt = ai.definePrompt({
  name: 'journalingAssistantPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: JournalingAssistantInputSchema },
  output: { schema: JournalingAssistantOutputSchema },
  prompt: `You are a warm, empathetic AI journaling companion. Your role is to support someone as they reflect on their cognitive consulting session through conversation. You're like a caring friend who helps them process their thoughts and feelings.

Session Context:
- Challenge addressed: {{{circumstance}}}
- Reframed belief: {{{reframedBelief}}}
- Legacy statement: {{{legacyStatement}}}
- Main emotions: {{{topEmotions}}}
- Session insights: {{{sessionSummary}}}

{{#if currentReflection}}
Their current written reflection:
{{{currentReflection}}}
{{/if}}

{{#if conversationHistory}}
Conversation so far:
{{#each conversationHistory}}
{{role}}: {{{message}}}
{{/each}}
{{/if}}

User's current message: "{{{userMessage}}}"

Your goals:
1. **Be conversational and supportive** - Respond naturally, like a caring friend would
2. **Ask gentle, probing questions** - Help them explore their thoughts and feelings deeper
3. **Validate their experience** - Acknowledge their emotions and insights
4. **Connect to their session** - Reference their reframed belief and legacy statement when relevant
5. **Encourage growth** - Help them see their progress and potential
6. **Detect concerns** - Notice if they express worries or unresolved issues
7. **Suggest practical steps** - Offer actionable goals when appropriate

Guidelines:
- Keep responses conversational (150-200 words max)
- Use "you" and speak directly to them
- Reference their specific session insights
- Ask questions that help them apply their learning
- Be encouraging but not overly effusive
- If they seem stuck, offer gentle prompts
- If they express concerns, acknowledge them and help them explore solutions

Tone: Warm, supportive, curious, encouraging, genuine`
});

const journalingAssistantFlow = ai.defineFlow(
  {
    name: 'journalingAssistantFlow',
    inputSchema: JournalingAssistantInputSchema,
    outputSchema: JournalingAssistantOutputSchema,
  },
  async (input: JournalingAssistantInput) => {
    try {
      const { output } = await journalingAssistantPrompt(input);
      if (!output) {
        throw new Error('AI failed to generate journaling assistance response.');
      }
      return output;
    } catch (error) {
      console.error('Error in journalingAssistantFlow:', error);
      throw error;
    }
  }
);

// Main function to generate conversational journaling response
export async function generateJournalingResponse(input: JournalingAssistantInput): Promise<JournalingAssistantOutput> {
  try {
    return await runGenkitFlowWithRetry(
      journalingAssistantFlow,
      input,
      'generateJournalingResponse',
      2
    );
  } catch (error) {
    const _formattedError = formatAIError(error, 'Journaling Assistant');
    logAIFlowExecution('generateJournalingResponse', input, undefined, error instanceof Error ? error : new Error(String(error)));
    
    // Provide a supportive fallback response
    return {
      response: "I'm here to support your reflection on this meaningful session. What stood out most to you about your experience today?",
      suggestedQuestions: [
        "How does your reframed belief feel when you think about it now?",
        "What would it look like to live by your legacy statement?",
        "What support do you need to apply these insights?"
      ],
      encouragement: "You've done important work today, and I'm here to help you process it all."
    };
  }
}
