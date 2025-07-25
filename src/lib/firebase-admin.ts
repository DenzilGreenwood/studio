// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Use server-side environment variables (without NEXT_PUBLIC_ prefix for security)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
    }

    if (clientEmail && privateKey) {
      // Use service account credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
    } else {
      // Fallback to project ID only (will use application default credentials if available)
      admin.initializeApp({
        projectId,
      });
    }
  } catch (error) {
    // Log error but don't crash the app - allow graceful fallback
    if (process.env.NODE_ENV !== 'production') {
      // Temporary debug logging
      console.warn('Firebase Admin initialization warning:', error instanceof Error ? error.message : String(error));
    }
  }
}

export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export { admin };
