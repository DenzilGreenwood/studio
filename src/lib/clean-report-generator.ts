// src/lib/clean-report-generator.ts
import { CleanSessionReport, CleanPDFData } from '@/types/clean-reports';
import type { ProtocolSession, ChatMessage } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Converts raw session data into clean, user-friendly reports
 */
export class CleanReportGenerator {
  
  /**
   * Generate a clean session report from raw session data
   */
  static generateCleanReport(
    session: ProtocolSession,
    messages: ChatMessage[]
  ): CleanSessionReport {
    
    // Extract clean insights from messy data
    const coreInsights = this.extractCoreInsights(session, messages);
    const progressMetrics = this.calculateProgressMetrics(session, messages);
    const actionableOutcomes = this.generateActionableOutcomes(session, messages);
    const sessionHighlights = this.createSessionHighlights(session, messages);
    
    return {
      reportId: session.sessionId,
      sessionId: session.sessionId,
      userId: session.userId,
      
      sessionDate: this.convertToDate(session.startTime),
      duration: this.calculateDuration(session),
      circumstance: session.circumstance,
      
      coreInsights,
      progressMetrics,
      actionableOutcomes,
      sessionHighlights,
      
      generatedAt: new Date(),
      reportVersion: 2, // Clean report version
      completeness: this.calculateCompleteness(session)
    };
  }
  
  /**
   * Extract core insights without showing raw conversation
   */
  private static extractCoreInsights(session: ProtocolSession, messages: ChatMessage[]) {
    const summary = session.summary;
    
    return {
      primaryBreakthrough: this.cleanText(
        summary?.insightSummary || 
        "Your session focused on exploring new perspectives and building clarity."
      ),
      
      newPerspective: this.cleanText(
        summary?.actualReframedBelief || 
        "A new way of thinking about your situation emerged during our conversation."
      ),
      
      personalLegacy: this.cleanText(
        summary?.actualLegacyStatement || 
        "You explored what you want to be remembered for and how to live with purpose."
      ),
      
      emotionalSummary: this.cleanText(
        summary?.emotionalJourney || 
        summary?.topEmotions || 
        "You experienced a range of emotions as you worked through your challenges."
      ),
      
      keyLearning: this.extractKeyLearning(messages)
    };
  }
  
  /**
   * Calculate meaningful progress metrics
   */
  private static calculateProgressMetrics(session: ProtocolSession, messages: ChatMessage[]) {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    const averageLength = userMessages.reduce((sum, msg) => sum + msg.text.length, 0) / userMessages.length;
    
    // Ensure engagementLevel is typed correctly
    let engagementLevel: 'high' | 'medium' | 'low';
    if (averageLength > 100) {
      engagementLevel = 'high';
    } else if (averageLength > 50) {
      engagementLevel = 'medium';
    } else {
      engagementLevel = 'low';
    }
    
    return {
      engagementLevel,
      breakthroughPhase: this.findBreakthroughPhase(messages),
      emotionalShift: this.assessEmotionalShift(session) as 'significant' | 'moderate' | 'mild',
      clarityGained: Math.min(10, Math.round(session.completedPhases * 1.5 + 2))
    };
  }
  
  /**
   * Generate actionable outcomes from session
   */
  private static generateActionableOutcomes(session: ProtocolSession, messages: ChatMessage[]) {
    const goals = session.goals || [];
    
    return {
      immediateSteps: this.extractImmediateSteps(session, messages),
      practiceAreas: this.identifyPracticeAreas(session, messages),
      reflectionPrompts: this.generateReflectionPrompts(session),
      followUpGoals: goals.map(goal => this.cleanText(goal.text)).slice(0, 5)
    };
  }
  
  /**
   * Create session highlights without raw conversation
   */
  private static createSessionHighlights(session: ProtocolSession, messages: ChatMessage[]) {
    return {
      keyMoments: this.extractKeyMoments(messages),
      conversationFlow: this.summarizeConversationFlow(messages),
      aiGuidanceStyle: this.assessAIStyle(messages) as 'supportive' | 'challenging' | 'explorative'
    };
  }
  
  /**
   * Helper methods for data extraction and cleaning
   */

  private static convertToDate(timestamp: Date | Timestamp | string | number): Date {
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
    return new Date(); // fallback
  }
  
  private static cleanText(text: string, maxLength: number = 200): string {
    if (!text) return '';
    
    // Remove excessive formatting, quotes, and AI artifacts
    let cleaned = text
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/^(AI|User|Human):\s*/i, '') // Remove speaker labels
      .trim();
    
