// lib/recoveryService.ts - Zero-Knowledge Encryption Implementation
// Following MyImaginaryFriends.ai Zero-Knowledge Architecture
//
// ZERO-KNOWLEDGE RECOVERY SYSTEM OVERVIEW:
// ========================================
// 1. User provides email/username -> System maps to UID
// 2. UID is used to retrieve encrypted passphrase blob from Firestore
// 3. User provides recovery key -> Client-side decryption only
// 4. Server never sees plaintext passphrases or recovery keys
// 5. All decryption happens client-side maintaining zero-knowledge
//
// RECOVERY FLOW:
// 1. findUserByEmail(email) -> returns UID
// 2. getEncryptedPassphraseBlob(uid) -> returns encrypted blob
// 3. recoverPassphraseZeroKnowledge(uid, recoveryKey) -> client-side decrypt

import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { 
  generateRecoveryKey,
  encryptDataWithMetadata, 
  decryptDataWithMetadata,
  getEncryptionBlobInfo 
} from "@/lib/encryption";

// Enhanced recovery data structure with comprehensive metadata
interface RecoveryData {
  encryptedPassphrase: string;
  createdAt: Date;
  userId: string;
  version?: string;
  lastUpdated?: Date;
  algorithm?: string;
}

// UID-based recovery result interface
export interface UIDRecoveryResult {
  uid: string | null;
  exists: boolean;
  error?: string;
}

// Enhanced recovery result interface
export interface RecoveryResult {
  passphrase: string | null;
  success: boolean;
  error?: string;
  requiresAuth?: boolean;
  metadata?: {
    version?: string;
    algorithm?: string;
    isLegacyFormat?: boolean;
    uid?: string;
  };
}

// Authentication result interface
export interface AuthRecoveryResult {
  user: User | null;
  success: boolean;
  error?: string;
}

// Called on user signup - stores encrypted passphrase blob with recovery key
export async function storeEncryptedPassphrase(userId: string, passphrase: string) {
  try {
    const recoveryKey = generateRecoveryKey();
    
    // Use unified encryption with metadata
    const encryptedBlob = await encryptDataWithMetadata(passphrase, recoveryKey);
    
    // Extract metadata for audit purposes
    const blobInfo = getEncryptionBlobInfo(encryptedBlob);
    
    const recoveryData: RecoveryData = {
      encryptedPassphrase: encryptedBlob,
      createdAt: new Date(),
      userId: userId,
      version: blobInfo.version,
      algorithm: blobInfo.algorithm
    };

    // Store encrypted passphrase blob - server never sees plaintext passphrase
    await setDoc(doc(db, `users/${userId}/recovery/data`), recoveryData);
    
    return recoveryKey;
  } catch {
    throw new Error("Failed to store recovery data");
  }
}

// Zero-Knowledge Recovery: Returns encrypted blob for client-side decryption
// REQUIRES AUTHENTICATION: Only authenticated users can access their recovery data
export async function getEncryptedPassphraseBlob(userId: string): Promise<string | null> {
  try {
    // Verify user is authenticated and accessing their own data
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Authentication required to access recovery data");
    }
    
    if (currentUser.uid !== userId) {
      throw new Error("Access denied: Cannot access another user's recovery data");
    }

    const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as RecoveryData;
    return data.encryptedPassphrase || null;
  } catch {
    return null;
  }
}

// Get recovery data metadata without decrypting
// REQUIRES AUTHENTICATION: Only authenticated users can access their recovery metadata
export async function getRecoveryDataInfo(userId: string): Promise<{
  exists: boolean;
  version?: string;
  algorithm?: string;
  createdAt?: Date;
  isLegacyFormat?: boolean;
} | null> {
  try {
    // Verify user is authenticated and accessing their own data
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Authentication required to access recovery data");
    }
    
    if (currentUser.uid !== userId) {
      throw new Error("Access denied: Cannot access another user's recovery data");
    }

    const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));
    if (!snapshot.exists()) {
      return { exists: false };
    }

    const data = snapshot.data() as RecoveryData;
    const blobInfo = getEncryptionBlobInfo(data.encryptedPassphrase);
    
    return {
      exists: true,
      version: data.version,
      algorithm: data.algorithm,
      createdAt: data.createdAt,
      isLegacyFormat: blobInfo.isLegacyFormat
    };
  } catch {
    return null;
  }
}

