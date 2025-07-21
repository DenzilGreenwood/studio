// src/types/reports.ts
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import type { BaseDocument } from './base';

// Clarity Map Types
export interface ClarityMapNode {
  id: string;
  type: 'emotion' | 'challenge' | 'belief' | 'insight';
  position: { x: number; y: number };
  data: {
    label: string;
    emoji?: string;
    color?: string;
    category?: string;
    intensity?: number; // 1-10 scale for emotions
    confidence?: number; // 1-10 scale for beliefs/insights
  };
}

export interface ClarityMapEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'smoothstep' | 'straight';
  animated?: boolean;
  label?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface ClarityMap {
  id: string;
  userId: string;
  sessionId?: string;
  title: string;
  nodes: ClarityMapNode[];
  edges: ClarityMapEdge[];
  metadata: {
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    version: number;
  };
  // Encryption fields
  encryptedData?: string;
  salt?: string;
  iv?: string;
}

// Insight Report Types
export interface InsightReport {
  id: string;
  userId: string;
  sessionId?: string;
  clarityMapId?: string;
  title: string;
  content: string; // Rich text HTML content
  sections: {
    highlights?: string;
    breakthroughs?: string;
    patterns?: string;
    reframedBeliefs?: string;
    legacyStatement?: string;
    nextSteps?: string;
  };
  metadata: {
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    version: number;
    wordCount?: number;
  };
  // Encryption fields
  encryptedContent?: string;
  salt?: string;
  iv?: string;
}

// AI Generation Input for Insight Reports
export const InsightReportGeneratorInputSchema = z.object({
  sessionData: z.object({
    circumstance: z.string().describe('The challenge or situation from the session'),
    chatHistory: z.array(z.object({
      sender: z.enum(['user', 'ai']),
      text: z.string(),
      timestamp: z.string()
    })).describe('Chat messages from the session'),
    emotionalProgression: z.array(z.object({
      emotion: z.string(),
      intensity: z.number(),
      phase: z.string()
    })).optional().describe('Emotional progression throughout the session'),
    keyStatements: z.object({
      reframedBelief: z.string().optional(),
      legacyStatement: z.string().optional(),
      insights: z.array(z.string()).optional()
    }).optional().describe('Key statements and insights from the session')
  }).describe('Session data to generate insights from'),
  
  clarityMapData: z.object({
    nodes: z.array(z.object({
      type: z.enum(['emotion', 'challenge', 'belief', 'insight']),
      label: z.string(),
      category: z.string().optional()
    })),
    connections: z.array(z.object({
      from: z.string(),
      to: z.string(),
      relationship: z.string().optional()
    })).optional()
  }).optional().describe('Clarity map data if available'),
  
  focusArea: z.string().optional().describe('Specific area to focus the report on')
});
export type InsightReportGeneratorInput = z.infer<typeof InsightReportGeneratorInputSchema>;

export const InsightReportGeneratorOutputSchema = z.object({
  title: z.string().describe('Suggested title for the insight report'),
  sections: z.object({
    highlights: z.string().describe('Key highlights and breakthroughs from the session'),
    patterns: z.string().describe('Mental models and patterns observed'),
    reframedBeliefs: z.string().describe('Reframed beliefs and new perspectives'),
    legacyStatement: z.string().describe('Personal legacy statement or core values identified'),
    nextSteps: z.string().describe('Suggested next steps and journaling prompts')
  }),
  fullContent: z.string().describe('Complete HTML content for the report with proper formatting')
});
export type InsightReportGeneratorOutput = z.infer<typeof InsightReportGeneratorOutputSchema>;

/**
 * Report data interface for session reports and analytics
 */
export interface ReportData extends BaseDocument {
  reportType: string;
  generatedAt: Date;
  userId?: string;
  sessionId?: string;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Trash item interface for soft deletion tracking
 */
export interface TrashItem extends BaseDocument {
  deletedAt: Date;
  originalCollection: string;
  originalDocId?: string;
  deletedBy?: string;
  restoreData?: Record<string, unknown>;
}
