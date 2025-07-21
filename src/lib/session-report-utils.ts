// src/lib/session-report-utils.ts
"use client";

import { db, collection, doc, getDoc, setDoc, updateDoc, query, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import { getJournalAssistance } from '@/lib/firebase-functions-client';
import type { 
  SessionReport, 
  SessionJournal, 
  ProtocolSessionInteraction,
  JournalAssistanceInput,
  Goal
} from '@/types/session-reports';
import type { ProtocolSession, ChatMessage } from '@/types';
import { encryptJournalEntry, decryptJournalEntry } from './data-encryption';

/**
 * Utility functions for the new session report architecture
 */

// Generate a session report from interaction data
export async function generateSessionReport(
  userId: string, 
  sessionId: string
): Promise<SessionReport | null> {
  try {
    // Get original session data
    const sessionDoc = await getDoc(doc(db, `users/${userId}/sessions/${sessionId}`));
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data() as ProtocolSession;
    
    // Ensure session is completed
    if (sessionData.completedPhases < 6) {
      throw new Error('Cannot generate report for incomplete session');
    }

    // Get all messages for analysis (handle case where no messages exist)
    let messages: ChatMessage[] = [];
    try {
      const messagesQuery = query(
        collection(db, `users/${userId}/sessions/${sessionId}/messages`),
        orderBy('timestamp', 'asc')
      );
      const messagesSnap = await getDocs(messagesQuery);
      messages = messagesSnap.docs.map(doc => doc.data() as ChatMessage);
    } catch {
      messages = [];
    }

    // Calculate session duration
    const startTime = sessionData.startTime instanceof Timestamp ? sessionData.startTime.toDate() : new Date(sessionData.startTime);
    const endTime = sessionData.endTime instanceof Timestamp ? sessionData.endTime.toDate() : new Date(sessionData.endTime || Date.now());
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

    // Analyze phase progression
    const phaseProgression = analyzePhaseProgression(messages);
    
    // Create the report
    const report: SessionReport = {
      reportId: sessionId,
      sessionId: sessionId,
      userId: userId,
      
      circumstance: sessionData.circumstance,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      ageRange: sessionData.ageRange,
      
      insights: {
        primaryReframe: sessionData.summary?.actualReframedBelief || '',
        legacyStatement: sessionData.summary?.actualLegacyStatement || '',
        keyBreakthroughs: extractKeyBreakthroughs(messages),
        emotionalJourney: sessionData.summary?.emotionalJourney || sessionData.summary?.topEmotions || '',
        topEmotions: sessionData.summary?.topEmotions || '',
        cognitiveShifts: extractCognitiveShifts(messages),
        insightSummary: sessionData.summary?.insightSummary || ''
      },
      
      interactionSummary: {
        totalMessages: messages.length,
        userEngagement: assessUserEngagement(messages),
        breakthroughPhase: findBreakthroughPhase(messages),
        aiAssessment: generateAIAssessment(sessionData, messages),
        keyQuestions: extractKeyQuestions(messages),
        phaseProgression: phaseProgression
      },
      
      generatedAt: new Date(),
      reportVersion: 1,
      generationSource: 'auto',
      
      isComplete: true,
      hasJournal: !!sessionData.userReflection,
      hasFeedback: !!sessionData.feedbackId,
      
      feedbackId: sessionData.feedbackId,
      downloadUrl: sessionData.summary?.downloadUrl
    };

    // Save the report
    await setDoc(doc(db, `users/${userId}/reports/${sessionId}`), {
      ...report,
      startTime: report.startTime instanceof Date ? Timestamp.fromDate(report.startTime) : report.startTime,
      endTime: report.endTime instanceof Date ? Timestamp.fromDate(report.endTime) : report.endTime,
      generatedAt: report.generatedAt instanceof Date ? Timestamp.fromDate(report.generatedAt) : report.generatedAt
    });

    return report;
  } catch (error) {
    console.error('Error generating session report:', error);
    return null;
  }
}

// Create or update a session journal
export async function createSessionJournal(
  userId: string,
  sessionId: string,
  userReflection?: string,
  goals?: Goal[]
): Promise<SessionJournal | null> {
  try {
    // Check if report exists
    const reportDoc = await getDoc(doc(db, `users/${userId}/reports/${sessionId}`));
    if (!reportDoc.exists()) {
      throw new Error('Session report must exist before creating journal');
    }

    const existingJournalDoc = await getDoc(doc(db, `users/${userId}/journals/${sessionId}`));
    const now = new Date();

    let journal: SessionJournal;

    if (existingJournalDoc.exists()) {
      // Update existing journal
      const existingJournal = existingJournalDoc.data() as SessionJournal;
      journal = {
        ...existingJournal,
        userReflection: userReflection || existingJournal.userReflection,
        reflectionUpdatedAt: userReflection ? now : existingJournal.reflectionUpdatedAt,
        reflectionWordCount: userReflection ? userReflection.split(' ').length : existingJournal.reflectionWordCount,
        goals: goals || existingJournal.goals || [],
        completedGoals: (goals || existingJournal.goals || []).filter(g => g.completed).length,
        goalsUpdatedAt: goals ? now : existingJournal.goalsUpdatedAt,
        lastAccessedAt: now,
        journalCompleteness: calculateJournalCompleteness(userReflection || existingJournal.userReflection, goals || existingJournal.goals || [])
      };
    } else {
      // Create new journal
      journal = {
        journalId: sessionId,
        reportId: sessionId,
        sessionId: sessionId,
        userId: userId,
        
        userReflection: userReflection || '',
        reflectionUpdatedAt: now,
        reflectionWordCount: userReflection ? userReflection.split(' ').length : 0,
        
        goals: goals || [],
        completedGoals: (goals || []).filter(g => g.completed).length,
        goalsUpdatedAt: now,
        
        createdAt: now,
        lastAccessedAt: now,
        journalCompleteness: calculateJournalCompleteness(userReflection || '', goals || []),
        timeSpentJournaling: 0,
        
        isPrivate: true,
        allowAILearning: true
      };
    }

    // Save the journal (encrypt sensitive data before storage)
    const journalToSave = await encryptJournalEntry({
      ...journal,
      reflectionUpdatedAt: journal.reflectionUpdatedAt instanceof Date ? Timestamp.fromDate(journal.reflectionUpdatedAt) : journal.reflectionUpdatedAt,
      goalsUpdatedAt: journal.goalsUpdatedAt instanceof Date ? Timestamp.fromDate(journal.goalsUpdatedAt) : journal.goalsUpdatedAt,
      createdAt: journal.createdAt instanceof Date ? Timestamp.fromDate(journal.createdAt) : journal.createdAt,
      lastAccessedAt: journal.lastAccessedAt instanceof Date ? Timestamp.fromDate(journal.lastAccessedAt) : journal.lastAccessedAt
    });

    await setDoc(doc(db, `users/${userId}/journals/${sessionId}`), journalToSave);

    return journal;
  } catch (error) {
    console.error('Error creating session journal:', error);
    return null;
  }
}

// Generate AI assistance for journaling
export async function generateJournalAssistance(
  userId: string,
  sessionId: string
): Promise<SessionJournal['aiJournalSupport'] | null> {
  try {
    // Get report data
    const reportDoc = await getDoc(doc(db, `users/${userId}/reports/${sessionId}`));
    if (!reportDoc.exists()) {
      throw new Error('Session report not found');
    }

    const report = reportDoc.data() as SessionReport;

    // Get previous journals for context
    const previousJournalsQuery = query(
      collection(db, `users/${userId}/journals`),
      orderBy('createdAt', 'desc')
    );
    const previousJournalsSnap = await getDocs(previousJournalsQuery);
    const previousJournals = previousJournalsSnap.docs
      .filter(doc => doc.id !== sessionId)
      .slice(0, 3) // Last 3 journals
      .map(doc => doc.data() as SessionJournal);

    // Call AI service to generate assistance
    const assistanceInput: JournalAssistanceInput = {
      reportData: report,
      previousJournals: previousJournals
    };

    const response = await getJournalAssistance(assistanceInput);
    
    if (!response.ok) {
      throw new Error('Failed to generate journal assistance');
    }

    const assistance = await response.json();

    // Update journal with AI assistance (encrypt before saving)
    const journalDoc = doc(db, `users/${userId}/journals/${sessionId}`);
    const updateData = {
      aiJournalSupport: {
        ...assistance,
        generatedAt: Timestamp.fromDate(new Date()),
        generationContext: {
          previousSessionCount: previousJournals.length,
          reportVersion: report.reportVersion
        }
      }
    };
    
    const encryptedUpdate = await encryptJournalEntry(updateData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(journalDoc, encryptedUpdate as any);

    return assistance;
  } catch (error) {
    console.error('Error generating journal assistance:', error);
    return null;
  }
}

// Get complete session data (report + journal + interaction)
export async function getCompleteSessionData(userId: string, sessionId: string) {
  try {
    const [reportDoc, journalDoc, sessionDoc] = await Promise.all([
      getDoc(doc(db, `users/${userId}/reports/${sessionId}`)),
      getDoc(doc(db, `users/${userId}/journals/${sessionId}`)),
      getDoc(doc(db, `users/${userId}/sessions/${sessionId}`))
    ]);

    // Decrypt journal data if it exists
    let journal: SessionJournal | null = null;
    if (journalDoc.exists()) {
      const encryptedJournal = journalDoc.data() as SessionJournal;
      journal = await decryptJournalEntry(encryptedJournal) as SessionJournal;
    }

    return {
      report: reportDoc.exists() ? reportDoc.data() as SessionReport : null,
      journal,
      session: sessionDoc.exists() ? sessionDoc.data() as ProtocolSessionInteraction : null
    };
  } catch (error) {
    console.error('Error getting complete session data:', error);
    return { report: null, journal: null, session: null };
  }
}

// Helper functions
function analyzePhaseProgression(messages: ChatMessage[]) {
  const phaseMap = new Map<string, { messageCount: number; timestamps: Date[] }>();
  
  messages.forEach(msg => {
    const phase = msg.phaseName;
    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, { messageCount: 0, timestamps: [] });
    }
    const phaseData = phaseMap.get(phase)!;
    phaseData.messageCount++;
    phaseData.timestamps.push(msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp));
  });

  return Array.from(phaseMap.entries()).map(([phaseName, data], index) => {
    const timeSpent = data.timestamps.length > 1 
      ? Math.round((Math.max(...data.timestamps.map(t => t.getTime())) - Math.min(...data.timestamps.map(t => t.getTime()))) / (1000 * 60))
      : 5; // Default 5 minutes if only one message

    return {
      phase: index + 1,
      phaseName,
      timeSpent,
      messageCount: data.messageCount,
      breakthroughs: data.messageCount > 3 // Simple heuristic
    };
  });
}

