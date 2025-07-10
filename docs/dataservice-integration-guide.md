# DataService Integration Guide

## Overview

This guide provides practical implementation details for integrating the DataService module into the MyImaginaryFriends.ai application. For strategic architecture information, see [DataService Architecture & Integration Strategy](./dataservice-architecture-strategy.md).

The DataService module provides a centralized, secure interface for all Firestore operations, automatically handling client-side encryption/decryption and ensuring compliance with the Zero-Knowledge Encryption Framework v1.1.2.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│                     DataService Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   DataService   │  │  CryptoService  │                  │
│  │                 │  │                 │                  │
│  │ - CRUD Ops      │  │ - AES-GCM       │                  │
│  │ - Validation    │  │ - PBKDF2        │                  │
│  │ - Real-time     │  │ - XOR Memory    │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                    Firebase/Firestore                       │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. DataService (`src/dataservice/dataservice.ts`)
Main interface for encrypted Firestore operations:
- Document CRUD operations
- Collection queries with filtering
- Real-time listeners
- Batch operations
- Trash system (soft delete)

### 2. CryptoService (`src/dataservice/cryptoService.ts`)
Handles all encryption/decryption operations:
- AES-GCM encryption with 256-bit keys
- PBKDF2 key derivation (100k+ iterations)
- XOR memory protection for session storage
- Recovery key management

### 3. FirebaseService (`src/dataservice/firebaseService.ts`)
Firebase initialization and configuration:
- Auth and Firestore setup
- Environment variable configuration
- Service exports

## Quick Reference

### Related Documentation
- [DataService Architecture & Integration Strategy](./dataservice-architecture-strategy.md) - Strategic overview and architectural decisions
- [Feedback System Implementation](./feedback-system-implementation.md) - Feedback-specific implementation details
- [Zero-Knowledge Encryption Framework](./zero-knowledge-encryption-summary.md) - Security framework details

### Key Components
- **DataService Core**: `src/dataservice/dataservice.ts` - Main Firestore interface
- **CryptoService**: `src/dataservice/cryptoService.ts` - Encryption/decryption operations
- **Specialized Services**: Domain-specific services (Journal, Session, Report)
- **Firestore Rules**: `firestore.rules` - Security rules enforcement

### Quick Start
```typescript
import { createDataService } from '@/dataservice/dataservice';
import { deriveKey } from '@/dataservice/cryptoService';

// Initialize with user's encryption key
const userId = 'user123';
const encryptionKey = await deriveKey(passphrase, salt);
const dataService = createDataService(userId, encryptionKey);

// Save encrypted data
await dataService.saveDocument('journals', 'entry1', { content: 'My journal entry' });

// Retrieve and decrypt data
const result = await dataService.getDocument('journals', 'entry1');
```

## Usage Examples

### Basic Setup

```typescript
import { createDataService } from '@/dataservice/dataservice';
import { deriveKey } from '@/dataservice/cryptoService';

// Initialize DataService with user's encryption key
const userId = 'user123';
const passphrase = 'user-secret-passphrase';
const salt = new Uint8Array(32); // From user's stored salt

const encryptionKey = await deriveKey(passphrase, salt);
const dataService = createDataService(userId, encryptionKey);
```

### Document Operations

```typescript
// Save encrypted document
const journalData = {
  title: 'My Journal Entry',
  content: 'Today was a great day...',
  mood: 'happy',
  tags: ['gratitude', 'reflection']
};

const result = await dataService.saveDocument('journals', 'entry1', journalData);
if (result.success) {
  console.log('Journal saved successfully');
}

// Get and decrypt document
const journal = await dataService.getDocument('journals', 'entry1');
if (journal.success && journal.data) {
  console.log('Journal content:', journal.data.content);
}

// Update document
await dataService.updateDocument('journals', 'entry1', {
  mood: 'excited',
  updatedAt: new Date()
});

// Delete document
await dataService.deleteDocument('journals', 'entry1');
```

