import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { defineFlow } from 'genkit/flow';

// Import your flows from their respective files
import { claritySummaryFlow } from './flows/clarity-summary-generator';
import { cognitiveEdgeProtocolFlow } from './flows/cognitive-edge-protocol';
import { goalGeneratorFlow } from './flows/goal-generator-flow';
import { sentimentAnalysisFlow } from './flows/sentiment-analysis-flow';

// Warn if the GOOGLE_API_KEY is missing in development
if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[Warning] GOOGLE_API_KEY is not set. Add it to your .env file to enable Google AI features.'
  );
}

// Configure Genkit with plugins
export default genkit({
  plugins: [googleAI()],
  // You can set a default model for all flows here
  // model: 'googleai/gemini-1.5-pro-latest',
  
  // List all the flows you want to be discoverable by Genkit
  flows: [
    claritySummaryFlow,
    cognitiveEdgeProtocolFlow,
    goalGeneratorFlow,
    sentimentAnalysisFlow,
  ],

  // Optional: Add a logger for better debugging
  // logger: {
  //   log(level, message) {
  //     console[level](message);
  //   },
  // },
});