function assessUserEngagement(messages: ChatMessage[]): 'high' | 'medium' | 'low' {
  if (messages.length === 0) return 'low';
  const userMessages = messages.filter(msg => msg.sender === 'user');
  if (userMessages.length === 0) return 'low';
  
  const avgLength = userMessages.reduce((sum, msg) => sum + msg.text.length, 0) / userMessages.length;
  
  if (avgLength > 150) return 'high';
  if (avgLength > 75) return 'medium';
  return 'low';
}

function extractKeyBreakthroughs(messages: ChatMessage[]): string[] {
  if (messages.length === 0) return [];
  
  return messages
    .filter(msg => msg.sender === 'user' && msg.text.length > 100)
    .slice(-3) // Last 3 substantial user messages
    .map(msg => msg.text);
}

function extractCognitiveShifts(messages: ChatMessage[]): string[] {
  if (messages.length === 0) return [];
  
  // Simple implementation - look for phrases indicating shifts
  const shiftIndicators = ['I realize', 'I understand', 'I see that', 'Now I know', 'I\'ve learned'];
  return messages
    .filter(msg => msg.sender === 'user')
    .filter(msg => shiftIndicators.some(indicator => msg.text.toLowerCase().includes(indicator.toLowerCase())))
    .map(msg => msg.text)
    .slice(0, 5);
}

