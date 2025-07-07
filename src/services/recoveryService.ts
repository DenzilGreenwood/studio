// lib/recoveryService.ts
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { encryptPassphrase, decryptPassphrase, generateRecoveryKey } from "@/lib/cryptoUtils";

// Function to send recovery email (calls the email API)
async function sendPassphraseRecoveryEmail(userEmail: string, recoveredPassphrase: string): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'passphrase-recovery',
        email: userEmail,
        data: {
          passphrase: recoveredPassphrase
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to send recovery email:', error);
    }
    return false;
  }
}

// Called on user signup
export async function storeEncryptedPassphrase(userId: string, passphrase: string) {
  try {
    const recoveryKey = generateRecoveryKey();
    const encrypted = await encryptPassphrase(passphrase, recoveryKey);

    // Store encrypted passphrase with user ID
    await setDoc(doc(db, "recovery", userId), { 
      encryptedPassphrase: encrypted,
      createdAt: new Date(),
      userId: userId
    });
    
    return recoveryKey;
  } catch {
    throw new Error("Failed to store recovery data");
  }
}

// Called during "Forgot Passphrase" flow
export async function recoverPassphrase(userId: string, recoveryKey: string): Promise<string | null> {
  try {
    // Validate recovery key format (should be 64 character hex string)
    if (!recoveryKey || recoveryKey.length !== 64 || !/^[a-f0-9]+$/i.test(recoveryKey)) {
      return null;
    }

    const snapshot = await getDoc(doc(db, "recovery", userId));
    if (!snapshot.exists()) {
      return null;
    }

    const { encryptedPassphrase } = snapshot.data();
    if (!encryptedPassphrase) {
      return null;
    }

    // Attempt to decrypt the passphrase with the provided recovery key
    const decryptedPassphrase = await decryptPassphrase(encryptedPassphrase, recoveryKey);
    return decryptedPassphrase;
  } catch {
    return null;
  }
}

// Called during "Forgot Passphrase" flow with email notification
export async function recoverPassphraseWithEmail(userId: string, recoveryKey: string, userEmail: string): Promise<{ passphrase: string | null; emailSent: boolean }> {
  try {
    // First, try to recover the passphrase
    const recoveredPassphrase = await recoverPassphrase(userId, recoveryKey);
    
    if (!recoveredPassphrase) {
      return { passphrase: null, emailSent: false };
    }

    // If passphrase was recovered successfully, send email
    const emailSent = await sendPassphraseRecoveryEmail(userEmail, recoveredPassphrase);
    
    return { 
      passphrase: recoveredPassphrase, 
      emailSent 
    };
  } catch {
    return { passphrase: null, emailSent: false };
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