// AUTHENTICATED RECOVERY: Sign in with email/password to access recovery data
export async function authenticateForRecovery(email: string, password: string): Promise<AuthRecoveryResult> {
  try {
    if (!email || !password) {
      return {
        user: null,
        success: false,
        error: "Email and password are required for authentication"
      };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
    
    // Verify recovery data exists for this user
    const hasRecovery = await hasRecoveryData(userCredential.user.uid);
    if (!hasRecovery) {
      return {
        user: null,
        success: false,
        error: "No recovery data available for this account"
      };
    }

    return {
      user: userCredential.user,
      success: true
    };
  } catch (error) {
    let errorMessage = "Authentication failed";
    
    if (error instanceof Error) {
      if (error.message.includes('user-not-found')) {
        errorMessage = "No account found with this email address";
      } else if (error.message.includes('wrong-password')) {
        errorMessage = "Incorrect password";
      } else if (error.message.includes('invalid-email')) {
        errorMessage = "Invalid email format";
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = "Too many failed attempts. Please try again later";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      user: null,
      success: false,
      error: errorMessage
    };
  }
}

// Enhanced legacy function with authentication requirement
// Enhanced legacy function with authentication requirement
export async function recoverPassphrase(userId: string, recoveryKey: string): Promise<string | null> {
  try {
    // Verify user is authenticated and accessing their own data
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Authentication required to access recovery data");
    }
    
    if (currentUser.uid !== userId) {
      throw new Error("Access denied: Cannot access another user's recovery data");
    }

    // Validate recovery key format (should be 64 character hex string)
    if (!recoveryKey || recoveryKey.length !== 64 || !/^[a-f0-9]+$/i.test(recoveryKey)) {
      return null;
    }

    const encryptedBlob = await getEncryptedPassphraseBlob(userId);
    if (!encryptedBlob) {
      return null;
    }

    // Use unified decryption with automatic format detection
    return await decryptDataWithMetadata(encryptedBlob, recoveryKey);
  } catch {
    return null;
  }
}

// Zero-Knowledge Recovery - Returns decrypted passphrase for UI display only
// REQUIRES AUTHENTICATION: User must be signed in to access their recovery data
export async function recoverPassphraseZeroKnowledge(userId: string, recoveryKey: string): Promise<{
  passphrase: string | null;
  success: boolean;
  error?: string;
  requiresAuth?: boolean;
  metadata?: {
    version?: string;
    algorithm?: string;
    isLegacyFormat?: boolean;
  };
}> {
  try {
    // Check authentication first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        passphrase: null,
        success: false,
        requiresAuth: true,
        error: "Authentication required. Please sign in to access your recovery data."
      };
    }
    
    if (currentUser.uid !== userId) {
      return {
        passphrase: null,
        success: false,
        error: "Access denied: Cannot access another user's recovery data."
      };
    }

    // Validate recovery key format
    if (!recoveryKey || recoveryKey.length !== 64 || !/^[a-f0-9]+$/i.test(recoveryKey)) {
      return {
        passphrase: null,
        success: false,
        error: "Invalid recovery key format. Must be 64-character hexadecimal."
      };
    }

    // Get encrypted blob from server
    const encryptedBlob = await getEncryptedPassphraseBlob(userId);
    if (!encryptedBlob) {
      return {
        passphrase: null,
        success: false,
        error: "No recovery data found for this account."
      };
    }

    // Auto-detect format and extract metadata
    const blobInfo = getEncryptionBlobInfo(encryptedBlob);
    
    // Use unified decryption with automatic format detection
    const decryptedPassphrase = await decryptDataWithMetadata(encryptedBlob, recoveryKey);
    
    if (!decryptedPassphrase) {
      return {
        passphrase: null,
        success: false,
        error: "Invalid recovery key. Unable to decrypt passphrase.",
        metadata: {
          version: blobInfo.version,
          algorithm: blobInfo.algorithm,
          isLegacyFormat: blobInfo.isLegacyFormat
        }
      };
    }

    return {
      passphrase: decryptedPassphrase,
      success: true,
      metadata: {
        version: blobInfo.version,
        algorithm: blobInfo.algorithm,
        isLegacyFormat: blobInfo.isLegacyFormat
      }
    };
  } catch (error) {
    return {
      passphrase: null,
      success: false,
      error: error instanceof Error ? error.message : "Decryption failed. Invalid recovery key or corrupted data."
    };
  }
}

