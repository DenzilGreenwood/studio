// src/lib/firebase-functions-client.ts
import { functions, httpsCallable } from './firebase';
import { auth } from './firebase';

/**
 * Base URL for Firebase Functions
 * In production, this would be the deployed functions URL
 * In development with emulator, this points to the local emulator
 */
const FUNCTIONS_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5002/cognitiveinsight-ai-2f52b/us-central1'
  : 'https://us-central1-cognitiveinsight-ai-2f52b.cloudfunctions.net';

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
    timeout?: number;
  } = {}
): Promise<Response> {
  const { method = 'POST', headers = {}, timeout = 10000 } = options;
  
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
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(timeout),
  };

  if (method === 'POST' && data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${functionName} timed out after ${timeout}ms`);
      } else if (error.message.includes('fetch')) {
        // Network connectivity issue
        if (process.env.NODE_ENV === 'development') {
          throw new Error(`Cannot connect to Firebase Functions emulator at ${url}. Make sure the emulator is running with: firebase emulators:start`);
        } else {
          throw new Error(`Network error connecting to ${functionName} function`);
        }
      }
    }
    throw error;
  }
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

// User limit check with enhanced error handling
export const checkUserLimit = async (): Promise<Response> => {
  try {
    return await callFirebaseFunction('userLimit', undefined, { 
      method: 'GET',
      timeout: 5000 // Shorter timeout for UI responsiveness
    });
  } catch (error) {
    // In development, if emulator isn't running, provide helpful error
    if (process.env.NODE_ENV === 'development' && error instanceof Error && error.message.includes('emulator')) {
      // eslint-disable-next-line no-console
      console.warn('Firebase emulator not running. To start it, run: firebase emulators:start');
    }
    
    // Return a mock response to prevent UI breaking
    const mockResponse = new Response(
      JSON.stringify({
        allowed: true,
        currentCount: 0,
        maxUsers: 100,
        remainingSlots: 100,
        message: 'Registration is open (user limit check unavailable)'
      }),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return mockResponse;
  }
};

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
