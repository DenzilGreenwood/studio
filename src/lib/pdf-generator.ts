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

interface TOCEntry {
  title: string;
  page: number;
  hasContent: boolean;
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private pageWidth: number = 210; // A4 width in mm
  private contentWidth: number;
  private tocEntries: TOCEntry[] = [];

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

  private addCoverPage(data: PDFSessionData): void {
    // Reset to first page
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 102, 204); // Blue color
    const titleText = 'CognitiveInsight';
    const titleWidth = this.doc.getTextWidth(titleText);
    this.doc.text(titleText, (this.pageWidth - titleWidth) / 2, this.currentY);
    this.currentY += 20;

    // Subtitle
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    const subtitleText = 'Session Report';
    const subtitleWidth = this.doc.getTextWidth(subtitleText);
    this.doc.text(subtitleText, (this.pageWidth - subtitleWidth) / 2, this.currentY);
    this.currentY += 40;

    // Session details box
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 60, 'FD');
    
    this.currentY += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Session Details', this.margin + 10, this.currentY);
    
    this.currentY += 10;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    this.doc.text(`Session ID: ${data.sessionId}`, this.margin + 10, this.currentY);
    this.currentY += 8;
    
    this.doc.text(`Date: ${this.formatDate(data.startTime)}`, this.margin + 10, this.currentY);
    this.currentY += 8;
    
    if (data.endTime) {
      const duration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60));
      this.doc.text(`Duration: ${duration} minutes`, this.margin + 10, this.currentY);
      this.currentY += 8;
    }
    
    this.doc.text(`Focus: ${data.circumstance}`, this.margin + 10, this.currentY);
    
    // Generated date at bottom
    this.currentY = this.pageHeight - 40;
    this.doc.setFontSize(8);
    this.doc.setTextColor(128, 128, 128);
    const generatedText = `Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    const generatedWidth = this.doc.getTextWidth(generatedText);
    this.doc.text(generatedText, (this.pageWidth - generatedWidth) / 2, this.currentY);
    
    // Add new page for TOC
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private addTableOfContents(): void {
    this.doc.setTextColor(0, 0, 0);
    
    // TOC Title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Table of Contents', this.margin, this.currentY);
    this.currentY += 20;
    
    // TOC Entries
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.tocEntries.forEach(entry => {
      const yPos = this.currentY;
      
      // Section title
      this.doc.setFont('helvetica', entry.hasContent ? 'normal' : 'italic');
      this.doc.setTextColor(entry.hasContent ? 0 : 128, entry.hasContent ? 0 : 128, entry.hasContent ? 0 : 128);
      this.doc.text(entry.title, this.margin, yPos);
      
      // Page number
      const pageText = entry.page.toString();
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, yPos);
      
      // Dotted line
      const titleWidth = this.doc.getTextWidth(entry.title);
      const dotsStart = this.margin + titleWidth + 5;
      const dotsEnd = this.pageWidth - this.margin - pageWidth - 5;
      const dotSpacing = 3;
      
      for (let x = dotsStart; x < dotsEnd; x += dotSpacing) {
        this.doc.circle(x, yPos - 1, 0.2, 'F');
      }
      
      this.currentY += 12;
    });
    
    // Add new page for content
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private addTOCEntry(title: string, hasContent: boolean): void {
    this.tocEntries.push({
      title,
      page: this.doc.getNumberOfPages(),
      hasContent
    });
  }

  private addEmptyPlaceholder(sectionName: string, reason: string): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(128, 128, 128);
    
    // Add a subtle box around the placeholder
    this.checkPageBreak(25);
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setFillColor(250, 250, 250);
    this.doc.rect(this.margin, this.currentY - 5, this.contentWidth, 20, 'FD');
    
    this.doc.text(`${sectionName}: ${reason}`, this.margin + 10, this.currentY + 5);
    this.currentY += 20;
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
  }

  private addSessionHeader(data: PDFSessionData): void {
    // Session Focus section (simplified since details are on cover page)
    this.addTOCEntry('Session Focus', !!data.circumstance);
    
    this.addTitle('Session Focus', 14);
    if (data.circumstance && data.circumstance.trim()) {
      this.addText(data.circumstance, 11);
    } else {
      this.addEmptyPlaceholder('Session Focus', 'No specific focus was set for this session');
    }
    this.addSeparator();
  }

  private addSessionSummary(data: PDFSessionData): void {
    const hasSummary = !!data.summary;
    this.addTOCEntry('Session Summary', hasSummary);
    
    this.addTitle('Session Summary', 14);
    
    if (!hasSummary) {
      this.addEmptyPlaceholder('Session Summary', 'Summary will be available after session completion');
      this.addSeparator();
      return;
    }
    
    // Insight Summary
    this.addSubtitle('Key Insights');
    if (data.summary!.insightSummary && data.summary!.insightSummary.trim()) {
      this.addText(data.summary!.insightSummary);
    } else {
      this.addEmptyPlaceholder('Key Insights', 'No insights captured yet');
    }
    this.currentY += 5;

    // Reframed Belief
    this.addSubtitle('Reframed Belief');
    if (data.summary!.actualReframedBelief && data.summary!.actualReframedBelief.trim()) {
      this.addText(data.summary!.actualReframedBelief);
      
      if (data.summary!.reframedBeliefInteraction) {
        this.addText(`Question: ${data.summary!.reframedBeliefInteraction.aiQuestion}`, 9, 10);
        this.addText(`Your Response: ${data.summary!.reframedBeliefInteraction.userResponse}`, 9, 10);
      }
    } else {
      this.addEmptyPlaceholder('Reframed Belief', 'No reframed belief developed yet');
    }
    this.currentY += 5;

    // Legacy Statement
    this.addSubtitle('Legacy Statement');
    if (data.summary!.actualLegacyStatement && data.summary!.actualLegacyStatement.trim()) {
      this.addText(data.summary!.actualLegacyStatement);
      
      if (data.summary!.legacyStatementInteraction) {
        this.addText(`Question: ${data.summary!.legacyStatementInteraction.aiQuestion}`, 9, 10);
        this.addText(`Your Response: ${data.summary!.legacyStatementInteraction.userResponse}`, 9, 10);
      }
    } else {
      this.addEmptyPlaceholder('Legacy Statement', 'No legacy statement created yet');
    }
    this.currentY += 5;

    // Emotions
    this.addSubtitle('Key Emotions Explored');
    if (data.summary!.topEmotions && data.summary!.topEmotions.trim()) {
      this.addText(data.summary!.topEmotions);
    } else {
      this.addEmptyPlaceholder('Key Emotions', 'No emotions identified yet');
    }
    
    this.addSeparator();
  }

  private addJournalSection(data: PDFSessionData): void {
    const hasUserReflection = !!(data.userReflection && data.userReflection.trim());
    const hasGoals = !!(data.goals && data.goals.length > 0);
    const hasAIReflection = !!data.aiReflection;
    const hasAnyJournalContent = hasUserReflection || hasGoals || hasAIReflection;
    
    this.addTOCEntry('Personal Journal & Reflection', hasAnyJournalContent);
    this.addTitle('Personal Journal & Reflection', 14);
    
    // User Reflection
    this.addSubtitle('Your Personal Reflection');
    if (hasUserReflection) {
      this.addText(data.userReflection!);
    } else {
      this.addEmptyPlaceholder('Personal Reflection', 'No personal reflection entries yet');
    }
    this.currentY += 5;

    // Goals
    this.addSubtitle('Your Goals');
    if (hasGoals) {
      data.goals!.forEach((goal, index) => {
        const status = goal.completed ? '✓' : '○';
        this.addText(`${status} ${goal.text}`, 10, 5);
      });
    } else {
      this.addEmptyPlaceholder('Goals', 'No goals have been set for this session');
    }
    this.currentY += 5;

    // AI Reflection
    this.addSubtitle('AI-Generated Insights');
    if (hasAIReflection && data.aiReflection) {
      this.addText('Conversational Highlights:', 10);
      if (data.aiReflection.conversationalHighlights && data.aiReflection.conversationalHighlights.trim()) {
        this.addText(data.aiReflection.conversationalHighlights, 9, 5);
      } else {
        this.addEmptyPlaceholder('Conversational Highlights', 'No highlights captured yet');
      }
      this.currentY += 3;
      
      this.addText('Emotional Insights:', 10);
      if (data.aiReflection.emotionalInsights && data.aiReflection.emotionalInsights.trim()) {
        this.addText(data.aiReflection.emotionalInsights, 9, 5);
      } else {
        this.addEmptyPlaceholder('Emotional Insights', 'No emotional insights available yet');
      }
      this.currentY += 3;
      
      this.addText('Progress Reflection:', 10);
      if (data.aiReflection.progressReflection && data.aiReflection.progressReflection.trim()) {
        this.addText(data.aiReflection.progressReflection, 9, 5);
      } else {
        this.addEmptyPlaceholder('Progress Reflection', 'No progress reflection available yet');
      }
      this.currentY += 3;
      
      if (data.aiReflection.actionableItems && data.aiReflection.actionableItems.length > 0) {
        this.addText('Actionable Items:', 10);
        data.aiReflection.actionableItems.forEach(item => {
          this.addText(`• ${item}`, 9, 5);
        });
        this.currentY += 3;
      } else {
        this.addText('Actionable Items:', 10);
        this.addEmptyPlaceholder('Actionable Items', 'No actionable items identified yet');
        this.currentY += 3;
      }
      
      if (data.aiReflection.reflectionPrompts && data.aiReflection.reflectionPrompts.length > 0) {
        this.addText('Reflection Prompts:', 10);
        data.aiReflection.reflectionPrompts.forEach(prompt => {
          this.addText(`• ${prompt}`, 9, 5);
        });
        this.currentY += 3;
      } else {
        this.addText('Reflection Prompts:', 10);
        this.addEmptyPlaceholder('Reflection Prompts', 'No reflection prompts available yet');
        this.currentY += 3;
      }
      
      this.addText('Encouragement:', 10);
      if (data.aiReflection.encouragingMessage && data.aiReflection.encouragingMessage.trim()) {
        this.addText(data.aiReflection.encouragingMessage, 9, 5);
      } else {
        this.addEmptyPlaceholder('Encouragement', 'Encouraging message will be available after session completion');
      }
    } else {
      this.addEmptyPlaceholder('AI-Generated Insights', 'AI insights will be generated after session completion');
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
    // Reset TOC entries for new document
    this.tocEntries = [];
    
    // Add cover page
    this.addCoverPage(sessionData);
    
    // Generate content and collect TOC entries
    this.addSessionHeader(sessionData);
    this.addSessionSummary(sessionData);
    this.addJournalSection(sessionData);
    
    // Now go back and add the table of contents on page 2
    this.doc.setPage(2);
    this.currentY = this.margin;
    this.addTableOfContents();
    
    // Add footer to all pages
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
