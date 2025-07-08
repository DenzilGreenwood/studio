// src/hooks/useAuthSubmission.ts
"use client";

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfileDocument } from "@/context/auth-context";
import { canCreateNewUser, incrementUserCount } from "@/lib/user-limit";
import { validatePassphrase } from "@/lib/cryptoUtils";
import { storeEncryptedPassphrase } from "@/services/recoveryService";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEncryption } from "@/lib/encryption-context";
import type { LoginFormValues, SignupFormValues } from "@/lib/auth-schemas";

export function useAuthSubmission() {
  const { toast } = useToast();
  const router = useRouter();
  const { setPassphrase } = useEncryption();

  const handleLogin = async (
    values: LoginFormValues,
    isRecoveryMode: boolean,
    handleRecoveryKeySubmit: (recoveryKey: string, email: string) => Promise<void>
  ) => {
    if (isRecoveryMode) {
      await signInWithEmailAndPassword(auth, values.email, values.password);

      if (!values.recoveryKey || values.recoveryKey.trim() === '') {
        toast({
          variant: "destructive",
          title: "Recovery Key Required",
          description: "Please enter your recovery key."
        });
        return;
      }
      
      await handleRecoveryKeySubmit(values.recoveryKey, values.email);
      return;
    }

    // Regular login flow
    if (!values.passphrase) {
      toast({
        variant: "destructive",
        title: "Passphrase Required",
        description: "Please enter your passphrase to login."
      });
      return;
    }

    if (values.passphrase.length < 8) {
      toast({
        variant: "destructive",
        title: "Invalid Passphrase",
        description: "Passphrase must be at least 8 characters long."
      });
      return;
    }

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

    // Create account and store encrypted passphrase
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const recoveryKey = await storeEncryptedPassphrase(userCredential.user.uid, values.passphrase);
    
    const pseudonymToUse = values.pseudonym ? values.pseudonym.trim() : "";

    if (pseudonymToUse) {
      await updateProfile(userCredential.user, { displayName: pseudonymToUse });
    }
    
    await setPassphrase(values.passphrase);
    await createUserProfileDocument(userCredential.user, { 
      pseudonym: pseudonymToUse
    });

    // Increment user count
    try {
      await incrementUserCount();
    } catch (countError) {
      toast({
        variant: "destructive",
        title: "User Count Update Warning",
        description: `Your account was created, but we encountered an issue updating our user count. Please contact support if you notice any issues.${countError instanceof Error ? ` Error: ${countError.message}` : ""}`,
      });
    }

    // Show recovery key dialog
    setRecoveryKeyDialog({ isOpen: true, recoveryKey });
  };

  const handleAuthError = (error: unknown, mode: "login" | "signup") => {
    toast({
      variant: "destructive",
      title: mode === "login" ? "Login Failed" : "Signup Failed",
      description: "An unexpected error occurred. Please try again later.",
    });

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
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
      }
      
      toast({
        variant: "destructive",
        title: mode === "login" ? "Login Failed" : "Signup Failed",
        description: errorMessage,
      });
    }
  };

  return {
    handleLogin,
    handleSignup,
    handleAuthError,
  };
}
