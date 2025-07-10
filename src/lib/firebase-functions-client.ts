// src/lib/firebase-functions-client.ts
import { functions, httpsCallable } from './firebase';
import { auth } from './firebase';

/**
 * Base URL for Firebase Functions
 * In production, this would be the deployed functions URL
 * In development with emulator, this points to the local emulator
 */
const FUNCTIONS_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5002/cognitiveinsight-e5c40/us-central1'
  : 'https://us-central1-cognitiveinsight-e5c40.cloudfunctions.net';

/**
 * Generic function to call Firebase Functions via HTTP
 * This provides a drop-in replacement for fetch('/api/...') calls
 */
export async function callFirebaseFunction(
  functionName: string,
  data?: unknown,
  options: {
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const { method = 'POST', headers = {} } = options;
  
  // Get auth token if user is authenticated
  let authToken = '';
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      authToken = await currentUser.getIdToken();
    }
  } catch (error) {
    // Silently handle auth token errors in production
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to get auth token:', error);
    }
  }

  const url = `${FUNCTIONS_BASE_URL}/${functionName}`;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Calling Firebase Function:', {
      functionName,
      url,
      method,
      hasData: !!data,
      hasAuthToken: !!authToken
    });
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...headers,
    },
  };

  if (method === 'POST' && data) {
    fetchOptions.body = JSON.stringify(data);
  }

  return fetch(url, fetchOptions);
}

/**
 * Alternative approach using Firebase SDK's httpsCallable
 * This approach uses the Firebase SDK directly and may have better error handling
 */
export function createCallableFunction<T = unknown, R = unknown>(functionName: string) {
  const callable = httpsCallable<T, R>(functions, functionName);
  
  return async (data?: T): Promise<R> => {
    try {
      const result = await callable(data);
      return result.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  };
}

/**
 * Helper functions for each API endpoint
 * These provide type-safe wrappers around the Firebase Functions
 */

// Health check
export const healthCheck = createCallableFunction<void, { status: string; timestamp: string }>('health');

// Protocol endpoint
export const callProtocol = (data: unknown) => callFirebaseFunction('protocol', data);

// User limit check
export const checkUserLimit = () => callFirebaseFunction('userLimit', undefined, { method: 'GET' });

// Clarity summary
export const getClaritySummary = (data: unknown) => callFirebaseFunction('claritySummary', data);

// Sentiment analysis
export const analyzeSentiment = (data: unknown) => callFirebaseFunction('sentimentAnalysis', data);

// Emotional tone analysis
export const analyzeEmotionalTone = (data: unknown) => callFirebaseFunction('emotionalTone', data);

// Session reflection
export const generateSessionReflection = (data: unknown) => callFirebaseFunction('sessionReflection', data);

// Journal assistance
export const getJournalAssistance = (data: unknown) => callFirebaseFunction('journalAssistance', data);

// Journaling assistant
export const callJournalingAssistant = (data: unknown) => callFirebaseFunction('journalingAssistant', data);

// Generate insight report
export const generateInsightReport = (data: unknown) => callFirebaseFunction('generateInsightReport', data);

// Cross-session analysis
export const getCrossSessionAnalysis = (data: unknown) => callFirebaseFunction('crossSessionAnalysis', data);

// Growth report
export const getGrowthReport = (data: unknown) => callFirebaseFunction('growthReport', data);

// Clean report
export const getCleanReport = (sessionId: string) => 
  callFirebaseFunction('cleanReport', undefined, { 
    method: 'GET',
    headers: { 'X-Session-ID': sessionId }
  });

export const generateCleanReport = (data: unknown) => callFirebaseFunction('cleanReport', data);

// Clean PDF
export const generateCleanPdf = (data: unknown) => callFirebaseFunction('cleanPdf', data);

// Genkit endpoint
export const callGenkit = (data: unknown) => callFirebaseFunction('genkit', data);
