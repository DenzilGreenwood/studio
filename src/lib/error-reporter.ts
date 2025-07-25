/**
 * Error Reporter Service
 * Version: 1.0.0
 * Date: July 21, 2025
 * 
 * Centralized error reporting system that integrates with the ErrorMessages component
 * to provide user-friendly error notifications instead of console logs.
 */

// Global error reporter instance
let errorReporter: ErrorReporter | null = null;

export interface ErrorReport {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  context?: string;
  timestamp: Date;
  details?: unknown;
}

export interface ErrorReporter {
  reportError: (message: string, context?: string, details?: unknown) => void;
  reportWarning: (message: string, context?: string, details?: unknown) => void;
  reportInfo: (message: string, context?: string, details?: unknown) => void;
}

/**
 * Set the global error reporter (typically called from app component)
 */
export function setErrorReporter(reporter: ErrorReporter | null): void {
  errorReporter = reporter;
}

/**
 * Get the current error reporter
 */
export function getErrorReporter(): ErrorReporter | null {
  return errorReporter;
}

/**
 * Report an error through the centralized system
 */
export function reportError(message: string, context?: string, details?: unknown): void {
  // Always log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(`[${context || 'DataServices'}] ${message}`, details);
  }

  // Report to UI if reporter is available
  if (errorReporter) {
    errorReporter.reportError(message, context, details);
  }
}

/**
 * Report a warning through the centralized system
 */
export function reportWarning(message: string, context?: string, details?: unknown): void {
  // Always log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(`[${context || 'DataServices'}] ${message}`, details);
  }

  // Report to UI if reporter is available
  if (errorReporter) {
    errorReporter.reportWarning(message, context, details);
  }
}

/**
 * Report info through the centralized system
 */
export function reportInfo(message: string, context?: string, details?: unknown): void {
  // Always log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[${context || 'DataServices'}] ${message}`, details);
  }

  // Report to UI if reporter is available
  if (errorReporter) {
    errorReporter.reportInfo(message, context, details);
  }
}

/**
 * Helper function to create user-friendly error messages
 */
export function createUserFriendlyMessage(operation: string, error?: unknown): string {
  const baseMessage = `Failed to ${operation}`;
  
  if (error instanceof Error) {
    // For known errors, provide more specific messages
    if (error.message.includes('permission-denied')) {
      return `${baseMessage}: Permission denied. Please check your access rights.`;
    }
    if (error.message.includes('not-found')) {
      return `${baseMessage}: The requested data was not found.`;
    }
    if (error.message.includes('network')) {
      return `${baseMessage}: Network error. Please check your connection and try again.`;
    }
    if (error.message.includes('quota-exceeded')) {
      return `${baseMessage}: Storage quota exceeded. Please contact support.`;
    }
  }
  
  return `${baseMessage}. Please try again or contact support if the problem persists.`;
}

/**
 * Context-specific error messages for different operations
 */
export const ERROR_CONTEXTS = {
  USER: 'User Management',
  SESSION: 'Session Management',
  MESSAGE: 'Message Handling',
  FEEDBACK: 'Feedback System',
  JOURNAL: 'Journal Operations',
  RECOVERY: 'Account Recovery',
  TRASH: 'Data Cleanup',
  BATCH: 'Batch Operations',
  LISTENER: 'Real-time Updates'
} as const;

export type ErrorContext = typeof ERROR_CONTEXTS[keyof typeof ERROR_CONTEXTS];
