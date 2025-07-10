# Firestore Rules Alignment with Zero-Knowledge Encryption Framework v1.1.2

## Summary of Changes

The Firestore security rules have been updated to strictly enforce the Zero-Knowledge Encryption Framework v1.1.2 as outlined in the white paper. These changes ensure that all sensitive user data is properly encrypted client-side before being stored in Firestore, and that the database remains completely blind to user content.

## Key Improvements Made

### 1. Enhanced Recovery Blob Validation

**Before:**
```javascript
function isValidRecoveryBlob(data) {
  return data.keys().hasAll(['encryptedPassphrase', 'salt', 'iv', 'iterations', 'version']) &&
         data.encryptedPassphrase is string &&
         data.salt is string &&
         data.iv is string &&
         data.iterations is number &&
         data.version is string;
}
```

**After:**
```javascript
function isValidRecoveryBlob(data) {
  return data.keys().hasAll(['encryptedPassphrase', 'salt', 'iv', 'iterations', 'version']) &&
         data.encryptedPassphrase is string &&
         data.salt is string &&
         data.iv is string &&
         data.iterations is number &&
         data.iterations >= 100000 &&  // Enforce minimum PBKDF2 iterations
         data.version is string &&
         data.version == '1.1.2';       // Enforce current white paper version
}
```

### 2. Added Encrypted Data Validation

**New Helper Functions:**
- `isValidEncryptionMetadata(data)`: Validates encryption metadata structure
- `isEncryptedData(data)`: Ensures all sensitive data is properly encrypted

### 3. Mandatory Encryption for All User Data

**Before:** Simple read/write permissions
```javascript
match /users/{userId}/sessions/{sessionId} {
  allow read, write, delete: if isOwner(userId);
}
```

**After:** Enforced encryption on writes
```javascript
match /users/{userId}/sessions/{sessionId} {
  allow read, delete: if isOwner(userId);
  allow create, update: if isOwner(userId) && 
                        isEncryptedData(request.resource.data);
}
```

### 4. Enhanced Security for Root-Level Collections

Added encryption enforcement and user ownership validation for:
- Clarity Maps (`/clarityMaps/{clarityMapId}`)
- Insight Reports (`/insightReports/{insightReportId}`)

### 5. New Collections Added

**Session Keys Storage:**
```javascript
match /users/{userId}/sessionKeys/{keyId} {
  allow read, delete: if isOwner(userId);
  allow create, update: if isOwner(userId) && 
                        isEncryptedData(request.resource.data);
}
```

**Trash System with Retention Policy:**
```javascript
match /users/{userId}/trash/{itemId} {
  allow read, delete: if isOwner(userId);
  allow create, update: if isOwner(userId) && 
                        isEncryptedData(request.resource.data) &&
                        request.resource.data.keys().hasAll(['deletedAt', 'originalCollection']);
}
```

### 6. Improved Feedback System

Now requires encrypted feedback data:
```javascript
match /feedback/{feedbackId} {
  allow create: if request.auth != null &&
                isEncryptedData(request.resource.data);
  // ... other rules
}
```

## Security Architecture Compliance

### Zero-Knowledge Principles ✅

1. **Server-Side Blindness**: Firestore never sees unencrypted user data
2. **Client-Side Encryption**: All sensitive data encrypted before transmission
3. **Encryption Validation**: Rules enforce proper encryption metadata on writes
4. **Version Control**: Enforces v1.1.2 specification compliance

### Two-Phase Authentication ✅

1. **Phase 1**: Firebase Authentication provides identity verification
2. **Phase 2**: Client-side encryption unlock provides data access
3. **Recovery Support**: Encrypted recovery blobs support lost passphrase scenarios

### Cryptographic Standards ✅

1. **PBKDF2**: Minimum 100,000 iterations enforced in recovery blobs
2. **AES-GCM**: Implied by encryption metadata requirements
3. **Proper Key Management**: Session keys stored encrypted in Firestore
4. **Version Enforcement**: Only v1.1.2 compliant data accepted

## Data Structure Requirements

### Recovery Blobs
```javascript
{
  encryptedPassphrase: "base64-encoded-aes-gcm-ciphertext",
  salt: "hex-encoded-pbkdf2-salt",
  iv: "hex-encoded-aes-gcm-iv",
  iterations: 100000, // minimum required
  version: "1.1.2"    // enforced version
}
```

### Encrypted User Data
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

### Trash Items
```javascript
{
  encryptedData: "base64-encoded-aes-gcm-ciphertext",
  metadata: {
    salt: "hex-encoded-salt",
    iv: "hex-encoded-iv", 
    version: "1.1.2"
  },
  deletedAt: "2025-01-XX", // timestamp
  originalCollection: "sessions" // string
}
```

## Testing and Validation

### Automated Testing
A comprehensive validation script has been created at `scripts/validate-firestore-rules.js` that tests:
- Recovery blob validation
- Encrypted data enforcement
- Ownership verification
- Admin privilege restrictions
- Public data access rules

### Manual Testing Checklist
- [ ] All user data requires authentication
- [ ] Sensitive data enforces encryption structure
- [ ] Recovery blobs validate v1.1.2 format
- [ ] Minimum PBKDF2 iterations enforced (100,000+)
- [ ] Version fields checked for "1.1.2"
- [ ] Ownership verified for all user collections
- [ ] Admin-only operations restricted
- [ ] Feedback system prevents updates
- [ ] Trash system requires deletion metadata

## Migration Path

### For Existing Data
1. **Backup all existing data** before deploying new rules
2. **Update client-side encryption** to use v1.1.2 structure
3. **Migrate recovery blobs** to include proper version and iteration counts
4. **Add encryption metadata** to all existing encrypted documents

### For New Deployments
1. Deploy updated Firestore rules
2. Ensure client-side encryption follows v1.1.2 specification
3. Test with Firebase Local Emulator Suite
4. Validate all security scenarios

## Compliance Benefits

### Privacy Protection
- **GDPR Compliance**: Zero-knowledge architecture supports "right to be forgotten"
- **Data Minimization**: Server only stores encrypted blobs, not actual user data
- **Consent Management**: Users control their own encryption keys

### Security Hardening
- **Defense in Depth**: Multiple validation layers for data integrity
- **Version Control**: Prevents downgrade attacks to weaker encryption
- **Access Control**: Strict ownership and authentication requirements

### Audit Trail
- **Immutable Logs**: All Firestore operations logged by Firebase
- **Encryption Metadata**: Preserved for forensic analysis
- **Version Tracking**: Ensures compliance verification over time

## Next Steps

1. **Deploy Rules**: Test in Firebase Local Emulator, then deploy to production
2. **Update Client Code**: Ensure all client-side encryption follows v1.1.2
3. **Migration Script**: Create utility to upgrade existing data structures
4. **Documentation**: Update user-facing documentation about recovery keys
5. **Monitoring**: Set up alerts for rule violations or failed authentications

The updated Firestore rules now provide a robust, zero-knowledge foundation that aligns perfectly with the Privacy-First Mental Health Platform's security requirements while maintaining usability and compliance with modern privacy standards.
