// src/hooks/useRecoveryFlow.ts
"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { recoverPassphraseZeroKnowledge, findUserByEmail, hasRecoveryData } from "@/services/recoveryService";
import { useEncryption } from "@/lib/encryption-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function useRecoveryFlow() {
  const { toast } = useToast();
  const router = useRouter();
  const { setPassphrase } = useEncryption();

  const handleRecoveryKeySubmit = async (recoveryKey: string, email: string, password: string) => {
    try {
      // Step 1: Find user ID by email
      const userId = await findUserByEmail(email);
      if (!userId) {
        throw new Error("No account found with this email address.");
      }

      // Step 2: Check if recovery data exists
      const hasRecovery = await hasRecoveryData(userId);
      if (!hasRecovery) {
        throw new Error("No recovery data found for this account. This account may have been created before the recovery system was implemented.");
      }

      // Step 2: Zero-Knowledge Recovery
      const { passphrase: decryptedPassphrase, success, error } = await recoverPassphraseZeroKnowledge(uidResult.uid, recoveryKey);
      
      if (!success || !decryptedPassphrase) {
        throw new Error(error || "Invalid recovery key. Please check your recovery key and try again.");
      }

      // Step 3: Authenticate with Firebase
      if (!password) {
        throw new Error("Please enter your account password to complete recovery.");
      }

      await signInWithEmailAndPassword(auth, email, password);
      
      // Step 4: Set recovered passphrase
      await setPassphrase(decryptedPassphrase);
      
      // Step 5: Success feedback
      toast({ 
        title: "🔐 Zero-Knowledge Recovery Successful", 
        description: "Your passphrase has been recovered and is displayed below. Save it securely - it will not be sent via email.",
      });
      
      // Navigate to protocol page
      router.push("/protocol");
      
      return decryptedPassphrase;
    } catch (error) {
      let errorMessage = "Recovery failed. Please check your details and try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("No account found")) {
          errorMessage = "No account found with this email address.";
        } else if (error.message.includes("No recovery data")) {
          errorMessage = "No recovery data found. This account may have been created before the recovery system was implemented.";
        } else if (error.message.includes("Invalid recovery key")) {
          errorMessage = "Invalid recovery key. Please check your 64-character recovery key and try again.";
        } else if (error.message.includes("password")) {
          errorMessage = "Please enter your account password to complete recovery.";
        } else if (error.message.includes("auth/")) {
          // Firebase auth errors
          if (error.message.includes("auth/wrong-password")) {
            errorMessage = "Incorrect password. Please enter your account password.";
          } else if (error.message.includes("auth/user-not-found")) {
            errorMessage = "Account not found. Please check your email address.";
          } else if (error.message.includes("auth/too-many-requests")) {
            errorMessage = "Too many failed attempts. Please try again later.";
          }
        }
      }
      
      toast({ 
        variant: "destructive", 
        title: "Recovery Failed", 
        description: errorMessage
      });
      
      throw error;
    }
  };

  return {
    handleRecoveryKeySubmit,
  };
}
