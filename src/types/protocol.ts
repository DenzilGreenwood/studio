// src/types/protocol.ts
import { z } from 'zod';

// For cognitive-edge-protocol
export const protocolPhaseNames = [
  'Stabilize & Structure',
  'Listen for Core Frame',
  'Validate Emotion / Reframe',
  'Provide Grounded Support',
  'Reflective Pattern Discovery',
  'Empower & Legacy Statement',
  'Complete',
] as const;

export const ProtocolPhaseEnum = z.enum(protocolPhaseNames);
export type ProtocolPhase = z.infer<typeof ProtocolPhaseEnum>;

export const CognitiveEdgeProtocolInputSchema = z.object({
  userInput: z.string().describe('The user input for the current phase.'),
  phase: ProtocolPhaseEnum.describe('The current phase of the Cognitive Edge Protocol.'),
  sessionHistory: z.string().optional().describe('The session history to maintain context and discovered insights.'),
  attemptCount: z.number().optional().describe('The number of attempts to get a key response (like a reframe or legacy statement).'),
  discoveredMentalModel: z.string().optional().describe('The user\'s core mental model if already discovered (e.g., "10,950 days left").'),
  cognitiveEdgeIdentified: z.boolean().optional().describe('Whether the user\'s cognitive edge has been identified.'),
  currentAIRole: z.enum(['strategist', 'supporter', 'facilitator', 'deep_listener', 'empowerment_coach']).optional().describe('Current AI role to maintain consistency.')
});
export type CognitiveEdgeProtocolInput = z.infer<typeof CognitiveEdgeProtocolInputSchema>;

export const CognitiveEdgeProtocolOutputSchema = z.object({
  response: z.string().describe('The AI response for the current phase.'),
  nextPhase: ProtocolPhaseEnum.describe('The next phase of the Cognitive Edge Protocol.'),
  sessionHistory: z.string().describe('The updated session history with key insights preserved.'),
  discoveredMentalModel: z.string().optional().describe('The user\'s core mental model if discovered in this exchange.'),
  cognitiveEdgeInsight: z.string().optional().describe('Insight about the user\'s cognitive edge if identified.'),
  aiRoleTransition: z.object({
    newRole: z.enum(['strategist', 'supporter', 'facilitator', 'deep_listener', 'empowerment_coach']),
    reason: z.string()
  }).optional().describe('AI role change if needed.'),
  keyStatement: z.object({
    type: z.enum(['reframed_belief', 'legacy_statement', 'mental_model', 'cognitive_edge']),
    statement: z.string(),
    significance: z.string()
  }).optional().describe('Important statement captured in this exchange.'),
  tangibleAsset: z.string().optional().describe('Any tangible asset or tool co-created with the user.')
});
export type CognitiveEdgeProtocolOutput = z.infer<typeof CognitiveEdgeProtocolOutputSchema>;
