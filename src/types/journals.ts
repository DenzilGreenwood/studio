// src/types/journals.ts
import type { Timestamp } from 'firebase/firestore';

export interface JournalEntry {
  id: string;
  userId: string;
  sessionId?: string; // Optional link to a specific session
  title: string;
  content: string;
  tags: string[];
  metadata: {
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    wordCount: number;
  };
  // Encryption fields
  encryptedContent?: string;
  salt?: string;
  iv?: string;
}

export interface JournalMessage {
  id: string;
  journalId: string;
  content: string;
  timestamp: Timestamp | Date;
  type: 'entry' | 'reflection' | 'insight';
  // Encryption fields
  encryptedContent?: string;
  salt?: string;
  iv?: string;
}
