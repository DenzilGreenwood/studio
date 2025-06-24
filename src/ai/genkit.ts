// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import nextPlugin from '@genkit-ai/next';

// Import the flows defined in your project
import { cognitiveEdgeProtocolFlow } from './flows/cognitive-edge-protocol';
import { claritySummaryFlow } from './flows/clarity-summary-generator';
import { sentimentAnalysisFlow } from './flows/sentiment-analysis-flow';
import { goalGeneratorFlow } from './flows/goal-generator-flow';

// Warn if the GOOGLE_API_KEY is missing in development
if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[Warning] GOOGLE_API_KEY is not set. Add it to your .env file to enable Google AI features.'
  );
}

export const ai = genkit({
  // Register the plugins your project will use.
  // The firebase() plugin is added to store trace and flow state data in Firestore,
  // which is ideal for a Firebase-based project like yours.
  plugins: [
    firebase(),
    googleAI(),
    nextPlugin()
  ],
  
  // List all the flows you want Genkit to recognize and manage.
  // This makes them available in the developer UI and for deployment.
  flows: [
    cognitiveEdgeProtocolFlow,
    claritySummaryFlow,
    sentimentAnalysisFlow,
    goalGeneratorFlow,
  ],
  
  // Defines where to store traces. Using Firestore is recommended for production.
  traceStore: {
    provider: 'firebase',
  },

  // Defines where to store the state of long-running flows.
  flowStateStore: {
    provider: 'firebase',
  },

  // Optional: Enable full tracing and metrics for production monitoring.
  enableTracingAndMetrics: true,
});
