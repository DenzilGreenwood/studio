# Database Functions Migration Summary

## Files Consolidated into `src/lib/data-services.ts`

The following database operations have been moved from their original files into the new consolidated `data-services.ts` file:

### 1. User Operations (from `src/lib/firestore-operations.ts`)
- `userOperations.get()` - Get user profile by ID
- `userOperations.create()` - Create new user profile
- `userOperations.update()` - Update user profile

### 2. Session Operations (from `src/lib/firestore-operations.ts` and `src/lib/session-utils.ts`)
- `sessionOperations.get()` - Get session by ID
- `sessionOperations.create()` - Create new session
- `sessionOperations.update()` - Update session
- `sessionOperations.getUserSessions()` - Get user sessions with options
- `sessionOperations.checkForActiveSession()` - Check for active session
- `sessionOperations.getCompletedSessions()` - Get completed sessions

### 3. Message Operations (from `src/lib/firestore-operations.ts`)
- `messageOperations.create()` - Create new message
- `messageOperations.getSessionMessages()` - Get session messages

### 4. Feedback Operations (from `src/lib/firestore-operations.ts` and `src/services/feedbackService.ts`)
- `feedbackOperations.create()` - Create feedback
- `feedbackOperations.getAllFeedback()` - Get all feedback
- `feedbackOperations.submitFeedback()` - Submit user feedback
- `feedbackOperations.deleteFeedback()` - Delete feedback
- `feedbackOperations.getUserFeedbackHistory()` - Get user feedback history
- `feedbackOperations.getFeedbackAnalytics()` - Get feedback analytics
- `feedbackOperations.extractCommonThemes()` - Extract themes from feedback

### 5. Journal Operations (from `src/lib/journal-operations.ts`)
- `journalOperations.create()` - Create journal entry
- `journalOperations.update()` - Update journal entry
- `journalOperations.get()` - Get journal entry by ID
- `journalOperations.getByUser()` - Get journal entries by user
- `journalOperations.delete()` - Delete journal entry

### 6. Journal Message Operations (from `src/lib/journal-operations.ts`)
- `journalMessageOperations.create()` - Create journal message
- `journalMessageOperations.getByJournal()` - Get journal messages
- `journalMessageOperations.delete()` - Delete journal message

### 7. User Limit Operations (from `src/lib/user-limit.ts`)
- `userLimitOperations.getCurrentUserCount()` - Get current user count
- `userLimitOperations.incrementUserCount()` - Increment user count
- `userLimitOperations.canCreateNewUser()` - Check if new user can be created
- `userLimitOperations.getMaxUsers()` - Get maximum users allowed

### 8. Recovery Operations (from `src/services/recoveryService.ts`)
- `recoveryOperations.storeEncryptedPassphrase()` - Store encrypted passphrase
- `recoveryOperations.getEncryptedPassphraseBlob()` - Get encrypted passphrase blob
- `recoveryOperations.findUserByEmail()` - Find user by email
- `recoveryOperations.recoverPassphraseZeroKnowledge()` - Decrypt passphrase client-side
- `recoveryOperations.hasRecoveryData()` - Check if recovery data exists

### 9. Trash Operations (from `src/lib/trash-cleanup.ts`)
- `trashOperations.cleanupOldDeletedSessions()` - Cleanup old deleted sessions
- `trashOperations.getSessionsToBeDeleted()` - Get sessions to be deleted

### 10. Batch Operations (from `src/lib/firestore-operations.ts`)
- `batchOperations.updateSessionAndUser()` - Update session and user in batch
- `batchOperations.createFeedbackAndUpdateSession()` - Create feedback and update session

### 11. Listener Operations (new consolidated real-time operations)
- `listenerOperations.onCollectionSnapshot()` - Listen to collection updates
- `listenerOperations.onDocumentSnapshot()` - Listen to document updates

## Usage Examples

### Import the consolidated data services:
```typescript
import { dataServices } from '@/lib/data-services';
// OR import specific operations:
import { userOperations, sessionOperations } from '@/lib/data-services';
```

### Use the operations:
```typescript
// Get user profile
const user = await dataServices.user.get(userId);

// Create a session
const sessionId = await dataServices.session.create(userId, sessionData);

// Get feedback analytics
const analytics = await dataServices.feedback.getFeedbackAnalytics(startDate, endDate);
```

## Migration Strategy

1. **Phase 1**: Update imports in existing files to use the new consolidated services
2. **Phase 2**: Test all functionality to ensure no regressions
3. **Phase 3**: Remove the old individual database function files
4. **Phase 4**: Update documentation and type definitions

## Files That Need Import Updates

The following files will need their imports updated to use the new consolidated data services:

- `src/app/**/*.tsx` (any React components using database functions)
- `src/hooks/**/*.ts` (custom hooks using database functions)
- `src/ai/flows/**/*.ts` (AI flow files using database functions)
- Any other files importing from the original database function files

## Benefits of Consolidation

1. **Single Source of Truth**: All database operations are in one place
2. **Better Organization**: Related operations are grouped together
3. **Easier Maintenance**: Changes can be made in one file
4. **Improved Type Safety**: Consistent type definitions across all operations
5. **Better Testing**: Easier to mock and test database operations
6. **Code Reuse**: Common patterns can be abstracted and reused

## Next Steps

1. Update imports in all consuming files
2. Run comprehensive tests
3. Remove original files once migration is complete
4. Update documentation
