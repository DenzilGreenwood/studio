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
      await setDoc(counterRef, { count: 0 });
      return 0;
    }
  } catch (error) {
    console.error('Error getting user count:', error);
    throw new Error('Failed to check user count');
  }
}

export async function incrementUserCount(): Promise<void> {
  try {
    const counterRef = doc(db, 'system', 'userCount');
    await updateDoc(counterRef, {
      count: increment(1)
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      const counterRef = doc(db, 'system', 'userCount');
      await setDoc(counterRef, { count: 1 });
    } catch (setError) {
      console.error('Error incrementing user count:', error, setError);
      throw new Error('Failed to increment user count');
    }
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
    return {
      allowed: false,
      message: 'Unable to verify user capacity. Please try again later.'
    };
  }
}

export function getMaxUsers(): number {
  return MAX_USERS;
}
