// src/components/auth/authComponents/AuthFormLogic.tsx
"use client";

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context-v2";
import { useAuthSubmission } from "@/hooks/useAuthSubmission";
import { findUIDByEmail, hasRecoveryData, recoverPassphraseZeroKnowledge, storeEncryptedPassphrase } from "@/services/recoveryService";
import { canCreateNewUser, incrementUserCount } from "@/lib/user-limit";
import { createUserProfileDocument } from "@/context/auth-context";
import { validatePassphrase } from "@/lib/encryption";
import type { LoginFormValues, SignupFormValues } from "@/lib/auth-schemas";
import { UseFormReturn } from "react-hook-form";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface AuthFormLogicProps {
  mode: "login" | "signup";
  form: UseFormReturn<LoginFormValues | SignupFormValues>;
  isRecoveryMode: boolean;
  setRecoveredPassphrase: (passphrase: string) => void;
  setRecoveryKeyDialog: (dialog: { isOpen: boolean; recoveryKey: string }) => void;
  router: AppRouterInstance;
}

export function useAuthFormLogic({
  mode,
  form,
  isRecoveryMode,
  setRecoveredPassphrase,
  setRecoveryKeyDialog,
  router
}: AuthFormLogicProps) {
  const { toast } = useToast();
  const { initializeDataService } = useAuth();
  const { handleAuthError } = useAuthSubmission();

  const handleRecoveryKeySubmit = async (recoveryKey: string, email: string) => {
    try {
      // Step 1: Find user ID by email without requiring password
      const uidResult = await findUIDByEmail(email);
      if (!uidResult.uid || !uidResult.exists) {
        throw new Error(uidResult.error || "No account found with this email address.");
      }

      // Step 2: Check if recovery data exists for this user
      const hasRecovery = await hasRecoveryData(uidResult.uid);
      if (!hasRecovery) {
        throw new Error("No recovery data found for this account. This account may have been created before the recovery system was implemented.");
      }

      // Step 3: Zero-Knowledge Recovery - decrypt passphrase client-side
      const { passphrase: decryptedPassphrase, success, error } = await recoverPassphraseZeroKnowledge(uidResult.uid, recoveryKey);
      
      if (!success || !decryptedPassphrase) {
        throw new Error(error || "Invalid recovery key. Please check your recovery key and try again.");
      }

      // Step 4: Authenticate with Firebase using account password
      const password = form.getValues('password');
      if (!password) {
        throw new Error("Please enter your account password to complete recovery.");
      }

      await signInWithEmailAndPassword(auth, email, password);
      
      // Step 5: Initialize DataService with the recovered passphrase
      await initializeDataService(decryptedPassphrase);
      setRecoveredPassphrase(decryptedPassphrase);
      
      // Step 6: Zero-Knowledge Success - passphrase shown in UI only (never emailed)
      toast({ 
        title: "🔐 Zero-Knowledge Recovery Successful", 
        description: "Your passphrase has been recovered and is displayed below. Save it securely - it will not be sent via email.",
      });
      
      // Navigate to protocol page after successful recovery
      router.push("/protocol");
    } catch (error) {
      let errorMessage = "Recovery failed. Please check your details and try again.";
      
      if (error instanceof Error) {
        // Provide more specific error messages
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
    }
  };

  const onSubmit = async (values: LoginFormValues | SignupFormValues) => {
    form.clearErrors();
    try {
      if (mode === "login") {
        const loginValues = values as LoginFormValues;
        
        if (isRecoveryMode) {
          // Validate recovery mode requirements
          await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);

          if (!loginValues.recoveryKey || loginValues.recoveryKey.trim() === '') {
            toast({
              variant: "destructive",
              title: "Recovery Key Required",
              description: "Please enter your recovery key."
            });
            return;
          }
          
          // Handle recovery mode - this function will handle authentication
          await handleRecoveryKeySubmit(loginValues.recoveryKey, loginValues.email);
          return;
        }

        // Regular login flow - validate required fields
        if (!loginValues.passphrase) {
          toast({
            variant: "destructive",
            title: "Passphrase Required",
            description: "Please enter your passphrase to login."
          });
          return;
        }

        // Basic length validation only (for login) - don't block existing users with weaker passphrases
        if (loginValues.passphrase.length < 8) {
          toast({
            variant: "destructive",
            title: "Invalid Passphrase",
            description: "Passphrase must be at least 8 characters long."
          });
          return;
        }

        await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);
        
        // Initialize DataService with passphrase (triggers profile refresh)
        await initializeDataService(loginValues.passphrase);
        
        toast({ title: "Login Successful", description: "Redirecting..." });
        router.push("/protocol");

      } else { // mode === "signup"
        const signupValues = values as SignupFormValues;
        
        // Validate passphrase strength
        const passphraseValidation = validatePassphrase(signupValues.passphrase);
        if (!passphraseValidation.isValid) {
          toast({
            variant: "destructive",
            title: "Weak Passphrase",
            description: passphraseValidation.errors.join(", ")
          });
          return;
        }

        // Check user limit before creating account
        const limitCheck = await canCreateNewUser();
        if (!limitCheck.allowed) {
          toast({
            variant: "destructive",
            title: "Registration Unavailable",
            description: limitCheck.message || "Registration is currently closed.",
          });
          return;
        }

        // Store encrypted passphrase and get recovery key
        const userCredential = await createUserWithEmailAndPassword(auth, signupValues.email, signupValues.password);
        const recoveryKey = await storeEncryptedPassphrase(userCredential.user.uid, signupValues.passphrase);
        
        const pseudonymToUse = signupValues.pseudonym ? signupValues.pseudonym.trim() : "";

        if (pseudonymToUse) {
          await updateProfile(userCredential.user, { displayName: pseudonymToUse });
        }
        
        // Initialize DataService with passphrase (needed for encryption and triggers profile refresh)
        await initializeDataService(signupValues.passphrase);

        await createUserProfileDocument(userCredential.user, { 
          pseudonym: pseudonymToUse
        });

        // Increment user count after successful account creation
        try {
          await incrementUserCount();
        } catch (countError) {
          // Don't fail signup for counter error
          toast({
            variant: "destructive",
            title: "User Count Update Warning",
            description: `Your account was created, but we encountered an issue updating our user count. Please contact support if you notice any issues.${countError instanceof Error ? ` Error: ${countError.message}` : ""}`,
          });
        }

        // Show recovery key dialog
        setRecoveryKeyDialog({ isOpen: true, recoveryKey });
      }
    } catch (error) {
      handleAuthError(error, mode);
    }
  };

  return {
    onSubmit,
    handleRecoveryKeySubmit
  };
}
