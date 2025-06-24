import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {nextPlugin} from '@genkit-ai/next';

if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    `GOOGLE_API_KEY is not set. Please add it to your .env file to use Google AI features.`
  );
}

export const ai = genkit({
  plugins: [googleAI(), nextPlugin()],
  model: 'googleai/gemini-1.5-pro-latest',
});