    // Truncate if too long
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength - 3).trim() + '...';
    }
    
    return cleaned;
  }
  
  private static extractKeyLearning(messages: ChatMessage[]): string {
    // Find the most significant user insight
    const userInsights = messages
      .filter(msg => msg.sender === 'user' && msg.text.length > 50)
      .sort((a, b) => b.text.length - a.text.length);
    
    if (userInsights.length > 0) {
      return this.cleanText(userInsights[0].text, 150);
    }
    
    return "You gained new understanding about yourself and your situation.";
  }
  
  private static findBreakthroughPhase(messages: ChatMessage[]): number {
    // Look for phase with longest user responses (indicating engagement)
    const phaseEngagement = new Map<number, number>();
    
    messages.forEach(msg => {
      if (msg.sender === 'user') {
        const phase = this.extractPhaseNumber(msg.phaseName);
        const current = phaseEngagement.get(phase) || 0;
        phaseEngagement.set(phase, current + msg.text.length);
      }
    });
    
    let maxEngagement = 0;
    let breakthroughPhase = 3; // Default to middle phase
    
    phaseEngagement.forEach((engagement, phase) => {
      if (engagement > maxEngagement) {
        maxEngagement = engagement;
        breakthroughPhase = phase;
      }
    });
    
    return breakthroughPhase;
  }
  
  private static assessEmotionalShift(session: ProtocolSession): string {
    const emotionWords = session.summary?.topEmotions?.toLowerCase() || '';
    
    if (emotionWords.includes('breakthrough') || emotionWords.includes('clarity') || emotionWords.includes('relief')) {
      return 'significant';
    } else if (emotionWords.includes('understanding') || emotionWords.includes('hope') || emotionWords.includes('calm')) {
      return 'moderate';
    }
    
    return 'mild';
  }
  
  private static extractImmediateSteps(session: ProtocolSession, messages: ChatMessage[]): string[] {
    const steps: string[] = [];
    
    // Look for action-oriented language in user messages
    const actionMessages = messages.filter(msg => 
      msg.sender === 'user' && 
      (msg.text.includes('will') || msg.text.includes('going to') || msg.text.includes('plan to'))
    );
    
    actionMessages.forEach(msg => {
      const sentences = msg.text.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.includes('will') || sentence.includes('going to') || sentence.includes('plan to')) {
          steps.push(this.cleanText(sentence.trim(), 100));
        }
      });
    });
    
    // Fallback to generic steps if none found
    if (steps.length === 0) {
      steps.push(
        "Reflect on the insights gained in this session",
        "Practice the new perspective in daily situations",
        "Take one small action toward your goals"
      );
    }
    
    return steps.slice(0, 5);
  }
  
  private static identifyPracticeAreas(session: ProtocolSession, _messages: ChatMessage[]): string[] {
    const areas = new Set<string>();
    const circumstance = session.circumstance.toLowerCase();
    
    // Extract practice areas based on session focus
    if (circumstance.includes('work') || circumstance.includes('career')) {
      areas.add('Professional communication');
      areas.add('Work-life balance');
    }
    
    if (circumstance.includes('relationship') || circumstance.includes('family')) {
      areas.add('Emotional boundaries');
      areas.add('Active listening');
    }
    
    if (circumstance.includes('anxiety') || circumstance.includes('stress')) {
      areas.add('Mindfulness practice');
      areas.add('Stress management');
    }
    
    // Default areas if none specific identified
    if (areas.size === 0) {
      areas.add('Self-reflection');
      areas.add('Emotional awareness');
      areas.add('Goal setting');
    }
    
    return Array.from(areas).slice(0, 4);
  }
  
  private static generateReflectionPrompts(session: ProtocolSession): string[] {
    const prompts = [
      "What was the most surprising insight from this session?",
      "How do you feel different now compared to when you started?",
      "What would you tell someone facing a similar challenge?",
      "How will you remember this new perspective in challenging moments?"
    ];
    
    // Customize based on session content
    if (session.summary?.actualReframedBelief) {
      prompts.unshift("How does your new belief change how you see your situation?");
    }
    
    if (session.summary?.actualLegacyStatement) {
      prompts.push("What steps will you take to live according to your legacy vision?");
    }
    
    return prompts.slice(0, 5);
  }
  
  private static extractKeyMoments(messages: ChatMessage[]) {
    const moments: Array<{moment: string; phase: string; impact: 'high' | 'medium' | 'low'}> = [];
    
    // Find messages that indicate breakthrough moments
    messages.forEach(msg => {
      if (msg.sender === 'user' && msg.text.length > 80) {
        const text = msg.text.toLowerCase();
        let impact: 'high' | 'medium' | 'low' = 'low';
        
        if (text.includes('realize') || text.includes('understand') || text.includes('see now')) {
          impact = 'high';
        } else if (text.includes('think') || text.includes('feel') || text.includes('maybe')) {
          impact = 'medium';
        }
        
        moments.push({
          moment: this.cleanText(msg.text, 120),
          phase: msg.phaseName,
          impact
        });
      }
    });
    
    // Return top moments, prioritizing high impact
    return moments
      .sort((a, b) => {
        const impactScore = { high: 3, medium: 2, low: 1 };
        return impactScore[b.impact] - impactScore[a.impact];
      })
      .slice(0, 3);
  }
  
  private static summarizeConversationFlow(messages: ChatMessage[]) {
    const phases = {
      early: messages.filter(msg => this.extractPhaseNumber(msg.phaseName) <= 2),
      middle: messages.filter(msg => {
        const phase = this.extractPhaseNumber(msg.phaseName);
        return phase >= 3 && phase <= 4;
      }),
      late: messages.filter(msg => this.extractPhaseNumber(msg.phaseName) >= 5)
    };
    
    return {
      openingFocus: this.summarizePhaseMessages(phases.early),
      middleExploration: this.summarizePhaseMessages(phases.middle),
      closingInsights: this.summarizePhaseMessages(phases.late)
    };
  }
  
  private static assessAIStyle(messages: ChatMessage[]): string {
    const aiMessages = messages.filter(msg => msg.sender === 'ai');
    let supportiveCount = 0;
    let challengingCount = 0;
    let explorativeCount = 0;
    
    aiMessages.forEach(msg => {
      const text = msg.text.toLowerCase();
      
      if (text.includes('understand') || text.includes('hear you') || text.includes('that makes sense')) {
        supportiveCount++;
      }
      
      if (text.includes('what if') || text.includes('consider') || text.includes('challenge')) {
        challengingCount++;
      }
      
      if (text.includes('explore') || text.includes('tell me more') || text.includes('what do you think')) {
        explorativeCount++;
      }
    });
    
    if (supportiveCount > challengingCount && supportiveCount > explorativeCount) {
      return 'supportive';
    } else if (challengingCount > explorativeCount) {
      return 'challenging';
    }
    
    return 'explorative';
  }
  
  private static summarizePhaseMessages(messages: ChatMessage[]): string {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    
    if (userMessages.length === 0) {
      return "Initial exploration of the topic";
    }
    
    // Find the most representative message
    const representative = userMessages.reduce((prev, current) => 
      current.text.length > prev.text.length ? current : prev
    );
    
    return this.cleanText(representative.text, 100);
  }
  
  private static extractPhaseNumber(phaseName: string): number {
    const match = phaseName.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }
  
  private static calculateDuration(session: ProtocolSession): number {
    if (!session.endTime || !session.startTime) return 0;
    
    const start = this.convertToDate(session.startTime);
    const end = this.convertToDate(session.endTime);
    
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }
  
  private static calculateCompleteness(session: ProtocolSession): number {
    let score = 0;
    
    // Basic completion
    score += (session.completedPhases / 6) * 40;
    
    // Content quality
    if (session.summary?.actualReframedBelief) score += 20;
    if (session.summary?.actualLegacyStatement) score += 20;
    if (session.summary?.insightSummary) score += 10;
    if (session.goals && session.goals.length > 0) score += 10;
    
    return Math.min(100, score);
  }
}

