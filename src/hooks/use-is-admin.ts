// src/hooks/use-is-admin.ts
"use client";
import { useAuth } from "@/context/auth-context";

// IMPORTANT: Replace this placeholder with the actual UID(s) of your admin users.
// You can find a user's UID in the Firebase Console > Authentication > Users tab.
export const ADMIN_USER_IDS = ['jH0K85sIfQc9i2rIaWmtA1RPNyw1'];

/**
 * A hook to determine if the currently authenticated user is an admin.
 * @returns `true` if the user is an admin, `false` otherwise.
 */
export function useIsAdmin() {
    const { firebaseUser } = useAuth();
    if (!firebaseUser) return false;
    return ADMIN_USER_IDS.includes(firebaseUser.uid);
}
