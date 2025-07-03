// src/lib/session-utils.ts
"use client";

import { db, collection, query, orderBy, getDocs, where } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';

export interface ActiveSession {
  sessionId: string;
  circumstance: string;
  completedPhases: number;
  startTime: Date;
}

export async function checkForActiveSession(userId: string): Promise<ActiveSession | null> {
  try {
    // First try with the composite query
    try {
      const allSessionsQuery = query(
        collection(db, `users/${userId}/sessions`),
        where('isDeleted', '!=', true), // Exclude deleted sessions
        orderBy("startTime", "desc")
      );
      const allSessionsSnap = await getDocs(allSessionsQuery);
      
      // Find the first active session (completedPhases < 6)
      const activeSessionDoc = allSessionsSnap.docs.find(doc => {
        const data = doc.data();
        return (data.completedPhases || 0) < 6;
      });
      
      if (activeSessionDoc) {
        const sessionData = activeSessionDoc.data() as ProtocolSession;
        return {
          sessionId: activeSessionDoc.id,
          circumstance: sessionData.circumstance,
          completedPhases: sessionData.completedPhases,
          startTime: sessionData.startTime instanceof Date ? sessionData.startTime : sessionData.startTime.toDate()
        };
      }
    } catch (indexError) {
      console.log("Composite index not available, falling back to basic query:", indexError);
      
      // Fallback: Get all sessions without isDeleted filter
      const allSessionsQuery = query(
        collection(db, `users/${userId}/sessions`),
        orderBy("startTime", "desc")
      );
      const allSessionsSnap = await getDocs(allSessionsQuery);
      
      // Find the first active session that's not deleted
      const activeSessionDoc = allSessionsSnap.docs.find(doc => {
        const data = doc.data();
        return !data.isDeleted && (data.completedPhases || 0) < 6;
      });
      
      if (activeSessionDoc) {
        const sessionData = activeSessionDoc.data() as ProtocolSession;
        return {
          sessionId: activeSessionDoc.id,
          circumstance: sessionData.circumstance,
          completedPhases: sessionData.completedPhases,
          startTime: sessionData.startTime instanceof Date ? sessionData.startTime : sessionData.startTime.toDate()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error checking for active sessions:", error);
    return null;
  }
}

export async function getCompletedSessions(userId: string): Promise<ProtocolSession[]> {
  try {
    // First try with the composite query
    try {
      const sessionsQuery = query(
        collection(db, `users/${userId}/sessions`),
        where('isDeleted', '!=', true), // Exclude deleted sessions
        where('completedPhases', '==', 6),
        orderBy("startTime", "desc")
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      
      return sessionsSnap.docs.map(doc => ({
        ...doc.data(),
        sessionId: doc.id
      })) as ProtocolSession[];
    } catch (indexError) {
      console.log("Composite index not available for completed sessions, falling back:", indexError);
      
      // Fallback: Get all sessions and filter in memory
      const allSessionsQuery = query(
        collection(db, `users/${userId}/sessions`),
        orderBy("startTime", "desc")
      );
      const allSessionsSnap = await getDocs(allSessionsQuery);
      
      return allSessionsSnap.docs
        .filter(doc => {
          const data = doc.data();
          return !data.isDeleted && data.completedPhases === 6;
        })
        .map(doc => ({
          ...doc.data(),
          sessionId: doc.id
        })) as ProtocolSession[];
    }
  } catch (error) {
    console.error("Error fetching completed sessions:", error);
    return [];
  }
}
