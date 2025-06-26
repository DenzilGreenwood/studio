// src/ai/genkit.ts
import {genkit} from 'genkit';

// Use require to bypass bundler static analysis for these server-only packages.
const {googleAI} = require('@genkit-ai/googleai');
const nextPlugin = require('@genkit-ai/next').default;

export const ai = genkit({
  plugins: [
    googleAI(),
    nextPlugin(),
  ],
});
