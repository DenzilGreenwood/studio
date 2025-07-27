// src/hooks/useOAuthAuth.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  auth, 
  googleProvider, 
  microsoftProvider, 
  signInWithPopup,
  getRedirectResult 
} from "@/lib/firebase";
import { createUserProfileDocument } from "@/context/auth-context";
import { canCreateNewUser, incrementUserCount } from "@/lib/user-limit";
import { storeEncryptedPassphrase } from "@/services/recoveryService";
import { useEncryption } from "@/lib/encryption-context";
import type { User as FirebaseUser, UserCredential } from "firebase/auth";
import { doc, getDoc, db } from "@/lib/firebase";

export type OAuthProvider = "google" | "microsoft";

interface OAuthAuthResult {
  user: FirebaseUser;
  isNewUser: boolean;
}

export function useOAuthAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { setPassphrase } = useEncryption();

  const handleOAuthSignIn = async (
    provider: OAuthProvider,
    passphrase?: string
  ): Promise<OAuthAuthResult | null> => {
    setIsLoading(true);
    
    try {
      // Check user limit for new signups
      const limitCheck = await canCreateNewUser();
      if (!limitCheck.allowed) {
        toast({
          variant: "destructive",
          title: "Registration Unavailable",
          description: limitCheck.message || "Registration is currently closed.",
        });
        return null;
      }

      const authProvider = provider === "google" ? googleProvider : microsoftProvider;
      const result = await signInWithPopup(auth, authProvider);
      
      if (!result.user) {
        throw new Error("No user data received from OAuth provider");
      }

      // Check if this is a new user by looking for existing profile document
      const userDocRef = doc(db, "users", result.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const isNewUser = !userDocSnap.exists();

      // If new user and passphrase provided, set up encryption
      if (isNewUser && passphrase) {
        // Store encrypted passphrase for recovery
        await storeEncryptedPassphrase(result.user.uid, passphrase);
        
        // Set passphrase in session
        await setPassphrase(passphrase);
        
        // Create user profile
        await createUserProfileDocument(result.user, {
          pseudonym: result.user.displayName || ""
        });

        // Increment user count
        try {
          await incrementUserCount();
        } catch (countError) {
          console.warn("User count update failed:", countError);
        }
      } else if (!isNewUser && passphrase) {
        // Existing user logging in with passphrase
        await setPassphrase(passphrase);
      }

      return {
        user: result.user,
        isNewUser
      };

    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error);
      
      let errorMessage = "Authentication failed. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked. Please allow pop-ups and try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Only one sign-in request at a time is allowed.";
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        // Check if this is a new user by looking for existing profile document
        const userDocRef = doc(db, "users", result.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const isNewUser = !userDocSnap.exists();
        
        return {
          user: result.user,
          isNewUser
        };
      }
      return null;
    } catch (error) {
      console.error("OAuth redirect error:", error);
      return null;
    }
  };

  return {
    handleOAuthSignIn,
    handleOAuthRedirectResult,
    isLoading
  };
}
