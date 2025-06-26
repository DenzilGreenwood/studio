import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
    nextPlugin(),
  ],
});