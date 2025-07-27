// src/lib/timestamp-utils.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Helper function to convert Firestore timestamps to dates
 * @param timestamp - Either a Firestore Timestamp or Date object
 * @returns Date object
 */
export const toDate = (timestamp: Timestamp | Date): Date => {
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
};