// STEP 1: Find UID by email for recovery initiation
export async function findUIDByEmail(email: string): Promise<UIDRecoveryResult> {
  try {
    if (!email || !email.includes('@')) {
      return {
        uid: null,
        exists: false,
        error: "Invalid email format"
      };
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        uid: null,
        exists: false,
        error: "No account found with this email address"
      };
    }
    
    const uid = querySnapshot.docs[0].id;
    
    // Verify recovery data exists for this UID
    const hasRecovery = await hasRecoveryData(uid);
    
    return {
      uid: uid,
      exists: hasRecovery,
      error: hasRecovery ? undefined : "No recovery data available for this account"
    };
  } catch (error) {
    return {
      uid: null,
      exists: false,
      error: error instanceof Error ? error.message : "Failed to lookup account information"
    };
  }
}

// STEP 2: Retrieve encrypted blob by UID (Zero-Knowledge) - REQUIRES AUTHENTICATION
export async function getEncryptedPassphraseBlobByUID(uid: string): Promise<{
  encryptedBlob: string | null;
  metadata?: {
    version?: string;
    algorithm?: string;
    createdAt?: Date;
  };
  error?: string;
}> {
  try {
    if (!uid) {
      return {
        encryptedBlob: null,
        error: "Invalid UID provided"
      };
    }

    // Verify user is authenticated and accessing their own data
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        encryptedBlob: null,
        error: "Authentication required to access recovery data"
      };
    }
    
    if (currentUser.uid !== uid) {
      return {
        encryptedBlob: null,
        error: "Access denied: Cannot access another user's recovery data"
      };
    }

    const snapshot = await getDoc(doc(db, `users/${uid}/recovery/data`));
    if (!snapshot.exists()) {
      return {
        encryptedBlob: null,
        error: "No recovery data found for this account"
      };
    }

    const data = snapshot.data() as RecoveryData;
    const blobInfo = getEncryptionBlobInfo(data.encryptedPassphrase);
    
    return {
      encryptedBlob: data.encryptedPassphrase,
      metadata: {
        version: data.version || blobInfo.version,
        algorithm: data.algorithm || blobInfo.algorithm,
        createdAt: data.createdAt
      }
    };
  } catch (error) {
    return {
      encryptedBlob: null,
      error: error instanceof Error ? error.message : "Failed to retrieve recovery data"
    };
  }
}

