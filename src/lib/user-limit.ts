// src/lib/user-limit.ts
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from './firebase';

const MAX_USERS = 30;

export async function getCurrentUserCount(): Promise<number> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef));
    return snapshot.size;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw new Error('Failed to check user count');
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
