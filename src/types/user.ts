// src/types/user.ts
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  pseudonym?: string;
  ageRange?: string;
  primaryChallenge?: string;
  createdAt: Timestamp | Date;
  lastSessionAt?: Timestamp | Date;
  lastCheckInAt?: Timestamp | Date;
  fcmToken?: string;
  sessionCount?: number;
  // Encryption fields
  encryptedPassphrase?: string;
  passphraseSalt?: string;
  passphraseIv?: string;
}

export interface CognitiveProfile {
  userId: string;
  systemsThinking?: number;
  legacyOrientation?: number;
  emotionalDepth?: number;
  patternRecognition?: number;
  lastUpdated: Timestamp | Date;
}
