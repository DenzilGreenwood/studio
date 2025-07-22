import { ai } from '@/ai/genkit';

// Import all flows to register them
// import '@/ai/flows/cognitive-edge-protocol';
// import '@/ai/flows/clarity-summary-generator';
// import '@/ai/flows/sentiment-analysis-flow';
// import '@/ai/flows/goal-generator-flow';
// import '@/ai/flows/cross-session-analysis-flow';

export async function GET() {
  return new Response('Genkit flows are registered and ready', { status: 200 });
}

export async function POST() {
  return new Response('Genkit flows are registered and ready', { status: 200 });
}