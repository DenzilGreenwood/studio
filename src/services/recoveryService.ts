// lib/recoveryService.ts
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { encryptPassphrase, decryptPassphrase, generateRecoveryKey } from "@/lib/cryptoUtils";

// Called on user signup
export async function storeEncryptedPassphrase(userId: string, passphrase: string) {
  const recoveryKey = generateRecoveryKey();
  const encrypted = await encryptPassphrase(passphrase, recoveryKey);

  await setDoc(doc(db, "recovery", userId), { encryptedPassphrase: encrypted });
  return recoveryKey;
}

// Called during "Forgot Passphrase" flow
export async function recoverPassphrase(userId: string, recoveryKey: string): Promise<string | null> {
  const snapshot = await getDoc(doc(db, "recovery", userId));
  if (!snapshot.exists()) return null;

  const { encryptedPassphrase } = snapshot.data();
  try {
    return await decryptPassphrase(encryptedPassphrase, recoveryKey);
  } catch (error) {
    console.error("Failed to decrypt passphrase:", error);
    return null;
  }
}
