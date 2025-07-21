# Signup Recovery Data Storage Fix

## Issue
The signup process was failing with the error:
```
signup failed
Failed to store recovery data
```

## Root Cause
The Firestore document path in the recovery service was incorrectly formatted:
- **Incorrect**: `doc(db, userId, "recovery", userId)` 
- This attempted to create a path like `/[userId]/recovery/[userId]` which is invalid because `userId` was being used as a collection name

## Solution
Fixed all Firestore document paths in `recoveryService.ts` to use the correct format:
- **Correct**: `doc(db, `users/${userId}/recovery/data`)`
- This creates the proper path: `/users/[userId]/recovery/data`

## Files Modified

### `src/services/recoveryService.ts`
Fixed 5 functions with incorrect Firestore paths:

1. **`storeEncryptedPassphrase`** (line 79)
   - Fixed: `await setDoc(doc(db, `users/${userId}/recovery/data`), recoveryData);`

2. **`getEncryptedPassphraseBlob`** (line 90)
   - Fixed: `const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));`

3. **`getRecoveryDataInfo`** (line 111)
   - Fixed: `const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));`

4. **`hasRecoveryData`** (line 427)
   - Fixed: `const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));`

5. **Recovery blob retrieval function** (line 295)
   - Fixed: `const snapshot = await getDoc(doc(db, `users/${uid}/recovery/data`));`

## Verification
- ✅ Firestore security rules already support the new path pattern: `/users/{userId}/recovery/{recoveryId}`
- ✅ Firebase emulators are running successfully with all functions loaded
- ✅ Next.js development server is running on http://localhost:3001
- ✅ All recovery-related functions now use consistent, correct Firestore paths

## Testing
The signup process should now work correctly:
1. User provides email, password, and passphrase
2. Firebase Authentication creates the user account
3. Recovery service successfully stores encrypted passphrase at `/users/{userId}/recovery/data`
4. User receives their recovery key for zero-knowledge recovery

## Next Steps
Test the signup flow to ensure:
1. Account creation completes successfully
2. Recovery data is stored without errors
3. Recovery key is displayed to the user
4. Login and recovery functions work with the new path structure
