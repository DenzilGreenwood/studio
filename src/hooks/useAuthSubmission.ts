
// src/hooks/useAuthSubmission.ts
"use client";

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfileDocument } from "@/context/auth-context";
import { canCreateNewUser, incrementUserCount } from "@/lib/user-limit";
import { storeEncryptedPassphrase } from "@/services/recoveryService";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEncryption } from "@/lib/encryption-context";
import { useRecoveryFlow } from "./useRecoveryFlow";
import type { LoginFormValues, SignupFormValues } from "@/lib/auth-schemas";

export function useAuthSubmission() {
  const { toast } = useToast();
  const router = useRouter();
  const { setPassphrase } = useEncryption();
  const { handleRecoveryKeySubmit } = useRecoveryFlow();

  const handleLogin = async (
    values: LoginFormValues,
    isRecoveryMode: boolean
  ): Promise<string | void> => {
    if (isRecoveryMode) {
      if (!values.recoveryKey) {
        toast({ variant: "destructive", title: "Recovery Key Required" });
        return;
      }
      if (!values.password) {
        toast({ variant: "destructive", title: "Password Required for Recovery" });
        return;
      }
      const recoveredPassphrase = await handleRecoveryKeySubmit(values.recoveryKey, values.email, values.password);
      return recoveredPassphrase;
    }

    // Regular login
    await signInWithEmailAndPassword(auth, values.email, values.password);
    await setPassphrase(values.passphrase);
    
    toast({ title: "Login Successful", description: "Redirecting..." });
    router.push("/protocol");
  };

  const handleSignup = async (
    values: SignupFormValues,
    setRecoveryKeyDialog: (dialog: { isOpen: boolean; recoveryKey: string }) => void
  ) => {
    // Validate passphrase strength
    const passphraseValidation = validatePassphrase(values.passphrase);
    if (!passphraseValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Weak Passphrase",
        description: passphraseValidation.errors.join(", ")
      });
      return;
    }

    // Check user limit
    const limitCheck = await canCreateNewUser();
    if (!limitCheck.allowed) {
      toast({
        variant: "destructive",
        title: "Registration Unavailable",
        description: limitCheck.message || "Registration is currently closed.",
      });
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const recoveryKey = await recoveryOperations.storeEncryptedPassphrase(userCredential.user.uid, values.passphrase);
    
    const pseudonymToUse = values.pseudonym ? values.pseudonym.trim() : "";

    if (pseudonymToUse) {
      await updateProfile(userCredential.user, { displayName: pseudonymToUse });
    }
    
    await setPassphrase(values.passphrase);
    await createUserProfileDocument(userCredential.user, { 
      pseudonym: pseudonymToUse
    });

    try {
      await userLimitOperations.incrementUserCount();
    } catch (countError) {
      toast({
        variant: "destructive",
        title: "User Count Update Warning",
        description: `Your account was created, but we encountered an issue. ${countError instanceof Error ? error.message : ""}`,
      });
    }

    setRecoveryKeyDialog({ isOpen: true, recoveryKey });
  };

  const handleSubmit = async (
    values: LoginFormValues | SignupFormValues,
    mode: "login" | "signup",
    isRecoveryMode: boolean,
    setRecoveryKeyDialog: (dialog: { isOpen: boolean; recoveryKey: string }) => void
  ): Promise<string | void> => {
    if (mode === "login") {
      return handleLogin(values as LoginFormValues, isRecoveryMode);
    } else {
      await handleSignup(values as SignupFormValues, setRecoveryKeyDialog);
    }
  };
  
  const handleAuthError = (error: unknown, mode: "login" | "signup") => {
    if (error instanceof Error && (error as AuthError).code) {
      const authError = error as AuthError;
      let errorMessage = "An error occurred. Please try again.";
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is not valid.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = authError.message;
          break;
      }
      
      toast({
        variant: "destructive",
        title: mode === "login" ? "Login Failed" : "Signup Failed",
        description: errorMessage,
      });
    } else if (error instanceof Error) {
        // This handles errors thrown from our custom logic, like recovery flow
        toast({
            variant: "destructive",
            title: "Operation Failed",
            description: error.message,
        });
    } else {
        toast({
          variant: "destructive",
          title: mode === "login" ? "Login Failed" : "Signup Failed",
          description: "An unexpected error occurred. Please try again later.",
        });
    }
  };

  return {
    handleSubmit,
    handleAuthError,
  };
}
