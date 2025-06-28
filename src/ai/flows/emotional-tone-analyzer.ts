// src/ai/flows/emotional-tone-analyzer.ts
import { z } from 'zod';
import { ai } from '../genkit';

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

export const analyzeEmotionalTone = ai.defineFlow(
  {
    name: 'analyzeEmotionalTone',
    inputSchema: EmotionalToneInputSchema,
    outputSchema: EmotionalToneOutputSchema,
  },
  async (input: EmotionalToneInput): Promise<EmotionalToneOutput> => {
    const response = await ai.generate({
      prompt: `
You are an expert emotional tone analyzer specializing in cognitive therapy sessions. 

Analyze the emotional tone of this user message:
"${input.userMessage}"

${input.context ? `Context: ${input.context}` : ''}
${input.previousTone ? `Previous emotional tone: ${input.previousTone}` : ''}

Provide a detailed analysis including:
1. Primary emotion (use specific, nuanced terms like "cautious optimism", "frustrated determination", "vulnerable openness")
2. Intensity level (1-10, where 1 is very mild, 10 is overwhelming)
3. Secondary emotion if present
4. Confidence in your analysis (0-1)
5. Emotional progression (improving/stable/declining/breakthrough)
6. Key trigger words that indicate the emotional state

Focus on emotions relevant to cognitive therapy: anxiety, depression, hope, clarity, confusion, resistance, acceptance, breakthrough moments, etc.
      `,
    });

    const content = response.text;
    
    // Parse the response to extract structured data
    // This is a simplified approach - in production, you might want more robust parsing
    const lines = content.split('\n');
    
    let primaryEmotion = '';
    let intensity = 5;
    let secondaryEmotion = '';
    let confidence = 0.8;
    let progression: 'improving' | 'stable' | 'declining' | 'breakthrough' = 'stable';
    let triggerWords: string[] = [];
    
    // Extract values from AI response (this is a basic implementation)
    for (const line of lines) {
      if (line.toLowerCase().includes('primary emotion')) {
        const match = line.match(/primary emotion.*?[:\"']([^\"'\n]+)/i);
        if (match) primaryEmotion = match[1].trim();
      }
      if (line.toLowerCase().includes('intensity')) {
        const match = line.match(/intensity.*?(\d+)/i);
        if (match) intensity = parseInt(match[1]);
      }
      if (line.toLowerCase().includes('secondary emotion')) {
        const match = line.match(/secondary emotion.*?[:\"']([^\"'\n]+)/i);
        if (match) secondaryEmotion = match[1].trim();
      }
      if (line.toLowerCase().includes('confidence')) {
        const match = line.match(/confidence.*?(0\.\d+|\d+)/i);
        if (match) confidence = parseFloat(match[1]);
      }
      if (line.toLowerCase().includes('progression')) {
        if (line.toLowerCase().includes('improving')) progression = 'improving';
        else if (line.toLowerCase().includes('declining')) progression = 'declining';
        else if (line.toLowerCase().includes('breakthrough')) progression = 'breakthrough';
      }
      if (line.toLowerCase().includes('trigger words')) {
        const match = line.match(/trigger words.*?[:\"']([^\"'\n]+)/i);
        if (match) {
          triggerWords = match[1].split(',').map((w: string) => w.trim());
        }
      }
    }
    
    // Fallback analysis if parsing fails
    if (!primaryEmotion) {
      if (input.userMessage.toLowerCase().includes('anxious') || input.userMessage.toLowerCase().includes('worried')) {
        primaryEmotion = 'anxiety';
        intensity = 6;
      } else if (input.userMessage.toLowerCase().includes('hope') || input.userMessage.toLowerCase().includes('better')) {
        primaryEmotion = 'hopeful';
        intensity = 7;
        progression = 'improving';
      } else if (input.userMessage.toLowerCase().includes('clear') || input.userMessage.toLowerCase().includes('understand')) {
        primaryEmotion = 'clarity';
        intensity = 8;
        progression = 'breakthrough';
      } else {
        primaryEmotion = 'neutral';
        intensity = 5;
      }
    }
    
    return {
      primaryEmotion,
      intensity: Math.max(1, Math.min(10, intensity)),
      secondaryEmotion: secondaryEmotion || undefined,
      confidence: Math.max(0, Math.min(1, confidence)),
      progression,
      triggerWords,
    };
  }
);
