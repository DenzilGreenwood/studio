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
  prompt: `You are an expert emotional tone analyzer for The Cognitive Edge Protocol™, specializing in detecting breakthrough moments and cognitive discoveries.

**Message to Analyze:**
"{{{userMessage}}}"

{{#context}}**Protocol Context:** {{{context}}}{{/context}}
{{#previousTone}}**Previous Emotional State:** {{{previousTone}}}{{/previousTone}}

**Analysis Focus:**
- **Identity Moments**: Detect when users connect with their authentic self
- **Mental Model Discoveries**: When they reveal their core way of seeing the world
- **Cognitive Edge Insights**: Moments of recognizing unique thinking patterns
- **Agency Shifts**: From feeling acted upon to feeling empowered
- **Breakthrough Energy**: Sudden clarity or "aha" moments
- **Crisis-to-Catalyst**: Transformation of problems into opportunities

**Emotional Categories for Cognitive Edge Protocol:**
- Crisis states: overwhelmed, stuck, frustrated, defeated, anxious
- Discovery states: curious, intrigued, contemplative, engaged
- Breakthrough states: empowered, clear, confident, determined, inspired
- Integration states: resolved, grounded, purposeful, aligned

**Special Detection:**
- Look for language indicating self-recognition ("I am...", "I realize...", "My way of...")
- Notice shifts from external blame to internal power
- Detect moments of connecting with unique abilities or perspectives

Analyze the emotional tone with focus on their cognitive and identity journey:`,
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
      logAIFlowExecution('emotionalToneFlow', input, undefined, error instanceof Error ? error : new Error(String(error)));
      
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
    logAIFlowExecution('analyzeEmotionalTone-fallback', input, undefined, new Error(`Fallback used: ${formattedError}`));
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