### Collection Queries

```typescript
// Get all journals, ordered by date
const journals = await dataService.getCollection('journals', {
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: 10
});

// Get journals with filters
const happyJournals = await dataService.getCollection('journals', {
  where: [
    { field: 'mood', operator: '==', value: 'happy' }
  ],
  orderBy: { field: 'createdAt', direction: 'desc' }
});
```

### Real-time Listeners

```typescript
// Listen to document changes
const unsubscribe = dataService.onDocumentSnapshot(
  'journals',
  'entry1',
  (data, error) => {
    if (error) {
      console.error('Error:', error);
      return;
    }
    if (data) {
      console.log('Journal updated:', data);
    }
  }
);

// Listen to collection changes
const unsubscribeCollection = dataService.onCollectionSnapshot(
  'journals',
  (journals, error) => {
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log('Journals updated:', journals);
  },
  {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 5
  }
);

// Clean up listeners
unsubscribe();
unsubscribeCollection();
```

### Specialized Services

```typescript
import { 
  JournalDataService, 
  SessionDataService, 
  ReportDataService 
} from '@/dataservice/dataservice';

// Journal operations
const journalService = new JournalDataService(userId, encryptionKey);
await journalService.saveJournalEntry('entry1', 'Journal content', { mood: 'happy' });
const entry = await journalService.getJournalEntry('entry1');

// Session operations
const sessionService = new SessionDataService(userId, encryptionKey);
await sessionService.saveSession('session1', { 
  protocol: 'cognitive-insight',
  startTime: new Date(),
  status: 'active'
});

// Report operations
const reportService = new ReportDataService(userId, encryptionKey);
await reportService.saveReport('report1', {
  insights: ['insight1', 'insight2'],
  recommendations: ['rec1', 'rec2']
}, 'weekly-summary');
```

### Batch Operations

```typescript
// Perform multiple operations atomically
const batchResult = await dataService.batchWrite([
  {
    type: 'set',
    collection: 'journals',
    docId: 'entry1',
    data: { content: 'New journal entry' }
  },
  {
    type: 'update',
    collection: 'sessions',
    docId: 'session1',
    data: { status: 'completed' }
  },
  {
    type: 'delete',
    collection: 'temp',
    docId: 'temp1'
  }
]);
```

### Trash System

```typescript
// Move document to trash (soft delete)
await dataService.moveToTrash('journals', 'entry1', 'journals');

// Restore from trash
await dataService.restoreFromTrash('entry1', 'journals');

// Get trash items
const trashItems = await dataService.getCollection('trash');
```

## Security Features

### 1. Automatic Encryption
All data is automatically encrypted before storage:

```typescript
// Input data
const data = { secret: 'sensitive information' };

// Automatically encrypted in DataService
await dataService.saveDocument('collection', 'doc1', data);

// Stored in Firestore as:
{
  encryptedData: "base64-encrypted-content",
  metadata: {
    salt: "hex-salt",
    iv: "hex-iv", 
    version: "1.1.2"
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### 2. User Ownership Validation
All operations validate user ownership:

```typescript
// Only allows paths like:
// - users/{userId}/journals/{docId}
// - users/{userId}/sessions/{sessionId}
// - etc.

// Throws error for invalid paths:
// - users/other-user/journals/doc1 ❌
// - admin/config ❌
```

### 3. Memory Protection
Sensitive data in memory is protected:

```typescript
import { SecureMemory } from '@/dataservice/cryptoService';

// Store with XOR obfuscation
SecureMemory.store('encryption-key', keyString);

// Retrieve and deobfuscate
const key = SecureMemory.retrieve('encryption-key');

// Clear sensitive data
SecureMemory.clear('encryption-key');
SecureMemory.clearAll();
```

## Error Handling

```typescript
// All operations return structured results
const result = await dataService.saveDocument('journals', 'entry1', data);