// STEP 3: Complete Zero-Knowledge Recovery with UID - REQUIRES AUTHENTICATION
export async function performZeroKnowledgeRecovery(uid: string, recoveryKey: string): Promise<RecoveryResult> {
  try {
    // Validate inputs
    if (!uid) {
      return {
        passphrase: null,
        success: false,
        error: "Invalid UID provided"
      };
    }

    // Check authentication first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        passphrase: null,
        success: false,
        requiresAuth: true,
        error: "Authentication required to access recovery data"
      };
    }
    
    if (currentUser.uid !== uid) {
      return {
        passphrase: null,
        success: false,
        error: "Access denied: Cannot access another user's recovery data"
      };
    }

    if (!recoveryKey || recoveryKey.length !== 64 || !/^[a-f0-9]+$/i.test(recoveryKey)) {
      return {
        passphrase: null,
        success: false,
        error: "Invalid recovery key format. Must be 64-character hexadecimal."
      };
    }

    // Get encrypted blob
    const blobResult = await getEncryptedPassphraseBlobByUID(uid);
    if (!blobResult.encryptedBlob) {
      return {
        passphrase: null,
        success: false,
        error: blobResult.error || "No recovery data found"
      };
    }

    // Auto-detect format and extract metadata
    const blobInfo = getEncryptionBlobInfo(blobResult.encryptedBlob);
    
    // Use unified decryption with automatic format detection
    const decryptedPassphrase = await decryptDataWithMetadata(blobResult.encryptedBlob, recoveryKey);
    
    if (!decryptedPassphrase) {
      return {
        passphrase: null,
        success: false,
        error: "Invalid recovery key. Unable to decrypt passphrase.",
        metadata: {
          version: blobInfo.version,
          algorithm: blobInfo.algorithm,
          isLegacyFormat: blobInfo.isLegacyFormat,
          uid: uid
        }
      };
    }

    return {
      passphrase: decryptedPassphrase,
      success: true,
      metadata: {
        version: blobInfo.version,
        algorithm: blobInfo.algorithm,
        isLegacyFormat: blobInfo.isLegacyFormat,
        uid: uid
      }
    };
  } catch (error) {
    return {
      passphrase: null,
      success: false,
      error: error instanceof Error ? error.message : "Decryption failed. Invalid recovery key or corrupted data.",
      metadata: {
        uid: uid
      }
    };
  }
}

// UNIFIED AUTHENTICATED RECOVERY FLOW: Email + Password + Recovery Key
export async function recoverPassphraseWithAuthentication(
  email: string, 
  password: string, 
  recoveryKey: string
): Promise<RecoveryResult> {
  try {
    // Step 1: Authenticate user with email/password
    const authResult = await authenticateForRecovery(email, password);
    if (!authResult.success) {
      return {
        passphrase: null,
        success: false,
        requiresAuth: true,
        error: authResult.error || "Authentication failed"
      };
    }

    if (!authResult.user) {
      return {
        passphrase: null,
        success: false,
        requiresAuth: true,
        error: "Authentication failed - no user returned"
      };
    }

    // Step 2: Perform zero-knowledge recovery with authenticated user
    return await performZeroKnowledgeRecovery(authResult.user.uid, recoveryKey);
  } catch (error) {
    return {
      passphrase: null,
      success: false,
      error: error instanceof Error ? error.message : "Recovery failed"
    };
  }
}

// UNIFIED RECOVERY FLOW: Email -> UID -> Recovery (DEPRECATED - Use authenticated version)
export async function recoverPassphraseByEmail(email: string, recoveryKey: string): Promise<RecoveryResult> {
  try {
    // Step 1: Find UID by email
    const uidResult = await findUIDByEmail(email);
    if (!uidResult.uid) {
      return {
        passphrase: null,
        success: false,
        error: uidResult.error || "Account not found"
      };
    }

    // Step 2: Perform zero-knowledge recovery with UID
    return await performZeroKnowledgeRecovery(uidResult.uid, recoveryKey);
  } catch (error) {
    return {
      passphrase: null,
      success: false,
      error: error instanceof Error ? error.message : "Recovery failed"
    };
  }
}

// Check if recovery data exists for a user - REQUIRES AUTHENTICATION
export async function hasRecoveryData(userId: string): Promise<boolean> {
  try {
    // Verify user is authenticated and accessing their own data
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }
    
    if (currentUser.uid !== userId) {
      return false;
    }

    const snapshot = await getDoc(doc(db, `users/${userId}/recovery/data`));
    return snapshot.exists() && snapshot.data()?.encryptedPassphrase;
  } catch {
    return false;
  }
}
