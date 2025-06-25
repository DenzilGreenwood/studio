// src/ai/genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next';
import {firebase} from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [
    googleAI(), 
    nextPlugin(),
    firebase(),
  ],
});