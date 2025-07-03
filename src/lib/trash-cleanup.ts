// src/lib/trash-cleanup.ts
import { db, collection, query, where, getDocs, deleteDoc, doc, Timestamp } from './firebase';

/**
 * Cleanup function to permanently delete sessions that have been in trash for more than 30 days
 * This should be called periodically (e.g., via a cron job or cloud function)
 */
export async function cleanupOldDeletedSessions(userId: string): Promise<number> {
  try {
    // Calculate the cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query for sessions that are deleted and older than 30 days
    const sessionsRef = collection(db, `users/${userId}/sessions`);
    const oldDeletedQuery = query(
      sessionsRef,
      where('isDeleted', '==', true),
      where('deletedAt', '<', Timestamp.fromDate(thirtyDaysAgo))
    );

    const snapshot = await getDocs(oldDeletedQuery);
    const deletePromises = snapshot.docs.map(sessionDoc => 
      deleteDoc(doc(db, `users/${userId}/sessions/${sessionDoc.id}`))
    );

    await Promise.all(deletePromises);
    
    console.log(`Cleaned up ${snapshot.docs.length} old deleted sessions for user ${userId}`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error cleaning up old deleted sessions:', error);
    throw error;
  }
}

/**
 * Get sessions that will be automatically deleted soon (within 7 days)
 * This can be used to warn users about upcoming permanent deletion
 */
export async function getSessionsToBeDeleted(userId: string): Promise<any[]> {
  try {
    // Calculate dates for sessions that will be deleted in 7 days
    const twentyThreeDaysAgo = new Date();
    twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23); // 30 - 7 = 23

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsRef = collection(db, `users/${userId}/sessions`);
    const warningQuery = query(
      sessionsRef,
      where('isDeleted', '==', true),
      where('deletedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      where('deletedAt', '<', Timestamp.fromDate(twentyThreeDaysAgo))
    );

    const snapshot = await getDocs(warningQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      daysUntilDeletion: Math.max(0, 30 - Math.floor((Date.now() - doc.data().deletedAt.toDate().getTime()) / (1000 * 60 * 60 * 24)))
    }));
  } catch (error) {
    console.error('Error getting sessions to be deleted:', error);
    throw error;
  }
}
