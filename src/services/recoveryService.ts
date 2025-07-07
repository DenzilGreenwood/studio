// lib/recoveryService.ts - Zero-Knowledge Encryption Implementation
// Following MyImaginaryFriends.ai Zero-Knowledge Architecture
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
    await setDoc(doc(db, "recovery", userId), recoveryData);
    
    return recoveryKey;
  } catch {
    throw new Error("Failed to store recovery data");
  }
}

// Zero-Knowledge Recovery: Returns encrypted blob for client-side decryption
export async function getEncryptedPassphraseBlob(userId: string): Promise<string | null> {
  try {
    const snapshot = await getDoc(doc(db, "recovery", userId));
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
    const snapshot = await getDoc(doc(db, "recovery", userId));
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

// Find user ID by email (for recovery flow)
export async function findUserByEmail(email: string): Promise<string | null> {
  try {
    // Query users collection to find user by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching user ID
    return querySnapshot.docs[0].id;
  } catch {
    return null;
  }
}

// Check if recovery data exists for a user
export async function hasRecoveryData(userId: string): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, "recovery", userId));
    return snapshot.exists() && snapshot.data()?.encryptedPassphrase;
  } catch {
    return false;
  }
}
