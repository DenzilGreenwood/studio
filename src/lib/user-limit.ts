// src/lib/user-limit.ts
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const MAX_USERS = 30;

export async function getCurrentUserCount(): Promise<number> {
  try {
    const counterRef = doc(db, 'system', 'userCount');
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      return counterDoc.data().count || 0;
    } else {
      // Initialize counter if it doesn't exist
      try {
        await setDoc(counterRef, { count: 0 });
        return 0;
      } catch {
        // Error initializing user count - return 0 to allow signup to proceed
        return 0;
      }
    }
  } catch {
    // Return 0 instead of throwing to allow signup flow to continue
    // Defaulting to user count of 0 due to access error
    return 0;
  }
}

export async function incrementUserCount(): Promise<void> {
  try {
    const counterRef = doc(db, 'system', 'userCount');
    
    // First try to update if the document exists
    const counterDoc = await getDoc(counterRef);
    if (counterDoc.exists()) {
      await updateDoc(counterRef, {
        count: increment(1)
      });
    } else {
      // If document doesn't exist, create it with count 1
      await setDoc(counterRef, { count: 1 });
    }
  } catch {
    // Don't throw error - let signup proceed even if count increment fails
    // User count increment failed, but allowing signup to proceed
  }
}

export async function canCreateNewUser(): Promise<{ allowed: boolean; message?: string }> {
  try {
    const currentCount = await getCurrentUserCount();
    
    if (currentCount >= MAX_USERS) {
      return {
        allowed: false,
        message: `Registration is currently closed. We have reached our maximum capacity of ${MAX_USERS} users for this beta version.`
      };
    }
    
    return { allowed: true };
  } catch {
    // Default to allowing registration if check fails to avoid blocking users
    // User limit check failed, defaulting to allow registration
    return { 
      allowed: true, 
      message: 'Unable to verify user capacity, but registration is open' 
    };
  }
}

export function getMaxUsers(): number {
  return MAX_USERS;
}
