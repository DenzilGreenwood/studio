// src/lib/genkit-utils.ts

/**
 * Enhanced error handling and logging utilities for Genkit flows
 */

/**
 * Wrapper function for Genkit flows with enhanced error handling and logging
 */
export async function runGenkitFlowWithRetry<TInput, TOutput>(
  flowFunction: (input: TInput) => Promise<TOutput>,
  input: TInput,
  flowName: string,
  maxRetries: number = 2
): Promise<TOutput> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Genkit] Running flow: ${flowName} (attempt ${attempt})`);
      
      const result = await flowFunction(input);
      
      console.log(`[Genkit] Successfully completed flow: ${flowName}`);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Genkit] Flow '${flowName}' failed on attempt ${attempt}:`, {
        error: lastError.message,
        stack: lastError.stack,
        input: JSON.stringify(input, null, 2)
      });

      // If this is the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[Genkit] Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // If we get here, all attempts failed
  throw new Error(
    `Flow '${flowName}' failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Validate environment variables for Genkit
 */
export function validateGenkitEnvironment(): void {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error(
      'GOOGLE_API_KEY is not set. Please add it to your .env.local file.'
    );
  }

  console.log('[Genkit] Environment validation passed');
}

/**
 * Enhanced error message formatter for AI flow errors
 */
export function formatAIError(error: unknown, context: string): string {
  if (error instanceof Error) {
    // Check for common Genkit/Google AI errors
    if (error.message.includes('API_KEY')) {
      return `Authentication failed: Please check your Google API key. Context: ${context}`;
    }
    if (error.message.includes('quota')) {
      return `Rate limit exceeded: Please try again later. Context: ${context}`;
    }
    if (error.message.includes('model')) {
      return `Model error: The AI model encountered an issue. Context: ${context}`;
    }
    return `${context}: ${error.message}`;
  }
  return `${context}: Unknown error occurred`;
}

/**
 * Log AI flow execution for debugging
 */
export function logAIFlowExecution(
  flowName: string, 
  input: any, 
  output?: any, 
  error?: Error
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[AI Flow] ${flowName}`);
    console.log('Input:', JSON.stringify(input, null, 2));
    if (output) {
      console.log('Output:', JSON.stringify(output, null, 2));
    }
    if (error) {
      console.error('Error:', error.message);
    }
    console.groupEnd();
  }
}