/**
 * Convert clean report to PDF-optimized data
 */
export function convertToPDFData(report: CleanSessionReport): CleanPDFData {
  return {
    header: {
      title: "Personal Growth Session Report",
      sessionDate: report.sessionDate.toLocaleDateString(),
      duration: `${report.duration} minutes`,
      focus: report.circumstance
    },
    
    summary: {
      headline: `Clarity gained: ${report.progressMetrics.clarityGained}/10`,
      keyAchievement: report.coreInsights.primaryBreakthrough,
      emotionalJourney: report.coreInsights.emotionalSummary,
      mainInsight: report.coreInsights.keyLearning
    },
    
    insights: {
      newPerspective: report.coreInsights.newPerspective,
      personalLegacy: report.coreInsights.personalLegacy,
      keyLearning: report.coreInsights.keyLearning,
      actionSteps: report.actionableOutcomes.immediateSteps
    },
    
    reflection: {
      userThoughts: "Personal reflection space - to be filled by user",
      goals: report.actionableOutcomes.followUpGoals,
      commitments: report.actionableOutcomes.practiceAreas
    },
    
    guidance: {
      encouragement: "You showed courage in exploring difficult topics and gained valuable insights.",
      practicalTips: report.actionableOutcomes.immediateSteps,
      nextSteps: report.actionableOutcomes.reflectionPrompts
    },
    
    footer: {
      generatedDate: report.generatedAt.toLocaleDateString(),
      sessionId: report.sessionId,
      reportVersion: `v${report.reportVersion}`
    }
  };
}
