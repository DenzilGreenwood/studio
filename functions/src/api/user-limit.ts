/**
 * User Limit Function
 * Migrated from: src/app/api/user-limit/route.ts
 */

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// User limit configuration
const MAX_USERS = parseInt(process.env.MAX_USERS || '100', 10);

async function getCurrentUserCount(): Promise<number> {
  try {
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.count().get();
    return snapshot.data().count;
  } catch (error) {
    logger.error('Error getting user count:', error);
    return 0;
  }
}

async function canCreateNewUser(): Promise<{
  allowed: boolean;
  message?: string;
}> {
  try {
    const currentCount = await getCurrentUserCount();
    const allowed = currentCount < MAX_USERS;
    
    if (!allowed) {
      return {
        allowed: false,
        message: `Registration is currently closed. Maximum capacity of ${MAX_USERS} users reached.`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    logger.error('Error checking user limit:', error);
    // Default to allowing signup if check fails
    return {
      allowed: true,
      message: 'Unable to verify user capacity, but registration is open'
    };
  }
}

export const userLimitFunction = onRequest({
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 30
}, async (req, res) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const result = await canCreateNewUser();
    const currentCount = await getCurrentUserCount();
    
    const responseData = {
      ...result,
      currentCount,
      maxUsers: MAX_USERS,
      remainingSlots: Math.max(0, MAX_USERS - currentCount)
    };

    logger.info('User limit check completed', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    logger.error('Error checking user limit:', error);
    res.status(200).json({
      allowed: true, // Default to allowing signup if check fails
      message: 'Unable to verify user capacity, but registration is open',
      currentCount: 0,
      maxUsers: MAX_USERS,
      remainingSlots: MAX_USERS
    });
  }
});
