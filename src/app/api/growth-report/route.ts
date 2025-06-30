// src/app/api/growth-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, collection, query, where, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import type { ProtocolSession } from '@/types';

interface GrowthReportData {
  userId: string;
  timeFrame: string;
  totalSessions: number;
  emotionalTrends: {
    session: string;
    date: string;
    primaryEmotions: string[];
  }[];
  recurringThemes: string[];
  goalAchievementRate: number;
  beliefEvolution: {
    session: string;
    date: string;
    reframedBelief: string;
  }[];
  insights: {
    overallProgress: string;
    strengthsIdentified: string[];
    areasForFocus: string[];
    nextSteps: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, timeFrameDays = 90 } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeFrameDays);

    // Fetch sessions from the specified time period
    const sessionsQuery = query(
      collection(db, `users/${userId}/sessions`),
      where('completedPhases', '==', 6),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime', 'desc')
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    if (sessionsSnapshot.empty) {
      return NextResponse.json({
        error: 'No completed sessions found in the specified time period',
        suggestion: 'Complete a few more sessions to generate a meaningful growth report'
      }, { status: 404 });
    }

    const sessions = sessionsSnapshot.docs.map(doc => {
      const data = doc.data() as ProtocolSession;
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime)
      };
    });

    // Generate growth report data
    const growthReport: GrowthReportData = {
      userId,
      timeFrame: `Last ${timeFrameDays} days`,
      totalSessions: sessions.length,
      
      // Extract emotional trends
      emotionalTrends: sessions.map(session => ({
        session: session.id,
        date: session.startTime.toLocaleDateString(),
        primaryEmotions: session.summary?.topEmotions?.split(',').map(e => e.trim()) || []
      })),
      
      // Identify recurring themes
      recurringThemes: extractRecurringThemes(sessions),
      
      // Calculate goal achievement rate
      goalAchievementRate: calculateGoalAchievementRate(sessions),
      
      // Track belief evolution
      beliefEvolution: sessions
        .filter(s => s.summary?.actualReframedBelief)
        .map(session => ({
          session: session.id,
          date: session.startTime.toLocaleDateString(),
          reframedBelief: session.summary!.actualReframedBelief
        })),
      
      // Generate insights
      insights: generateGrowthInsights(sessions)
    };

    return NextResponse.json(growthReport);

  } catch (error) {
    console.error('Error generating growth report:', error);
    return NextResponse.json(
      { error: 'Failed to generate growth report' },
      { status: 500 }
    );
  }
}

function extractRecurringThemes(sessions: any[]): string[] {
  const themes = new Map<string, number>();
  
  sessions.forEach(session => {
    if (session.circumstance) {
      // Simple keyword extraction - could be enhanced with NLP
      const words = session.circumstance.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4 && !['that', 'this', 'with', 'when', 'where', 'what', 'have', 'been', 'will', 'they', 'their', 'there'].includes(word));
      
      words.forEach(word => {
        themes.set(word, (themes.get(word) || 0) + 1);
      });
    }
  });
  
  return Array.from(themes.entries())
    .filter(([_, count]) => count >= 2) // Appears in at least 2 sessions
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);
}

function calculateGoalAchievementRate(sessions: any[]): number {
  const allGoals = sessions.flatMap(session => session.goals || []);
  if (allGoals.length === 0) return 0;
  
  const completedGoals = allGoals.filter(goal => goal.completed);
  return Math.round((completedGoals.length / allGoals.length) * 100);
}

function generateGrowthInsights(sessions: any[]): GrowthReportData['insights'] {
  const recentSessions = sessions.slice(0, 3);
  const olderSessions = sessions.slice(3);
  
  return {
    overallProgress: sessions.length > 3 
      ? "Your consistent engagement with multiple sessions shows a strong commitment to personal growth."
      : "You're building a foundation for meaningful personal development.",
      
    strengthsIdentified: [
      "Self-reflection and introspection",
      "Willingness to explore challenging emotions",
      "Commitment to personal growth"
    ],
    
    areasForFocus: [
      "Continue working on identified patterns",
      "Focus on goal completion and follow-through",
      "Deepen awareness of emotional triggers"
    ],
    
    nextSteps: [
      "Schedule regular check-ins on goal progress",
      "Consider keeping a daily reflection journal",
      "Focus on applying insights to daily situations"
    ]
  };
}
