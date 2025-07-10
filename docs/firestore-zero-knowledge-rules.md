# Firestore Rules - Zero-Knowledge Encryption Framework v1.1.2

## Overview

This document explains the updated Firestore security rules that enforce the Zero-Knowledge Encryption Framework v1.1.2 as outlined in the white paper. These rules ensure that all sensitive user data is properly encrypted client-side before being stored in Firestore.

## Key Security Principles

### 1. Zero-Knowledge Architecture
- **Server-Side Blind**: Firestore never sees unencrypted user data
- **Client-Side Encryption**: All sensitive data encrypted before transmission
- **Encryption Validation**: Rules enforce proper encryption metadata on writes

### 2. Two-Phase Authentication Workflow
- **Phase 1**: Firebase Authentication (identity verification)
- **Phase 2**: Client-side encryption unlock (data access)
- Recovery system supports lost passphrase scenarios

### 3. Mandatory Encryption Standards
- **PBKDF2**: Minimum 100,000 iterations for key derivation
- **AES-GCM**: Authenticated encryption for all user data
- **Version Control**: Enforces v1.1.2 specification compliance

## Rule Structure

### Helper Functions

#### `isOwner(userId)`
Validates that the authenticated user owns the resource being accessed.

#### `isValidRecoveryBlob(data)`
Enforces recovery blob structure per v1.1.2:
- `encryptedPassphrase`: AES-GCM encrypted user passphrase
- `salt`: Cryptographically secure random salt
- `iv`: Initialization vector for AES-GCM
- `iterations`: PBKDF2 iterations (minimum 100,000)
- `version`: Must be "1.1.2"

#### `isValidEncryptionMetadata(data)`
Validates encryption metadata for user data:
- `salt`: Encryption salt
- `iv`: Initialization vector
- `version`: Must be "1.1.2"

#### `isEncryptedData(data)`
Ensures all sensitive data contains:
- `encryptedData`: AES-GCM encrypted payload
- `metadata`: Valid encryption metadata

## Collection Rules

### User Collections (Sub-collections under `/users/{userId}/`)

#### Recovery System (`/users/{userId}/recovery/{recoveryId}`)
- **Purpose**: Store encrypted passphrase recovery blobs
- **Security**: Validates recovery blob structure on create/update
- **Access**: Owner only (read/write/delete)

#### Sessions (`/users/{userId}/sessions/{sessionId}`)
- **Purpose**: Encrypted conversation and protocol data
- **Security**: Enforces encrypted data structure on create/update
- **Access**: Owner only

#### Session Reports (`/users/{userId}/sessionReports/{sessionReportId}`)
- **Purpose**: Encrypted analysis and insights
- **Security**: Enforces encrypted data structure
- **Access**: Owner only

#### Journals (`/users/{userId}/journals/{journalId}`)
- **Purpose**: Encrypted personal reflections and entries
- **Security**: Enforces encrypted data structure
- **Access**: Owner only

#### Journal Messages (`/users/{userId}/journals/{journalId}/messages/{messageId}`)
- **Purpose**: Encrypted journal conversation threads
- **Security**: Enforces encrypted data structure
- **Access**: Owner only

#### Session Messages (`/users/{userId}/sessions/{sessionId}/messages/{messageId}`)
- **Purpose**: Encrypted chat messages within sessions
- **Security**: Enforces encrypted data structure
- **Access**: Owner only

#### Clean Reports (`/users/{userId}/clean-reports/{reportId}`)
- **Purpose**: Encrypted processed session summaries
- **Security**: Enforces encrypted data structure
- **Access**: Owner only

#### Session Keys (`/users/{userId}/sessionKeys/{keyId}`)
- **Purpose**: Encrypted session key storage for XOR operations
- **Security**: Enforces encrypted data structure
- **Access**: Owner only

#### Trash System (`/users/{userId}/trash/{itemId}`)
- **Purpose**: Encrypted deleted items with retention policy
- **Security**: Enforces encrypted data + deletion metadata
- **Required Fields**: `deletedAt` (timestamp), `originalCollection` (string)
- **Access**: Owner only

### Root-Level Collections

#### Clarity Maps (`/clarityMaps/{clarityMapId}`)
- **Purpose**: Encrypted visual thought mapping
- **Security**: Enforces encrypted data + userId ownership
- **Access**: Owner only (verified via userId field)

#### Insight Reports (`/insightReports/{insightReportId}`)
- **Purpose**: Encrypted analysis reports
- **Security**: Enforces encrypted data + userId ownership
- **Access**: Owner only (verified via userId field)

#### Feedback (`/feedback/{feedbackId}`)
- **Purpose**: Anonymous encrypted feedback
- **Security**: Enforces encrypted data structure
- **Access**: Create (authenticated users), Delete (owner), Read (admin only)
- **Immutability**: Updates forbidden once created

### System Collections

#### User Count (`/system/userCount`)
- **Purpose**: Public user statistics for signup validation
- **Security**: Public read, unrestricted write (for server operations)
- **Access**: Public read, server write

#### Encryption Config (`/system/encryptionConfig`)
- **Purpose**: Public encryption configuration and version info
- **Security**: Public read, admin-only write
- **Access**: Public read, admin write

## Security Features

### 1. Encryption Enforcement
Every sensitive data write operation must include:
```javascript
{
  encryptedData: "base64-encoded-aes-gcm-ciphertext",
  metadata: {
    salt: "hex-encoded-salt",
    iv: "hex-encoded-iv", 
    version: "1.1.2"
  }
}
```

### 2. Recovery Blob Validation
Recovery system enforces strict structure:
```javascript
{
  encryptedPassphrase: "aes-gcm-encrypted-passphrase",
  salt: "pbkdf2-salt",
  iv: "aes-gcm-iv",
  iterations: 100000, // minimum
  version: "1.1.2"
}
```

### 3. Version Control
All encryption operations must use v1.1.2 specification to ensure:
- Compatible encryption algorithms
- Secure iteration counts
- Proper metadata structure

### 4. Ownership Verification
Multiple layers of ownership verification:
- Firebase Auth UID matching
- Resource-level userId validation
- Sub-collection path enforcement

## Migration Considerations

### From Previous Versions
1. **Backup existing data** before rule deployment
2. **Update client encryption code** to match v1.1.2 structure
3. **Migrate recovery blobs** to include version field
4. **Add encryption metadata** to existing encrypted documents

### Testing
1. Test with non-admin users to ensure access restrictions
2. Verify encryption validation with malformed data
3. Test recovery blob creation/validation
4. Validate cross-collection access restrictions

## Compliance Notes

### GDPR/Privacy
- Zero-knowledge architecture supports "right to be forgotten"
- Encrypted data provides additional privacy protection
- Server cannot access user content for processing

### Data Retention
- Trash system provides 30-day retention before permanent deletion
- Recovery blobs stored indefinitely (user-controlled)
- Session keys deleted when sessions expire

### Audit Trail
- All Firestore operations logged by Firebase
- Encryption metadata preserved for forensic analysis
- Version tracking ensures compliance verification
