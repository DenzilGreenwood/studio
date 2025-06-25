// src/hooks/use-is-admin.ts
"use client";
import { useAuth } from "@/context/auth-context";

// IMPORTANT: Replace this placeholder with the actual UID(s) of your admin users.
// You can find a user's UID in the Firebase Console > Authentication > Users tab.
export const ADMIN_USER_IDS = ['aC2Azl37NBelxACXojQOuxIRq8I2'];

/**
 * A hook to determine if the currently authenticated user is an admin.
 * It first checks the persistent `isAdmin` flag in the user's Firestore profile,
 * and falls back to the hardcoded list as a secondary check.
 * @returns `true` if the user is an admin, `false` otherwise.
 */
export function useIsAdmin() {
    const { user, firebaseUser } = useAuth();

    // The most reliable check is the 'isAdmin' field from the Firestore profile.
    if (user?.isAdmin) {
        return true;
    }
    
    // As a fallback, especially during initial load before the user profile is available,
    // check against the hardcoded list of UIDs.
    if (!firebaseUser) return false;
    return ADMIN_USER_IDS.includes(firebaseUser.uid);
}
