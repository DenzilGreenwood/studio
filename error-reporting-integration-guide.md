# Error Reporting System Integration Guide

## Overview

The console messages in `data-services.ts` have been replaced with a comprehensive error reporting system that integrates with the `ErrorMessages` component to provide user-friendly error notifications.

## Files Created/Modified

### New Files:
1. **`src/lib/error-reporter.ts`** - Core error reporting service
2. **`src/hooks/useDataServicesErrorReporting.ts`** - Hook for integration
3. **`src/components/AppWithErrorReporting.tsx`** - Example integration component

### Modified Files:
1. **`src/lib/data-services.ts`** - Replaced console statements with error reporting

## How It Works

### 1. Error Reporter Service (`error-reporter.ts`)
- Centralized error reporting system
- Provides user-friendly error messages
- Maintains console logging for development
- Supports error, warning, and info levels

### 2. Integration Hook (`useDataServicesErrorReporting.ts`)
- Connects error reporter to ErrorMessages component
- Sets up global error reporter instance
- Manages cleanup on component unmount

### 3. Data Services Integration
- All console statements replaced with `reportError()`, `reportWarning()`, or `reportInfo()`
- Context-specific error categorization
- User-friendly error message generation

## Implementation Steps

### Step 1: Add Error Reporting to Your App Component

```tsx
// In your main app component (e.g., layout.tsx or _app.tsx)
import { ErrorMessages } from '@/components/ui/error-messages';
import { useDataServicesErrorReporting } from '@/hooks/useDataServicesErrorReporting';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { messages, dismissMessage } = useDataServicesErrorReporting();

  return (
    <html>
      <body>
        {children}
        
        {/* Global error messages */}
        <ErrorMessages 
          messages={messages}
          onDismiss={dismissMessage}
          duration={5000}
        />
      </body>
    </html>
  );
}
```

### Step 2: Alternative - Use the Pre-built Wrapper Component

```tsx
// Use the provided wrapper component
import { AppWithErrorReporting } from '@/components/AppWithErrorReporting';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AppWithErrorReporting>
          {children}
        </AppWithErrorReporting>
      </body>
    </html>
  );
}
```

## Error Types and Contexts

### Error Types:
- **Error**: Critical issues that prevent operations
- **Warning**: Issues that don't prevent operations but should be noted
- **Info**: Informational messages (e.g., fallback behavior)

### Error Contexts:
- `USER`: User profile management
- `SESSION`: Session operations
- `MESSAGE`: Chat message handling
- `FEEDBACK`: Feedback system
- `JOURNAL`: Journal operations
- `RECOVERY`: Account recovery
- `TRASH`: Data cleanup
- `BATCH`: Batch operations
- `LISTENER`: Real-time updates

## User-Friendly Error Messages

The system automatically converts technical errors into user-friendly messages:

| Technical Error | User-Friendly Message |
|----------------|----------------------|
| `permission-denied` | "Permission denied. Please check your access rights." |
| `not-found` | "The requested data was not found." |
| `network` | "Network error. Please check your connection and try again." |
| `quota-exceeded` | "Storage quota exceeded. Please contact support." |

## Example Usage in Data Services

### Before:
```typescript
} catch (error) {
  console.error('Error fetching user:', error);
  throw error;
}
```

### After:
```typescript
} catch (error) {
  reportError(createUserFriendlyMessage('fetch user profile'), ERROR_CONTEXTS.USER, error);
  throw error;
}
```

## Benefits

1. **User Experience**: Users see helpful error messages instead of technical console output
2. **Consistency**: All errors use the same display system
3. **Development**: Console logging still available in development mode
4. **Categorization**: Errors are properly categorized by context
5. **Dismissible**: Users can dismiss individual error messages
6. **Auto-dismiss**: Messages automatically disappear after 5 seconds

## Testing

### To test the error reporting system:

1. **Trigger a database error** (e.g., network disconnection)
2. **Check that error appears** in the ErrorMessages component
3. **Verify console logging** in development mode
4. **Test message dismissal** by clicking the × button
5. **Test auto-dismissal** after 5 seconds

### Development Tools:

The system includes a "Clear All Messages" button in development mode for testing convenience.

## Migration Status

### ✅ Completed Replacements:
- User operations (get, create, update)
- Session operations (get, create, update, getUserSessions, checkForActiveSession, getCompletedSessions)
- Message operations (create, getSessionMessages)  
- Feedback operations (create, getAllFeedback)
- Index fallback messages converted to info level

### 🔄 Remaining Replacements Needed:
- Feedback service operations (submitFeedback, deleteFeedback, etc.)
- Journal operations
- Recovery operations
- Trash operations
- Batch operations
- Listener operations

## Next Steps

1. **Complete remaining console replacements** in data-services.ts
2. **Test thoroughly** with real error scenarios
3. **Customize error messages** based on user feedback
4. **Add error tracking** for production monitoring (optional)
5. **Extend to other parts of the application** as needed

## Customization

### Custom Error Messages:
You can customize error messages by modifying the `createUserFriendlyMessage` function in `error-reporter.ts`.

### Custom Error Types:
Add new error contexts by extending the `ERROR_CONTEXTS` object.

### Styling:
Modify the ErrorMessages component styling in `error-messages.tsx`.

This system provides a much better user experience while maintaining the debugging capabilities developers need.
