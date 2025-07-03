import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timestamp conversion utilities
export function convertTimestamp(timestamp: any): Date {
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  return new Date();
}

export function convertTimestampOptional(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;
  return convertTimestamp(timestamp);
}

// Protocol Session data conversion
export function convertProtocolSessionTimestamps<T extends {
  startTime: any;
  endTime?: any;
  userReflectionUpdatedAt?: any;
  feedbackSubmittedAt?: any;
  summary?: {
    generatedAt: any;
    [key: string]: any;
  };
  aiReflection?: {
    generatedAt: any;
    [key: string]: any;
  };
  emotionalProgression?: Array<{
    timestamp: any;
    [key: string]: any;
  }>;
  keyStatements?: {
    reframedBelief?: {
      timestamp: any;
      [key: string]: any;
    };
    legacyStatement?: {
      timestamp: any;
      [key: string]: any;
    };
    insights?: Array<{
      timestamp: any;
      [key: string]: any;
    }>;
  };
  [key: string]: any;
}>(data: T): T {
  return {
    ...data,
    startTime: convertTimestamp(data.startTime),
    endTime: convertTimestampOptional(data.endTime),
    userReflectionUpdatedAt: convertTimestampOptional(data.userReflectionUpdatedAt),
    feedbackSubmittedAt: convertTimestampOptional(data.feedbackSubmittedAt),
    summary: data.summary ? {
      ...data.summary,
      generatedAt: convertTimestamp(data.summary.generatedAt)
    } : undefined,
    aiReflection: data.aiReflection ? {
      ...data.aiReflection,
      generatedAt: convertTimestamp(data.aiReflection.generatedAt)
    } : undefined,
    emotionalProgression: data.emotionalProgression?.map(emotion => ({
      ...emotion,
      timestamp: convertTimestamp(emotion.timestamp)
    })),
    keyStatements: data.keyStatements ? {
      ...data.keyStatements,
      reframedBelief: data.keyStatements.reframedBelief ? {
        ...data.keyStatements.reframedBelief,
        timestamp: convertTimestamp(data.keyStatements.reframedBelief.timestamp)
      } : undefined,
      legacyStatement: data.keyStatements.legacyStatement ? {
        ...data.keyStatements.legacyStatement,
        timestamp: convertTimestamp(data.keyStatements.legacyStatement.timestamp)
      } : undefined,
      insights: data.keyStatements.insights?.map(insight => ({
        ...insight,
        timestamp: convertTimestamp(insight.timestamp)
      }))
    } : undefined
  };
}
