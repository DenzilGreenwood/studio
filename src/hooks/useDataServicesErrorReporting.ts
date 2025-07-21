/**
 * Error Messages Hook with Data Services Integration
 * Version: 1.0.0
 * Date: July 21, 2025
 * 
 * Integrates the ErrorMessages component with the data services error reporting system
 */

"use client";

import { useEffect } from 'react';
import { useErrorMessages } from '@/components/ui/error-messages';
import { setErrorReporter, type ErrorReporter } from '@/lib/error-reporter';

/**
 * Hook that sets up error reporting integration with the ErrorMessages component
 * Call this in your app component to enable global error reporting
 */
export function useDataServicesErrorReporting() {
  const { messages, addMessage, dismissMessage, clearAll } = useErrorMessages();

  useEffect(() => {
    // Create the error reporter that integrates with ErrorMessages
    const reporter: ErrorReporter = {
      reportError: (message: string, context?: string) => {
        const displayMessage = context ? `${context}: ${message}` : message;
        addMessage(displayMessage, 'error');
      },
      reportWarning: (message: string, context?: string) => {
        const displayMessage = context ? `${context}: ${message}` : message;
        addMessage(displayMessage, 'warning');
      },
      reportInfo: (message: string, context?: string) => {
        const displayMessage = context ? `${context}: ${message}` : message;
        addMessage(displayMessage, 'info');
      }
    };

    // Set the global error reporter
    setErrorReporter(reporter);

    // Cleanup on unmount
    return () => {
      setErrorReporter(null);
    };
  }, [addMessage]);

  return { messages, addMessage, dismissMessage, clearAll };
}
