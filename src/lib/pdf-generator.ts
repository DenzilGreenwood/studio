// src/lib/pdf-generator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Timestamp } from 'firebase/firestore';
import type { ProtocolSession, Goal } from '@/types';

interface PDFSessionData {
  sessionId: string;
  circumstance: string;
  startTime: Date;
  endTime?: Date;
  summary?: {
    insightSummary: string;
    actualReframedBelief: string;
    actualLegacyStatement: string;
    topEmotions: string;
    reframedBeliefInteraction?: { aiQuestion: string; userResponse: string } | null;
    legacyStatementInteraction?: { aiQuestion: string; userResponse: string } | null;
  };
  userReflection?: string;
  goals?: Goal[];
  aiReflection?: {
    conversationalHighlights: string;
    actionableItems: string[];
    emotionalInsights: string;
    progressReflection: string;
    encouragingMessage: string;
    reflectionPrompts: string[];
  };
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private pageWidth: number = 210; // A4 width in mm
  private contentWidth: number;

  constructor() {
    this.doc = new jsPDF();
    this.contentWidth = this.pageWidth - (2 * this.margin);
  }

  private addTitle(title: string, size: number = 16): void {
    this.checkPageBreak(size + 5);
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += size + 5;
  }

  private addSubtitle(subtitle: string, size: number = 12): void {
    this.checkPageBreak(size + 3);
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(subtitle, this.margin, this.currentY);
    this.currentY += size + 3;
  }

  private addText(text: string, size: number = 10, indent: number = 0): void {
    if (!text) return;
    
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'normal');
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth - indent);
    
    for (const line of lines) {
      this.checkPageBreak(size + 2);
      this.doc.text(line, this.margin + indent, this.currentY);
      this.currentY += size + 2;
    }
  }

  private addSeparator(): void {
    this.checkPageBreak(10);
    this.currentY += 5;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private checkPageBreak(nextElementHeight: number): void {
    if (this.currentY + nextElementHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private addSessionHeader(data: PDFSessionData): void {
    // Main title
    this.addTitle('CognitiveInsight Session Report', 18);
    
    // Session details
    this.addText(`Session ID: ${data.sessionId}`, 9);
    this.addText(`Date: ${this.formatDate(data.startTime)}`, 9);
    if (data.endTime) {
      this.addText(`Duration: ${Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60))} minutes`, 9);
    }
    
    this.addSeparator();
    
    // Circumstance
    this.addSubtitle('Session Focus');
    this.addText(data.circumstance, 11);
    this.addSeparator();
  }

  private addSessionSummary(data: PDFSessionData): void {
    if (!data.summary) return;

    this.addTitle('Session Summary', 14);
    
    // Insight Summary
    this.addSubtitle('Key Insights');
    this.addText(data.summary.insightSummary);
    this.currentY += 5;

    // Reframed Belief
    this.addSubtitle('Reframed Belief');
    this.addText(data.summary.actualReframedBelief);
    
    if (data.summary.reframedBeliefInteraction) {
      this.addText(`Question: ${data.summary.reframedBeliefInteraction.aiQuestion}`, 9, 10);
      this.addText(`Your Response: ${data.summary.reframedBeliefInteraction.userResponse}`, 9, 10);
    }
    this.currentY += 5;

    // Legacy Statement
    this.addSubtitle('Legacy Statement');
    this.addText(data.summary.actualLegacyStatement);
    
    if (data.summary.legacyStatementInteraction) {
      this.addText(`Question: ${data.summary.legacyStatementInteraction.aiQuestion}`, 9, 10);
      this.addText(`Your Response: ${data.summary.legacyStatementInteraction.userResponse}`, 9, 10);
    }
    this.currentY += 5;

    // Emotions
    this.addSubtitle('Key Emotions Explored');
    this.addText(data.summary.topEmotions);
    
    this.addSeparator();
  }

  private addJournalSection(data: PDFSessionData): void {
    this.addTitle('Personal Journal & Reflection', 14);
    
    // User Reflection
    if (data.userReflection) {
      this.addSubtitle('Your Personal Reflection');
      this.addText(data.userReflection);
      this.currentY += 5;
    }

    // Goals
    if (data.goals && data.goals.length > 0) {
      this.addSubtitle('Your Goals');
      data.goals.forEach((goal, index) => {
        const status = goal.completed ? '✓' : '○';
        this.addText(`${status} ${goal.text}`, 10, 5);
      });
      this.currentY += 5;
    }

    // AI Reflection
    if (data.aiReflection) {
      this.addSubtitle('AI-Generated Insights');
      
      this.addText('Conversational Highlights:', 10);
      this.addText(data.aiReflection.conversationalHighlights, 9, 5);
      this.currentY += 3;
      
      this.addText('Emotional Insights:', 10);
      this.addText(data.aiReflection.emotionalInsights, 9, 5);
      this.currentY += 3;
      
      this.addText('Progress Reflection:', 10);
      this.addText(data.aiReflection.progressReflection, 9, 5);
      this.currentY += 3;
      
      if (data.aiReflection.actionableItems && data.aiReflection.actionableItems.length > 0) {
        this.addText('Actionable Items:', 10);
        data.aiReflection.actionableItems.forEach(item => {
          this.addText(`• ${item}`, 9, 5);
        });
        this.currentY += 3;
      }
      
      if (data.aiReflection.reflectionPrompts && data.aiReflection.reflectionPrompts.length > 0) {
        this.addText('Reflection Prompts:', 10);
        data.aiReflection.reflectionPrompts.forEach(prompt => {
          this.addText(`• ${prompt}`, 9, 5);
        });
        this.currentY += 3;
      }
      
      this.addText('Encouragement:', 10);
      this.addText(data.aiReflection.encouragingMessage, 9, 5);
    }
    
    this.addSeparator();
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(128, 128, 128);
      
      // Footer text
      const footerText = `CognitiveInsight Session Report - Generated on ${new Date().toLocaleDateString()}`;
      this.doc.text(footerText, this.margin, this.pageHeight - 10);
      
      // Page number
      const pageText = `Page ${i} of ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 10);
    }
  }

  public async generateSessionPDF(sessionData: PDFSessionData): Promise<Blob> {
    // Reset position
    this.currentY = 20;
    
    // Add content sections
    this.addSessionHeader(sessionData);
    this.addSessionSummary(sessionData);
    this.addJournalSection(sessionData);
    
    // Add footer
    this.addFooter();
    
    // Return PDF blob
    return this.doc.output('blob');
  }

  public async downloadSessionPDF(sessionData: PDFSessionData, filename?: string): Promise<void> {
    const blob = await this.generateSessionPDF(sessionData);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `cognitive-insight-session-${sessionData.sessionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }
}

// Utility function to prepare session data for PDF
export function prepareSessionDataForPDF(sessionData: ProtocolSession): PDFSessionData {
  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
    return new Date();
  };

  return {
    sessionId: sessionData.sessionId,
    circumstance: sessionData.circumstance,
    startTime: convertTimestamp(sessionData.startTime),
    endTime: sessionData.endTime ? convertTimestamp(sessionData.endTime) : undefined,
    summary: sessionData.summary,
    userReflection: sessionData.userReflection,
    goals: sessionData.goals,
    aiReflection: sessionData.aiReflection
  };
}
