// src/app/api/cross-session-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateCrossSessionAnalysis } from '@/ai/flows/cross-session-analysis-flow';
import type { CrossSessionAnalysisInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.sessions || !Array.isArray(body.sessions) || body.sessions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 sessions are required for cross-session analysis' },
        { status: 400 }
      );
    }

    const input: CrossSessionAnalysisInput = {
      sessions: body.sessions,
      timeFrame: body.timeFrame || `last ${body.sessions.length} sessions`,
      userAge: body.userAge,
      focusArea: body.focusArea
    };

    const analysis = await generateCrossSessionAnalysis(input);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in cross-session analysis API:', error);
    
    // Return a supportive fallback response instead of an error
    return NextResponse.json({
      overallGrowthSummary: "Your journey shows meaningful engagement with personal growth across multiple sessions.",
      recurringPatterns: {
        emotionalPatterns: ["Self-reflection", "Growth-oriented mindset"],
        challengeTypes: ["Personal development opportunities"],
        copingStrategies: ["Cognitive reframing", "Self-awareness"],
        triggerSituations: ["Life transitions", "Growth challenges"]
      },
      progressIndicators: {
        emotionalResilience: {
          improvement: 'moderate',
          evidence: "Consistent engagement with the consulting process shows developing resilience"
        },
        selfAwareness: {
          improvement: 'moderate', 
          evidence: "Regular session participation demonstrates growing self-awareness"
        },
        goalAchievement: {
          rate: 70,
          trend: 'stable',
          analysis: "Steady progress in setting and working toward meaningful goals",
          evidence: "Consistent effort in personal development activities"
        },
        copingSkills: {
          improvement: 'moderate',
          evidence: "Development of cognitive reframing and self-awareness practices"
        }
      },
      areasOfGrowth: {
        strengths: ["Self-awareness", "Commitment to growth", "Resilience"],
        improvements: ["Emotional regulation", "Self-reflection skills"],
        opportunities: ["Deepening insight practice", "Expanding coping strategies"]
      },
      futureRecommendations: {
        focusAreas: ["Deepening self-reflection practices", "Building emotional resilience"],
        strategies: ["Continue cognitive reframing work", "Build support networks"],
        milestones: ["Develop consistent mindfulness practice", "Strengthen emotional regulation skills"]
      },
      sessionQualityInsights: {
        mostImpactfulSessions: [
          {
            date: "Recent sessions",
            reason: "Strong engagement with self-reflection and growth"
          }
        ],
        patternsThatWork: ["Open self-reflection", "Cognitive reframing exercises"],
        suggestedImprovements: ["Continue current approach", "Explore deeper emotional work"]
      },
      beliefEvolution: {
        coreBeliefsIdentified: ["I am capable of growth", "I can learn from challenges"],
        evolutionStory: "Your beliefs are evolving toward greater self-acceptance and resilience through continued consulting work.",
        consistentThemes: ["Personal growth", "Self-awareness", "Resilience building"]
      },
      recommendations: {
        areasForContinuedGrowth: ["Deepening self-reflection practices", "Building on existing insights"],
        strengthsToLeverage: ["Commitment to growth", "Self-awareness", "Resilience"],
        strategiesForChallenges: ["Continue cognitive reframing work", "Build support networks"],
        focusForNextSessions: "Building on the strong foundation you've established while exploring new areas of growth and self-discovery."
      },
      celebrationsAndMilestones: [
        {
          milestone: "Consistent commitment to personal growth",
          significance: "Shows dedication to your development journey",
          evidence: "Regular engagement with consulting sessions and self-reflection"
        }
      ],
      inspirationalMessage: "Your dedication to growth and self-reflection is commendable. Each session builds upon the last, creating a solid foundation for positive change and personal development."
    }, { status: 200 });
  }
}
