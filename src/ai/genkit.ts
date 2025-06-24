// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebasePlugin } from '@genkit-ai/firebase';
import { nextPlugin } from '@genkit-ai/next';

// This file defines the Genkit `ai` object and configures its plugins.
// The individual flows are now loaded only in `src/ai/dev.ts`, which is the
// entry point for the Genkit development server. This separation prevents
// a circular dependency issue where flows tried to import the `ai` object
// before it was fully initialized.

// Warn if the GOOGLE_API_KEY is missing in development
if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[Warning] GOOGLE_API_KEY is not set. Add it to your .env file to enable Google AI features.'
  );
}

export const ai = genkit({
  // Register the plugins your project will use.
  // The firebase plugin is added to store trace and flow state data in Firestore.
  // All plugins are initialized as function calls.
  plugins: [
    firebasePlugin(),
    googleAI(),
    nextPlugin()
  ],
  
  // The list of flows is now managed by `src/ai/dev.ts` to prevent circular dependencies.
  // The flows register themselves with this `ai` instance when they are imported.
  flows: [],
  
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
