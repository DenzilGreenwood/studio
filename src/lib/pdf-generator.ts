// src/lib/pdf-generator.ts
import jsPDF from 'jspdf';

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
    if (!text || typeof text !== 'string') return;
    
    // Clean the text to remove any problematic characters
    const cleanText = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'normal');
    
    try {
      const lines = this.doc.splitTextToSize(cleanText, this.contentWidth - indent);
      
      for (const line of lines) {
        this.checkPageBreak(size + 2);
        this.doc.text(line, this.margin + indent, this.currentY);
        this.currentY += size + 2;
      }
    } catch (error) {
      console.warn('PDFGenerator: Error adding text, skipping:', error, { text: cleanText });
      // Add a placeholder for problematic text
      this.checkPageBreak(size + 2);
      this.doc.text('[Content could not be displayed]', this.margin + indent, this.currentY);
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
    
    // TOC Entries - Only show sections with content
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const entriesWithContent = this.tocEntries.filter(entry => entry.hasContent);
    
    if (entriesWithContent.length === 0) {
      this.doc.text('No content sections available', this.margin, this.currentY);
      this.currentY += 10;
    } else {
      entriesWithContent.forEach(entry => {
    
        // Check for page break within TOC
        this.checkPageBreak(12);
        
        // Section title
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(entry.title, this.margin, this.currentY);
        
        // Page number
      const pageText = entry.page.toString();
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, this.currentY);
      
      // Dotted line
      const titleWidth = this.doc.getTextWidth(entry.title);
      const dotsStart = this.margin + titleWidth + 5;
      const dotsEnd = this.pageWidth - this.margin - pageWidth - 5;
      const dotSpacing = 3;
      
      this.doc.setTextColor(128, 128, 128); // Gray color for dots
      for (let x = dotsStart; x < dotsEnd; x += dotSpacing) {
        this.doc.circle(x, this.currentY - 1, 0.2, 'F');
      }
      
      this.currentY += 12;
      });
    }
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    
    // TOC should stay on page 2 - no page break needed
  }

  private addTOCEntry(title: string, hasContent: boolean): void {
    this.tocEntries.push({
      title,
      page: this.doc.getNumberOfPages(), // This will be the actual page number where content appears
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

    // Goals - Enhanced Action Plan Format
    this.addSubtitle('🎯 Your Action Plan');
    if (hasGoals) {
      // Add action plan header box
      this.doc.setFillColor(248, 249, 250); // Light gray background
      this.doc.setDrawColor(108, 117, 125); // Gray border
      this.checkPageBreak(15);
      this.doc.rect(this.margin, this.currentY - 5, this.contentWidth, 12, 'FD');
      
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Your commitments for growth and positive change:', this.margin + 5, this.currentY + 3);
      this.currentY += 15;
      
      this.doc.setFont('helvetica', 'normal');
      data.goals!.forEach((goal, _index) => {
        this.checkPageBreak(15);
        
        // Goal status box
        const fillColor = goal.completed ? [220, 252, 231] : [254, 249, 195]; // Green if completed, yellow if pending
        const borderColor = goal.completed ? [34, 197, 94] : [245, 158, 11]; // Green or amber border
        this.doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        this.doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        this.doc.rect(this.margin, this.currentY - 3, this.contentWidth, 12, 'FD');
        
        // Status indicator
        const statusIcon = goal.completed ? '✅' : '🎯';
        const statusText = goal.completed ? 'COMPLETED' : 'IN PROGRESS';
        
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'bold');
        const textColor = goal.completed ? [21, 128, 61] : [146, 64, 14]; // Dark green or amber text
        this.doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        this.doc.text(`${statusIcon} ${statusText}`, this.margin + 5, this.currentY + 1);
        
        // Goal text
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        const goalLines = this.doc.splitTextToSize(goal.text, this.contentWidth - 20);
        this.doc.text(goalLines, this.margin + 5, this.currentY + 7);
        
        this.currentY += Math.max(12, goalLines.length * 5 + 7);
      });
      
      // Reset colors
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
    } else {
      this.addEmptyPlaceholder('Action Plan', 'No specific goals have been set for this session');
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

  private addExecutiveSummary(data: PDFSessionData): void {
    // Only add executive summary if we have meaningful content
    const hasContent = !!(data.summary?.insightSummary || data.summary?.actualReframedBelief || data.aiReflection?.conversationalHighlights);
    
    if (!hasContent) return;
    
    this.addTOCEntry('Executive Summary', true);
    this.addTitle('Executive Summary', 14);
    
    // Quick overview box
    this.doc.setFillColor(240, 248, 255); // Light blue background
    this.doc.setDrawColor(100, 149, 237); // Cornflower blue border
    this.checkPageBreak(40);
    this.doc.rect(this.margin, this.currentY - 5, this.contentWidth, 35, 'FD');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Takeaways from This Session:', this.margin + 10, this.currentY + 8);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    
    let summaryText = '';
    if (data.summary?.actualReframedBelief) {
      summaryText += `• New Belief: ${data.summary.actualReframedBelief.substring(0, 80)}${data.summary.actualReframedBelief.length > 80 ? '...' : ''}\n`;
    }
    if (data.summary?.topEmotions) {
      summaryText += `• Primary Emotions: ${data.summary.topEmotions}\n`;
    }
    if (data.goals && data.goals.length > 0) {
      summaryText += `• Goals Set: ${data.goals.length} action items to work on\n`;
    }
    
    const summaryLines = this.doc.splitTextToSize(summaryText, this.contentWidth - 20);
    this.doc.text(summaryLines, this.margin + 10, this.currentY + 18);
    
    this.currentY += 40;
    this.addSeparator();
  }

  private addHowToUseSection(): void {
    this.addTOCEntry('How to Use This Report', true);
    this.addTitle('How to Use This Report', 14);
    
    const instructions = [
      'This report captures your personal growth journey from this cognitive consulting session.',
      '',
      '📖 Session Summary: Review the key insights and breakthroughs from your session.',
      '',
      '🧠 AI Reflection: Your personalized AI-generated insights to deepen your understanding.',
      '',
      '✍️ Personal Journal: Your own thoughts and reflections - the most important part!',
      '',
      '🎯 Goals & Actions: Concrete steps you\'ve committed to taking forward.',
      '',
      '💡 How to get the most value:',
      '• Review this report within 24-48 hours while the session is fresh',
      '• Use the reflection prompts to continue your inner work',
      '• Check your progress on goals before your next session',
      '• Keep this report handy for future reference and growth tracking'
    ];
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    instructions.forEach(instruction => {
      if (instruction === '') {
        this.currentY += 5;
      } else {
        this.checkPageBreak(8);
        const lines = this.doc.splitTextToSize(instruction, this.contentWidth);
        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 6;
      }
    });
    
    this.addSeparator();
  }

  public async generateSessionPDF(sessionData: PDFSessionData): Promise<Blob> {
    try {
      console.log('PDFGenerator: generateSessionPDF called with data:', sessionData);
      
      // Validate essential data
      if (!sessionData.sessionId) {
        throw new Error('Session ID is required for PDF generation');
      }
      
      if (!sessionData.startTime) {
        throw new Error('Start time is required for PDF generation');
      }
      
      // Reset TOC entries for new document
      this.tocEntries = [];
      console.log('PDFGenerator: Starting with cover page...');
      
      // Add cover page (Page 1)
      this.addCoverPage(sessionData);
      console.log('PDFGenerator: Cover page added');
      
      // Reserve page 2 for TOC - we'll come back to it
      this.doc.addPage();
      const tocPageNumber = this.doc.getNumberOfPages();
      console.log('PDFGenerator: TOC page reserved at page', tocPageNumber);
      
      // Add content starting from Page 3
      this.doc.addPage();
      this.currentY = this.margin;
      console.log('PDFGenerator: Adding content sections...');
      
      this.addExecutiveSummary(sessionData);
      console.log('PDFGenerator: Executive summary added');
      
      this.addHowToUseSection();
      console.log('PDFGenerator: How to use section added');
      
      this.addSessionHeader(sessionData);
      console.log('PDFGenerator: Session header added');
      
      this.addSessionSummary(sessionData);
      console.log('PDFGenerator: Session summary added');
      
      this.addJournalSection(sessionData);
      console.log('PDFGenerator: Journal section added');
      
      this.addHowToUseSection();
      console.log('PDFGenerator: How to use section added');
      
      // Now go back and add the table of contents on page 2
      this.doc.setPage(tocPageNumber);
      this.currentY = this.margin;
      this.addTableOfContents();
      console.log('PDFGenerator: Table of contents added');
      
      // Add footer to all pages
      this.addFooter();
      console.log('PDFGenerator: Footer added to all pages');
      
      // Return PDF blob
      const blob = this.doc.output('blob');
      console.log('PDFGenerator: PDF blob created, size:', blob.size);
      return blob;
    } catch (error) {
      console.error('PDFGenerator: Error in generateSessionPDF:', error);
      throw error;
    }
  }

  public async downloadSessionPDF(sessionData: PDFSessionData, filename?: string): Promise<void> {
    try {
      console.log('PDFGenerator: Starting PDF generation with data:', {
        sessionId: sessionData.sessionId,
        hasCircumstance: !!sessionData.circumstance,
        hasSummary: !!sessionData.summary,
        hasUserReflection: !!sessionData.userReflection,
        hasGoals: !!(sessionData.goals && sessionData.goals.length > 0),
        hasAIReflection: !!sessionData.aiReflection
      });
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('PDF generation requires a browser environment');
      }
      
      const blob = await this.generateSessionPDF(sessionData);
      console.log('PDFGenerator: PDF blob generated successfully, size:', blob.size);
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty or invalid');
      }
      
      const url = URL.createObjectURL(blob);
      console.log('PDFGenerator: Object URL created:', url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `cognitive-insight-session-${sessionData.sessionId}.pdf`;
      
      // Add the link to the document and ensure it's focusable
      link.style.display = 'none';
      document.body.appendChild(link);
      
      console.log('PDFGenerator: Triggering download for:', link.download);
      
      // For better browser compatibility, try different download methods
      try {
        link.click();
      } catch (clickError) {
        console.warn('PDFGenerator: Click method failed, trying alternative:', clickError);
        // Fallback: try manual navigation
        window.open(url, '_blank');
      }
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('PDFGenerator: PDF download completed successfully');
    } catch (error) {
      console.error('PDFGenerator: Error in downloadSessionPDF:', error);
      throw error; // Re-throw to let the caller handle it
    }
  }
}

// Utility function to prepare session data for PDF
export function prepareSessionDataForPDF(sessionData: ProtocolSession): PDFSessionData {
  console.log('prepareSessionDataForPDF: Input session data:', sessionData);
  
  const convertTimestamp = (timestamp: unknown): Date => {
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
    console.warn('prepareSessionDataForPDF: Invalid timestamp format, using current date:', timestamp);
    return new Date();
  };

  const result = {
    sessionId: sessionData.sessionId || 'Unknown Session',
    circumstance: sessionData.circumstance || 'No specific focus set',
    startTime: convertTimestamp(sessionData.startTime),
    endTime: sessionData.endTime ? convertTimestamp(sessionData.endTime) : undefined,
    summary: sessionData.summary,
    userReflection: sessionData.userReflection,
    goals: sessionData.goals,
    aiReflection: sessionData.aiReflection
  };
  
  console.log('prepareSessionDataForPDF: Prepared data:', result);
  return result;
}