function findBreakthroughPhase(messages: ChatMessage[]): number {
  if (messages.length === 0) return 1;
  
  // Find the phase with the most substantial user responses
  const phaseMap = new Map<string, number>();
  messages.filter(msg => msg.sender === 'user').forEach(msg => {
    const current = phaseMap.get(msg.phaseName) || 0;
    phaseMap.set(msg.phaseName, current + msg.text.length);
  });

  if (phaseMap.size === 0) return 1;

  let maxPhase = 1;
  let maxLength = 0;
  phaseMap.forEach((length, phaseName) => {
    if (length > maxLength) {
      maxLength = length;
      // Extract phase number from name
      const phaseNumber = Array.from(phaseMap.keys()).indexOf(phaseName) + 1;
      maxPhase = phaseNumber;
    }
  });

  return maxPhase;
}

function generateAIAssessment(sessionData: ProtocolSession, messages: ChatMessage[]): string {
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const engagement = assessUserEngagement(messages);
  
  return `Session showed ${engagement} user engagement with ${userMessages.length} user responses. ` +
         `User progressed through ${sessionData.completedPhases} phases addressing "${sessionData.circumstance}".`;
}

function extractKeyQuestions(messages: ChatMessage[]) {
  if (messages.length === 0) return [];
  
  const aiQuestions = messages.filter(msg => 
    msg.sender === 'ai' && msg.text.includes('?') && msg.text.length > 50
  );
  
  return aiQuestions.slice(-5).map((msg, index) => {
    const nextUserMsg = messages.find(m => 
      m.sender === 'user' && 
      m.timestamp > msg.timestamp
    );
    
    return {
      question: msg.text,
      answer: nextUserMsg?.text || 'No response recorded',
      phase: Math.floor((index / aiQuestions.length) * 6) + 1,
      phaseName: msg.phaseName,
      importance: msg.text.length > 100 ? 'high' as const : 'medium' as const
    };
  });
}

function calculateJournalCompleteness(reflection: string, goals: Goal[]): number {
  let completeness = 0;
  
  // Reflection contributes 60%
  if (reflection && reflection.length > 100) completeness += 60;
  else if (reflection && reflection.length > 50) completeness += 30;
  else if (reflection && reflection.length > 0) completeness += 15;
  
  // Goals contribute 40%
  if (goals.length >= 3) completeness += 40;
  else if (goals.length >= 1) completeness += 20;
  
  return Math.min(completeness, 100);
}


