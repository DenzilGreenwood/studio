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

import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  decryptPassphrase, 
  generateRecoveryKey 
} from "@/lib/cryptoUtils";
import { 
  encryptPassphraseWithRecoveryKeyAndMetadata, 
  decryptPassphraseWithRecoveryKeyAndMetadata,
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
  metadata?: {
    version?: string;
    algorithm?: string;
    isLegacyFormat?: boolean;
    uid?: string;
  };
}

// Called on user signup - stores encrypted passphrase blob with recovery key
export async function storeEncryptedPassphrase(userId: string, passphrase: string) {
  try {
    const recoveryKey = generateRecoveryKey();
    
    // Use enhanced encryption with comprehensive metadata
    const encryptedBlob = await encryptPassphraseWithRecoveryKeyAndMetadata(passphrase, recoveryKey);
    
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
    await setDoc(doc(db, userId, "recovery", userId), recoveryData);
    
    return recoveryKey;
  } catch {
    throw new Error("Failed to store recovery data");
  }
}

// Zero-Knowledge Recovery: Returns encrypted blob for client-side decryption
export async function getEncryptedPassphraseBlob(userId: string): Promise<string | null> {
  try {
    const snapshot = await getDoc(doc(db, userId, "recovery", userId));
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
export async function getRecoveryDataInfo(userId: string): Promise<{
  exists: boolean;
  version?: string;
  algorithm?: string;
  createdAt?: Date;
  isLegacyFormat?: boolean;
} | null> {
  try {
    const snapshot = await getDoc(doc(db, userId, "recovery", userId));
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

// Enhanced legacy function with automatic format detection
export async function recoverPassphrase(userId: string, recoveryKey: string): Promise<string | null> {
  try {
    // Validate recovery key format (should be 64 character hex string)
    if (!recoveryKey || recoveryKey.length !== 64 || !/^[a-f0-9]+$/i.test(recoveryKey)) {
      return null;
    }

    const encryptedBlob = await getEncryptedPassphraseBlob(userId);
    if (!encryptedBlob) {
      return null;
    }

    // Auto-detect format and decrypt accordingly
    const blobInfo = getEncryptionBlobInfo(encryptedBlob);
    
    if (blobInfo.isLegacyFormat) {
      // Use legacy decryption for backward compatibility
      return await decryptPassphrase(encryptedBlob, recoveryKey);
    } else {
      // Use enhanced decryption for new format
      return await decryptPassphraseWithRecoveryKeyAndMetadata(encryptedBlob, recoveryKey);
    }
  } catch {
    return null;
  }
}

// Zero-Knowledge Recovery - Returns decrypted passphrase for UI display only
// Enhanced with automatic format detection and improved error messages
export async function recoverPassphraseZeroKnowledge(userId: string, recoveryKey: string): Promise<{
  passphrase: string | null;
  success: boolean;
  error?: string;
  metadata?: {
    version?: string;
    algorithm?: string;
    isLegacyFormat?: boolean;
  };
}> {
  try {
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
    
    let decryptedPassphrase: string;
    
    if (blobInfo.isLegacyFormat) {
      // Use legacy decryption for backward compatibility
      decryptedPassphrase = await decryptPassphrase(encryptedBlob, recoveryKey);
    } else {
      // Use enhanced decryption for new format
      decryptedPassphrase = await decryptPassphraseWithRecoveryKeyAndMetadata(encryptedBlob, recoveryKey);
    }
    
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

// STEP 2: Retrieve encrypted blob by UID (Zero-Knowledge)
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

    const snapshot = await getDoc(doc(db, uid, "recovery", uid));
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

// STEP 3: Complete Zero-Knowledge Recovery with UID
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
    
    let decryptedPassphrase: string;
    
    // Perform client-side decryption based on format
    if (blobInfo.isLegacyFormat) {
      decryptedPassphrase = await decryptPassphrase(blobResult.encryptedBlob, recoveryKey);
    } else {
      decryptedPassphrase = await decryptPassphraseWithRecoveryKeyAndMetadata(blobResult.encryptedBlob, recoveryKey);
    }
    
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

// UNIFIED RECOVERY FLOW: Email -> UID -> Recovery
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

// Check if recovery data exists for a user
export async function hasRecoveryData(userId: string): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, userId,"recovery", userId));
    return snapshot.exists() && snapshot.data()?.encryptedPassphrase;
  } catch {
    return false;
  }
}