if (result.success) {
  console.log('Operation successful');
} else {
  console.error('Operation failed:', result.error);
  // Handle specific error types:
  // - Encryption/decryption errors
  // - Firestore permission errors
  // - Network errors
  // - Validation errors
}
```

## Integration with React Components

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { createDataService } from '@/dataservice/dataservice';

function JournalComponent() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [dataService, setDataService] = useState(null);

  useEffect(() => {
    if (user && user.encryptionKey) {
      const service = createDataService(user.uid, user.encryptionKey);
      setDataService(service);

      // Set up real-time listener
      const unsubscribe = service.onCollectionSnapshot(
        'journals',
        (data, error) => {
          if (error) {
            console.error('Error loading journals:', error);
            return;
          }
          setJournals(data);
        },
        {
          orderBy: { field: 'createdAt', direction: 'desc' }
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  const saveJournal = async (content) => {
    if (!dataService) return;

    const result = await dataService.saveDocument('journals', 
      crypto.randomUUID(),
      {
        content,
        createdAt: new Date(),
        mood: 'neutral'
      }
    );

    if (!result.success) {
      console.error('Failed to save journal:', result.error);
    }
  };

  return (
    <div>
      {journals.map(journal => (
        <div key={journal.id}>
          <p>{journal.content}</p>
        </div>
      ))}
      <button onClick={() => saveJournal('New entry')}>
        Add Journal
      </button>
    </div>
  );
}
```

## Performance Considerations

### 1. Encryption Overhead
- Encryption/decryption adds ~1-5ms per operation
- Use batch operations for multiple documents
- Consider pagination for large collections

### 2. Real-time Listeners
- Limit concurrent listeners (max 10-15)
- Use appropriate query limits
- Clean up listeners in component unmount

### 3. Memory Management
- Clear secure memory on logout
- Use XOR protection for session storage
- Avoid keeping large datasets in memory

## Testing

```typescript
// Mock DataService for testing
import { createDataService } from '@/dataservice/dataservice';
import { deriveKey } from '@/dataservice/cryptoService';

// Test setup
const mockUserId = 'test-user';
const mockKey = await deriveKey('test-passphrase', new Uint8Array(32));
const testDataService = createDataService(mockUserId, mockKey);

// Test operations
describe('DataService', () => {
  test('saves and retrieves document', async () => {
    const testData = { test: 'data' };
    
    const saveResult = await testDataService.saveDocument('test', 'doc1', testData);
    expect(saveResult.success).toBe(true);
    
    const getResult = await testDataService.getDocument('test', 'doc1');
    expect(getResult.success).toBe(true);
    expect(getResult.data).toEqual(testData);
  });
});
```

## Migration from Direct Firestore Usage

### Before (Direct Firestore)
```typescript
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Manual encryption required
const encrypted = await encryptData(data);
await setDoc(doc(db, 'users', userId, 'journals', docId), encrypted);
```

### After (DataService)
```typescript
import { createDataService } from '@/dataservice/dataservice';

// Automatic encryption handled
const dataService = createDataService(userId, encryptionKey);
await dataService.saveDocument('journals', docId, data);
```

## Troubleshooting

### Common Issues

1. **Encryption Key Missing**
   ```typescript
   // Ensure user has unlocked their data
   if (!user.encryptionKey) {
     // Redirect to passphrase entry
   }
   ```

2. **Permission Denied**
   ```typescript
   // Check Firestore rules and user ownership
   const result = await dataService.saveDocument('journals', docId, data);
   if (!result.success && result.error.includes('permission')) {
     // Handle permission error
   }
   ```

3. **Decryption Failed**
   ```typescript
   // Version mismatch or corrupted data
   if (result.error.includes('Decryption failed')) {
     // Handle data corruption or version incompatibility
   }
   ```

This DataService provides a robust, secure foundation for all data operations while maintaining the zero-knowledge encryption principles and ensuring seamless integration with the existing application architecture.
