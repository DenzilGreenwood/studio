# Session Trash System Documentation

## Overview

The session trash system provides a soft delete functionality that allows users to safely delete sessions while maintaining the ability to recover them within a 30-day period.

## Features

### 1. Soft Delete
- Sessions are not immediately deleted when the user clicks "delete"
- Instead, they are marked with `isDeleted: true` and moved to the trash
- Sessions remain accessible for recovery for 30 days

### 2. Trash Management
- Dedicated trash page at `/trash` shows all deleted sessions
- Users can restore sessions from trash
- Users can permanently delete sessions from trash
- Bulk "Empty Trash" operation to delete all sessions in trash

### 3. Data Structure

The `ProtocolSession` interface has been extended with the following fields:

```typescript
export interface ProtocolSession {
  // ... existing fields ...
  
  // Trash/deletion tracking
  isDeleted?: boolean;           // Marks session as deleted
  deletedAt?: Timestamp | Date;  // When session was deleted
  deletedBy?: string;            // userId who deleted it
}
```

### 4. User Interface

#### Sessions Page (`/sessions`)
- Each session card now has a trash button (🗑️) 
- Clicking the trash button shows a confirmation dialog
- Sessions are filtered to exclude deleted ones (`isDeleted != true`)
- Header includes a "Trash" button to access the trash page

#### Trash Page (`/trash`)
- Shows all deleted sessions in reverse chronological order
- Each session shows deletion date and time
- Two actions per session:
  - **Restore**: Moves session back to active sessions
  - **Delete Permanently**: Permanently removes session (cannot be undone)
- **Empty Trash** button to permanently delete all sessions in trash

### 5. Database Operations

#### Soft Delete (Move to Trash)
```typescript
await updateDoc(sessionRef, {
  isDeleted: true,
  deletedAt: serverTimestamp(),
  deletedBy: firebaseUser.uid
});
```

#### Restore from Trash
```typescript
await updateDoc(sessionRef, {
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  restoredAt: serverTimestamp(),
  restoredBy: firebaseUser.uid
});
```

#### Permanent Delete
```typescript
await deleteDoc(sessionRef);
```

### 6. Security Rules

The existing Firestore security rules support the trash functionality:

```javascript
match /users/{userId}/sessions/{sessionId} {
  allow read, write, delete: if isOwner(userId);
  allow read: if isAdmin();
}
```

### 7. Database Indexes

New composite indexes have been added to support efficient querying:

```json
{
  "fields": [
    { "fieldPath": "isDeleted", "order": "ASCENDING" },
    { "fieldPath": "startTime", "order": "DESCENDING" }
  ]
},
{
  "fields": [
    { "fieldPath": "isDeleted", "order": "ASCENDING" },
    { "fieldPath": "deletedAt", "order": "DESCENDING" }
  ]
}
```

### 8. Cleanup Utilities

The system includes utilities for automatic cleanup:

#### `cleanupOldDeletedSessions(userId: string)`
- Permanently deletes sessions that have been in trash for more than 30 days
- Should be called periodically via cron job or cloud function

#### `getSessionsToBeDeleted(userId: string)`
- Returns sessions that will be automatically deleted within 7 days
- Can be used to warn users about upcoming permanent deletion

### 9. Implementation Files

- `/src/types/index.ts` - Extended ProtocolSession interface
- `/src/app/(app)/sessions/page.tsx` - Updated sessions page with delete functionality
- `/src/app/(app)/trash/page.tsx` - New trash page component
- `/src/lib/trash-cleanup.ts` - Utility functions for cleanup
- `firestore.indexes.json` - Database indexes for efficient querying

### 10. User Experience Flow

1. **Delete Session**: User clicks trash button → Confirmation dialog → Session moved to trash
2. **View Trash**: User clicks "Trash" button on sessions page → See all deleted sessions
3. **Restore Session**: User clicks "Restore" on session in trash → Session restored to active sessions
4. **Permanent Delete**: User clicks "Delete Permanently" → Confirmation dialog → Session permanently removed
5. **Empty Trash**: User clicks "Empty Trash" → Confirmation dialog → All sessions in trash permanently deleted

### 11. Benefits

- **Safety**: Prevents accidental permanent deletion of valuable session data
- **User Control**: Users have full control over what gets permanently deleted and when
- **Recovery**: 30-day window allows for recovery of mistakenly deleted sessions
- **Storage Management**: Automatic cleanup after 30 days prevents storage bloat
- **Clear UI**: Visual indicators and clear actions help users understand the system

### 12. Future Enhancements

- Email notifications before automatic permanent deletion
- Admin dashboard to monitor trash usage across users
- Bulk operations (select multiple sessions for restore/delete)
- Export functionality for sessions before permanent deletion
- Configurable retention period (different users might want different timeframes)
