# Zero-Knowledge Recovery System with UID Management

## Overview

This document describes the enhanced Zero-Knowledge Recovery System that uses UID-based lookups to retrieve recovery keys while maintaining complete client-side encryption.

## Architecture Principles

### Zero-Knowledge Guarantee
- **Server never sees plaintext passphrases or recovery keys**
- **All encryption/decryption happens client-side**
- **Server only stores encrypted blobs and metadata**
- **UID lookup is the only server-side operation**

## Recovery Flow

### Step 1: Email to UID Mapping
```typescript
const uidResult = await findUIDByEmail(email);
// Returns: { uid: string | null, exists: boolean, error?: string }
```

**Purpose**: Convert email address to Firebase UID for data retrieval
**Security**: Email lookup only, no sensitive data exposed

### Step 2: Encrypted Blob Retrieval
```typescript
const blobResult = await getEncryptedPassphraseBlobByUID(uid);
// Returns: { encryptedBlob: string | null, metadata?: object, error?: string }
```

**Purpose**: Retrieve encrypted passphrase blob using UID
**Security**: Only encrypted data returned, server cannot decrypt

### Step 3: Client-Side Decryption
```typescript
const recovery = await performZeroKnowledgeRecovery(uid, recoveryKey);
// Returns: { passphrase: string | null, success: boolean, metadata?: object }
```

**Purpose**: Decrypt passphrase using recovery key (client-side only)
**Security**: Decryption happens entirely in browser/client

## API Functions

### Core Recovery Functions

#### `findUIDByEmail(email: string)`
- **Input**: Email address
- **Output**: UID and existence status
- **Security**: Email-to-UID mapping only
- **Use Case**: Recovery flow initiation

#### `getEncryptedPassphraseBlobByUID(uid: string)`
- **Input**: Firebase UID
- **Output**: Encrypted blob and metadata
- **Security**: Returns encrypted data only
- **Use Case**: Data retrieval for decryption

#### `performZeroKnowledgeRecovery(uid: string, recoveryKey: string)`
- **Input**: UID and recovery key
- **Output**: Decrypted passphrase (client-side)
- **Security**: All decryption client-side
- **Use Case**: Complete recovery process

### Unified Recovery Function

#### `recoverPassphraseByEmail(email: string, recoveryKey: string)`
- **Input**: Email and recovery key
- **Output**: Complete recovery result
- **Security**: Combines all steps with zero-knowledge guarantee
- **Use Case**: Single-call recovery for UI

## Data Flow Diagram

```
User Input (Email + Recovery Key)
          ↓
    findUIDByEmail()
          ↓
    UID Retrieved
          ↓
getEncryptedPassphraseBlobByUID()
          ↓
    Encrypted Blob Retrieved
          ↓
performZeroKnowledgeRecovery() ← CLIENT-SIDE ONLY
          ↓
    Plaintext Passphrase
```

## Security Features

### Encryption Formats
- **Legacy Format**: Backward compatibility with older encryptions
- **Enhanced Format**: New format with comprehensive metadata
- **Auto-Detection**: Automatically detects and handles both formats

### Validation
- **Recovery Key Format**: 64-character hexadecimal validation
- **Email Format**: Basic email validation
- **UID Validation**: Firebase UID format checking

### Error Handling
- **Descriptive Errors**: Clear error messages for debugging
- **Security**: No sensitive information in error messages
- **Metadata**: Optional metadata for troubleshooting

## Implementation Example

```typescript
// Complete recovery flow
async function handleRecovery(email: string, recoveryKey: string) {
  try {
    const result = await recoverPassphraseByEmail(email, recoveryKey);
    
    if (result.success) {
      console.log('Recovery successful');
      console.log('Passphrase:', result.passphrase);
      console.log('Metadata:', result.metadata);
    } else {
      console.error('Recovery failed:', result.error);
    }
  } catch (error) {
    console.error('Recovery error:', error);
  }
}
```

## Database Schema

### Recovery Collection (`/recovery/{uid}`)
```typescript
interface RecoveryData {
  encryptedPassphrase: string;  // Encrypted blob
  createdAt: Date;             // Creation timestamp
  userId: string;              // Firebase UID
  version?: string;            // Encryption version
  lastUpdated?: Date;          // Last update timestamp
  algorithm?: string;          // Encryption algorithm
}
```

### Users Collection (`/users/{uid}`)
```typescript
interface UserData {
  email: string;               // For UID lookup
  // ... other user data
}
```

## Zero-Knowledge Compliance

### What Server Knows
- ✅ Email addresses (for UID mapping)
- ✅ Encrypted passphrase blobs
- ✅ Metadata (versions, timestamps)
- ✅ Firebase UIDs

### What Server Never Knows
- ❌ Plaintext passphrases
- ❌ Recovery keys
- ❌ Decrypted data
- ❌ User's actual passwords/keys

## Testing and Validation

### Test Scenarios
1. **Valid Recovery**: Email exists, recovery key correct
2. **Invalid Email**: Email not found in system
3. **Invalid Recovery Key**: Wrong format or incorrect key
4. **No Recovery Data**: User exists but no recovery setup
5. **Legacy Format**: Backward compatibility testing
6. **Enhanced Format**: New encryption format testing

### Security Testing
1. **Server Log Review**: Ensure no plaintext in logs
2. **Network Traffic**: Verify only encrypted data transmitted
3. **Client-Side Only**: Confirm decryption happens client-side
4. **Error Messages**: No sensitive data in error responses

## Migration Notes

### Backward Compatibility
- **Legacy Support**: Maintains support for old encryption format
- **Auto-Detection**: Automatically detects format and handles appropriately
- **Gradual Migration**: Users automatically upgraded on next recovery key generation

### Future Enhancements
- **Multi-Factor Recovery**: Additional recovery methods
- **Key Rotation**: Recovery key rotation capabilities
- **Audit Logging**: Enhanced audit trails (without sensitive data)
