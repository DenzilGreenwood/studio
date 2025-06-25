import { initializeApp } from 'firebase-admin/app';
import { genkit } from 'genkit';

// The flows must be imported so that they are registered with Genkit.g
import '@/ai/flows/clarity-summary-generator';
import '@/ai/flows/cognitive-edge-protocol';
import '@/ai/flows/sentiment-analysis-flow';
import '@/ai/flows/goal-generator-flow';

import { claritySummaryFlow } from '@/ai/flows/clarity-summary-generator';
import { cognitiveEdgeProtocolFlow } from '@/ai/flows/cognitive-edge-protocol';
import { sentimentAnalysisFlow } from '@/ai/flows/sentiment-analysis-flow';
import { goalGeneratorFlow } from '@/ai/flows/goal-generator-flow';

initializeApp();

export const cognitiveEdgeProtocol = genkit(cognitiveEdgeProtocolFlow);
export const generateClaritySummary = genkit.onFlow(claritySummaryFlow);
export const analyzeSentiment = genkit.onFlow(sentimentAnalysisFlow);
export const generateGoals = genkit.onFlow(goalGeneratorFlow);