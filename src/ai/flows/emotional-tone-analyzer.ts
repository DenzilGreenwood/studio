// src/ai/flows/emotional-tone-analyzer.ts
import { z } from 'zod';
import { ai } from '../genkit';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

export const EmotionalToneInputSchema = z.object({
  userMessage: z.string().describe('The user message to analyze for emotional tone.'),
  context: z.string().optional().describe('Additional context about the conversation phase.'),
  previousTone: z.string().optional().describe('Previous emotional tone to track progression.'),
});

export const EmotionalToneOutputSchema = z.object({
  primaryEmotion: z.string().describe('The primary emotion detected (e.g., anxiety, hope, frustration, clarity).'),
  intensity: z.number().min(1).max(10).describe('Intensity of the emotion on a 1-10 scale.'),
  secondaryEmotion: z.string().optional().describe('Secondary emotion if present.'),
  confidence: z.number().min(0).max(1).describe('Confidence in the analysis (0-1 scale).'),
  progression: z.enum(['improving', 'stable', 'declining', 'breakthrough']).describe('How the emotional state is progressing.'),
  triggerWords: z.array(z.string()).describe('Key words or phrases that indicate the emotional state.'),
});

export type EmotionalToneInput = z.infer<typeof EmotionalToneInputSchema>;
export type EmotionalToneOutput = z.infer<typeof EmotionalToneOutputSchema>;

const emotionalTonePrompt = ai.definePrompt({
  name: 'emotionalToneAnalysisPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: EmotionalToneInputSchema },
  output: { schema: EmotionalToneOutputSchema },
  prompt: `You are an expert emotional tone analyzer specializing in cognitive therapy sessions.

Analyze the emotional tone of this user message:
"{{{userMessage}}}"

{{#context}}Context: {{{context}}}{{/context}}
{{#previousTone}}Previous emotional tone: {{{previousTone}}}{{/previousTone}}

Respond in this exact JSON format:
{
  "primaryEmotion": "specific emotional term",
  "intensity": number from 1-10,
  "secondaryEmotion": "optional secondary emotion or null",
  "confidence": number from 0.0-1.0,
  "progression": "improving" | "stable" | "declining" | "breakthrough",
  "triggerWords": ["word1", "word2", "word3"]
}

Use specific, nuanced emotional terms like "cautious optimism", "frustrated determination", "vulnerable openness" for primary emotion.
Focus on emotions relevant to cognitive therapy: anxiety, depression, hope, clarity, confusion, resistance, acceptance, breakthrough moments, etc.`,
});

const emotionalToneFlow = ai.defineFlow(
  {
    name: 'emotionalToneFlow',
    inputSchema: EmotionalToneInputSchema,
    outputSchema: EmotionalToneOutputSchema,
  },
  async (input: EmotionalToneInput): Promise<EmotionalToneOutput> => {
    try {
      const { output } = await emotionalTonePrompt(input);
      
      if (!output) {
        throw new Error('AI failed to generate emotional tone analysis. The output was empty.');
      }
      
      // The response should already be structured due to the prompt design
      return {
        primaryEmotion: output.primaryEmotion || 'neutral',
        intensity: Math.max(1, Math.min(10, output.intensity || 5)),
        secondaryEmotion: output.secondaryEmotion || undefined,
        confidence: Math.max(0, Math.min(1, output.confidence || 0.8)),
        progression: ['improving', 'stable', 'declining', 'breakthrough'].includes(output.progression) 
          ? output.progression 
          : 'stable',
        triggerWords: Array.isArray(output.triggerWords) ? output.triggerWords : [],
      };
    } catch (error) {
      console.error('Error in emotional tone analysis flow:', error);
      
      // Return a safe fallback response
      return {
        primaryEmotion: detectEmotionFallback(input.userMessage),
        intensity: 5,
        confidence: 0.5,
        progression: 'stable',
        triggerWords: [],
      };
    }
  }
);

export async function analyzeEmotionalTone(input: EmotionalToneInput): Promise<EmotionalToneOutput> {
  try {
    return await runGenkitFlowWithRetry(
      emotionalToneFlow,
      input,
      'analyzeEmotionalTone',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Emotional Tone Analysis');
    logAIFlowExecution('analyzeEmotionalTone', input, undefined, error instanceof Error ? error : new Error(String(error)));
    
    // Return fallback instead of throwing to prevent breaking the conversation
    console.warn('Emotional tone analysis failed, using fallback:', formattedError);
    return {
      primaryEmotion: detectEmotionFallback(input.userMessage),
      intensity: 5,
      confidence: 0.3,
      progression: 'stable',
      triggerWords: [],
    };
  }
}

// Helper function for fallback emotion detection
function detectEmotionFallback(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
    return 'anxiety';
  } else if (lowerMessage.includes('hope') || lowerMessage.includes('better') || lowerMessage.includes('positive')) {
    return 'hopeful';
  } else if (lowerMessage.includes('clear') || lowerMessage.includes('understand') || lowerMessage.includes('insight')) {
    return 'clarity';
  } else if (lowerMessage.includes('frustrated') || lowerMessage.includes('annoyed') || lowerMessage.includes('irritated')) {
    return 'frustration';
  } else if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
    return 'sadness';
  } else if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('furious')) {
    return 'anger';
  } else if (lowerMessage.includes('confused') || lowerMessage.includes('lost') || lowerMessage.includes('unsure')) {
    return 'confusion';
  } else {
    return 'neutral';
  }
}
