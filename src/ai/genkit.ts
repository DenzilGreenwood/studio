// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Import all flows to register them
import '@/ai/flows/cognitive-edge-protocol';
import '@/ai/flows/clarity-summary-generator';
import '@/ai/flows/sentiment-analysis-flow';
import '@/ai/flows/goal-generator-flow';
import '@/ai/flows/tts-flow.ts';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
});