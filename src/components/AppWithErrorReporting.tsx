/**
 * Example App Component Integration
 * Shows how to integrate the ErrorMessages component with data services error reporting
 */

"use client";

import React from 'react';
import { ErrorMessages } from '@/components/ui/error-messages';
import { useDataServicesErrorReporting } from '@/hooks/useDataServicesErrorReporting';

export function AppWithErrorReporting({ children }: { children: React.ReactNode }) {
  // This hook sets up the integration between data services and error messages
  const { messages, dismissMessage, clearAll } = useDataServicesErrorReporting();

  return (
    <>
      {children}
      
      {/* Global error messages display */}
      <ErrorMessages 
        messages={messages}
        onDismiss={dismissMessage}
        duration={5000}
      />
      
      {/* Optional: Add a clear all button for debugging */}
      {process.env.NODE_ENV === 'development' && messages.length > 0 && (
        <button
          onClick={clearAll}
          className="fixed bottom-4 right-4 bg-gray-600 text-white px-4 py-2 rounded z-50"
        >
          Clear All Messages
        </button>
      )}
    </>
  );
}

/**
 * Alternative: Use the hook in your existing layout/app component
 */
export function useAppErrorReporting() {
  return useDataServicesErrorReporting();
}
