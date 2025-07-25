// src/types/ai-flows.ts
import { z } from 'zod';

// For clarity-summary-generator
export const ClaritySummaryInputSchema = z.object({
  reframedBelief: z.string().describe('The reframed belief of the user after the session.'),
  legacyStatement: z.string().describe('The legacy statement created by the user during the session.'),
  topEmotions: z.string().describe('The top emotions expressed by the user during the session.'),
});
export type ClaritySummaryInput = z.infer<typeof ClaritySummaryInputSchema>;

export const ClaritySummaryOutputSchema = z.object({
  insightSummary: z.string().describe('The generated insight summary.'),
});
export type ClaritySummaryOutput = z.infer<typeof ClaritySummaryOutputSchema>;

// For sentiment-analysis-flow
export const SentimentAnalysisInputSchema = z.object({
  userMessages: z.string().describe('A string containing all user messages from the conversation, concatenated.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

export const SentimentAnalysisOutputSchema = z.object({
  detectedEmotions: z.string().describe('A comma-separated list of the most prominent emotions expressed by the user during the conversation. Aim for 3-5 key emotions that capture the overall emotional journey.'),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;

// For goal-generator-flow
export const GoalGeneratorInputSchema = z.object({
  sessionSummary: z.string().describe('The AI-generated summary of the cognitive session.'),
  userReflection: z.string().describe("The user's personal reflection or journal entry about the session."),
});
export type GoalGeneratorInput = z.infer<typeof GoalGeneratorInputSchema>;

export const GoalGeneratorOutputSchema = z.object({
  suggestedGoals: z.array(z.string()).describe('An array of 3-5 actionable and meaningful goal suggestions based on the input.'),
});
export type GoalGeneratorOutput = z.infer<typeof GoalGeneratorOutputSchema>;

// For journaling-assistant-flow
export const JournalingAssistantInputSchema = z.object({
  userMessage: z.string().describe('The user\'s message or question for journaling assistance'),
  sessionContext: z.object({
    date: z.string().describe('Session date'),
    circumstance: z.string().describe('Challenge or situation from the session'),
    reframedBelief: z.string().describe('The reframed belief from the session'),
    legacyStatement: z.string().describe('The legacy statement from the session'),
    topEmotions: z.string().describe('Primary emotions from the session'),
    aiSummary: z.string().optional().describe('AI-generated session summary')
  }).describe('Context from the session being reflected upon'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().describe('Previous conversation history for context')
});
export type JournalingAssistantInput = z.infer<typeof JournalingAssistantInputSchema>;

export const JournalingAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to help with journaling and reflection'),
  suggestedPrompts: z.array(z.string()).optional().describe('Follow-up prompts to deepen reflection')
});
export type JournalingAssistantOutput = z.infer<typeof JournalingAssistantOutputSchema>;
