// src/lib/clean-pdf-generator.ts
import jsPDF from 'jspdf';
import { CleanPDFData } from '@/types/clean-reports';

export class CleanPDFGenerator {
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

  generatePDF(data: CleanPDFData): jsPDF {
    this.addCoverPage(data);
    this.addSummaryPage(data);
    this.addInsightsPage(data);
    this.addReflectionPage(data);
    this.addGuidancePage(data);
    
    return this.doc;
  }

  private addCoverPage(data: CleanPDFData): void {
    // Header with brand colors
    this.doc.setFillColor(37, 99, 235); // Blue-600
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.centerText('Personal Growth Report', 35);
    
    // Reset position and colors
    this.currentY = 70;
    this.doc.setTextColor(0, 0, 0);
    
    // Session info card
    this.addCard(() => {
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Session Overview', this.margin + 10, this.currentY + 15);
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Date: ${data.header.sessionDate}`, this.margin + 10, this.currentY + 30);
      this.doc.text(`Duration: ${data.header.duration}`, this.margin + 10, this.currentY + 42);
      this.doc.text(`Focus: ${this.wrapText(data.header.focus, 50)[0]}`, this.margin + 10, this.currentY + 54);
      
      if (this.wrapText(data.header.focus, 50).length > 1) {
        this.doc.text(this.wrapText(data.header.focus, 50)[1], this.margin + 10, this.currentY + 66);
      }
    }, 80);
    
    this.currentY += 100;
    
    // Key achievement highlight
    this.addHighlightBox('🎯 Key Achievement', data.summary.keyAchievement);
    
    // Footer
    this.currentY = this.pageHeight - 30;
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.centerText(`Generated on ${data.footer.generatedDate}`, this.currentY);
    this.centerText(`Session ID: ${data.footer.sessionId}`, this.currentY + 10);
    
    this.addPage();
  }

  private addSummaryPage(data: CleanPDFData): void {
    this.addPageHeader('Session Summary');
    
    // Clarity score
    this.addMetricCard('Clarity & Progress', data.summary.headline, '📈');
    
    this.currentY += 10;
    
    // Emotional journey
    this.addSection('Emotional Journey', data.summary.emotionalJourney, '💭');
    
    this.currentY += 10;
    
    // Main insight
    this.addSection('Key Learning', data.summary.mainInsight, '💡');
  }

  private addInsightsPage(data: CleanPDFData): void {
    this.addPageHeader('Your Insights');
    
    // New perspective
    this.addInsightCard('New Perspective', data.insights.newPerspective, '🔄');
    
    this.currentY += 10;
    
    // Personal legacy
    this.addInsightCard('Personal Legacy', data.insights.personalLegacy, '⭐');
    
    this.currentY += 15;
    
    // Action steps
    this.addActionSteps('Immediate Next Steps', data.insights.actionSteps);
  }

  private addReflectionPage(data: CleanPDFData): void {
    this.addPageHeader('Personal Reflection');
    
    // Reflection space
    this.addReflectionSpace();
    
    this.currentY += 10;
    
    // Goals section
    if (data.reflection.goals.length > 0) {
      this.addGoalsSection(data.reflection.goals);
    }
    
    this.currentY += 10;
    
    // Practice areas
    this.addPracticeAreas(data.reflection.commitments);
  }

  private addGuidancePage(data: CleanPDFData): void {
    this.addPageHeader('Moving Forward');
    
    // Encouragement
    this.addEncouragementBox(data.guidance.encouragement);
    
    this.currentY += 15;
    
    // Next steps
    this.addSection('Reflection Questions', '', '🤔');
    this.addBulletList(data.guidance.nextSteps);
    
    this.currentY += 15;
    
    // Practical tips
    this.addSection('Practice Tips', '', '🎯');
    this.addBulletList(data.guidance.practicalTips);
  }

  // Helper methods
  private addPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private addPageHeader(title: string): void {
    this.doc.setFillColor(248, 250, 252); // Gray-50
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    this.doc.setTextColor(30, 58, 138); // Blue-900
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.centerText(title, 25);
    
    this.currentY = 60;
    this.doc.setTextColor(0, 0, 0);
  }

  private addCard(content: () => void, height: number): void {
    const startY = this.currentY;
    
    this.doc.setDrawColor(229, 231, 235); // Gray-200
    this.doc.setFillColor(249, 250, 251); // Gray-50
    this.doc.rect(this.margin, startY, this.contentWidth, height, 'FD');
    
    content();
    
    this.currentY = startY + height;
  }

  private addHighlightBox(title: string, text: string): void {
    this.addCard(() => {
      this.doc.setFillColor(219, 234, 254); // Blue-100
      this.doc.rect(this.margin, this.currentY, this.contentWidth, 60, 'F');
      
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 58, 138); // Blue-900
      this.doc.text(title, this.margin + 10, this.currentY + 20);
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.addWrappedText(text, this.margin + 10, this.currentY + 35, this.contentWidth - 20);
    }, 60);
  }

  private addMetricCard(title: string, metric: string, icon: string): void {
    this.addCard(() => {
      this.doc.setFontSize(18);
      this.doc.text(icon, this.margin + 10, this.currentY + 20);
      
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(title, this.margin + 25, this.currentY + 20);
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(34, 197, 94); // Green-500
      this.doc.text(metric, this.margin + 10, this.currentY + 35);
      this.doc.setTextColor(0, 0, 0);
    }, 50);
  }

  private addSection(title: string, content: string, icon?: string): void {
    this.checkPageBreak(40);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(75, 85, 99); // Gray-600
    
    let titleText = title;
    if (icon) titleText = `${icon} ${title}`;
    
    this.doc.text(titleText, this.margin, this.currentY);
    this.currentY += 15;
    
    if (content) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.addWrappedText(content, this.margin, this.currentY, this.contentWidth);
      this.currentY += 20;
    }
  }

  private addInsightCard(title: string, text: string, icon: string): void {
    this.addCard(() => {
      this.doc.setFontSize(16);
      this.doc.text(icon, this.margin + 10, this.currentY + 18);
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(55, 65, 81); // Gray-700
      this.doc.text(title, this.margin + 25, this.currentY + 18);
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.addWrappedText(text, this.margin + 10, this.currentY + 30, this.contentWidth - 20);
    }, 55);
  }

  private addActionSteps(title: string, steps: string[]): void {
    this.addSection(title, '', '✅');
    this.addBulletList(steps);
  }

  private addBulletList(items: string[]): void {
    items.forEach(item => {
      this.checkPageBreak(15);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('•', this.margin + 5, this.currentY);
      this.addWrappedText(item, this.margin + 15, this.currentY, this.contentWidth - 15);
      this.currentY += 12;
    });
  }

  private addReflectionSpace(): void {
    this.addSection('Your Thoughts & Reflections', '', '✍️');
    
    // Add lined space for writing
    for (let i = 0; i < 8; i++) {
      this.checkPageBreak(10);
      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 12;
    }
  }

  private addGoalsSection(goals: string[]): void {
    if (goals.length === 0) return;
    
    this.addSection('Your Commitments', '', '🎯');
    goals.forEach(goal => {
      this.checkPageBreak(15);
      this.doc.setFontSize(10);
      this.doc.text('○', this.margin + 5, this.currentY);
      this.addWrappedText(goal, this.margin + 15, this.currentY, this.contentWidth - 15);
      this.currentY += 12;
    });
  }

  private addPracticeAreas(areas: string[]): void {
    if (areas.length === 0) return;
    
    this.addSection('Areas to Practice', '', '🏃‍♂️');
    this.addBulletList(areas);
  }

  private addEncouragementBox(text: string): void {
    this.addCard(() => {
      this.doc.setFillColor(254, 243, 199); // Yellow-100
      this.doc.rect(this.margin, this.currentY, this.contentWidth, 50, 'F');
      
      this.doc.setFontSize(16);
      this.doc.text('🌟', this.margin + 10, this.currentY + 20);
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(92, 57, 19); // Yellow-900
      this.addWrappedText(text, this.margin + 25, this.currentY + 15, this.contentWidth - 35);
      this.doc.setTextColor(0, 0, 0);
    }, 50);
  }

  private centerText(text: string, y: number): void {
    const textWidth = this.doc.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    this.doc.text(text, x, y);
  }

  private addWrappedText(text: string, x: number, y: number, maxWidth: number): void {
    const lines = this.wrapText(text, maxWidth);
    lines.forEach((line, index) => {
      this.doc.text(line, x, y + (index * 12));
    });
    this.currentY = y + (lines.length * 12);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    try {
      return this.doc.splitTextToSize(text, maxWidth);
    } catch {
      // Fallback for problematic text
      return [text.substring(0, 100) + '...'];
    }
  }

  private checkPageBreak(nextElementHeight: number): void {
    if (this.currentY + nextElementHeight > this.pageHeight - this.margin) {
      this.addPage();
    }
  }
}

export async function generateCleanPDF(data: CleanPDFData): Promise<Blob> {
  const generator = new CleanPDFGenerator();
  const pdf = generator.generatePDF(data);
  return pdf.output('blob');
}
