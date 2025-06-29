// src/app/(app)/my-progress/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, collection, query, where, orderBy, getDocs } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Heart, 
  Lightbulb, 
  Award,
  BarChart3,
  Loader2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { generateCrossSessionAnalysis } from '@/ai/flows/cross-session-analysis-flow';
import type { CrossSessionAnalysisOutput } from '@/ai/flows/cross-session-analysis-flow';
import type { ProtocolSession } from '@/types';

type SessionWithId = ProtocolSession & { sessionId: string };

export default function MyProgressPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [analysis, setAnalysis] = useState<CrossSessionAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    fetchSessionsAndAnalyze();
  }, [firebaseUser, authLoading]);

  const fetchSessionsAndAnalyze = async () => {
    if (!firebaseUser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch completed sessions
      const sessionsQuery = query(
        collection(db, `users/${firebaseUser.uid}/sessions`),
        where('completedPhases', '==', 6),
        where('isDeleted', '!=', true),
        orderBy('startTime', 'desc')
      );

      const querySnapshot = await getDocs(sessionsQuery);
      const sessionsData: SessionWithId[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ProtocolSession;
        sessionsData.push({
          ...data,
          sessionId: doc.id
        });
      });

      setSessions(sessionsData);

      // Generate analysis if we have enough sessions
      if (sessionsData.length >= 2) {
        await generateAnalysis(sessionsData);
      }

    } catch (e: any) {
      console.error("Error fetching sessions:", e);
      setError("Failed to load your progress data.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalysis = async (sessionData: SessionWithId[]) => {
    setIsGeneratingAnalysis(true);

    try {
      const analysisInput = {
        sessions: sessionData.map(session => ({
          date: session.startTime instanceof Date 
            ? session.startTime.toLocaleDateString() 
            : session.startTime.toDate().toLocaleDateString(),
          circumstance: session.circumstance,
          reframedBelief: session.summary?.actualReframedBelief || '',
          legacyStatement: session.summary?.actualLegacyStatement || '',
          topEmotions: session.summary?.topEmotions || '',
          emotionalJourney: session.summary?.emotionalJourney,
          keyBreakthroughs: [], // Could be enhanced to extract from session data
          goals: session.goals?.map(g => g.text) || [],
          completedGoals: session.goals?.filter(g => g.completed).length || 0,
          duration: session.endTime ? Math.round(
            ((session.endTime instanceof Date ? session.endTime.getTime() : session.endTime.toDate().getTime()) 
            - (session.startTime instanceof Date ? session.startTime.getTime() : session.startTime.toDate().getTime())) 
            / (1000 * 60)
          ) : 0
        })),
        timeFrame: `last ${sessionData.length} sessions`,
        userAge: undefined, // Could be added to user profile
        focusArea: undefined // Could be inferred from common themes
      };

      const analysisResult = await generateCrossSessionAnalysis(analysisInput);
      setAnalysis(analysisResult);

    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not generate your progress analysis. Please try again.'
      });
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading your progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSessionsAndAnalyze}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/sessions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sessions
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary mb-2">My Progress</h1>
            <p className="text-muted-foreground">Track your growth across multiple sessions</p>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Not Enough Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete at least 2 sessions to see your progress analysis.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                You currently have {sessions.length} completed session{sessions.length === 1 ? '' : 's'}.
              </p>
              <Button asChild>
                <Link href="/protocol">Start New Session</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/sessions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-primary mb-2">My Progress</h1>
          <p className="text-muted-foreground">Your growth journey across {sessions.length} sessions</p>
        </div>

        {isGeneratingAnalysis && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Analyzing your growth patterns...</p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Overall Growth Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Growth Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{analysis.overallGrowthSummary}</p>
              </CardContent>
            </Card>

            {/* Progress Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Emotional Resilience</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={analysis.progressIndicators.emotionalResilience.improvement === 'significant' ? 'default' : 'secondary'}
                    className="mb-3"
                  >
                    {analysis.progressIndicators.emotionalResilience.improvement.charAt(0).toUpperCase() + 
                     analysis.progressIndicators.emotionalResilience.improvement.slice(1)} Progress
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {analysis.progressIndicators.emotionalResilience.evidence}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Self-Awareness</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={analysis.progressIndicators.selfAwareness.improvement === 'significant' ? 'default' : 'secondary'}
                    className="mb-3"
                  >
                    {analysis.progressIndicators.selfAwareness.improvement.charAt(0).toUpperCase() + 
                     analysis.progressIndicators.selfAwareness.improvement.slice(1)} Growth
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {analysis.progressIndicators.selfAwareness.evidence}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Goal Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Progress value={analysis.progressIndicators.goalAchievement.rate} className="flex-1" />
                    <span className="text-sm font-medium">{analysis.progressIndicators.goalAchievement.rate}%</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {analysis.progressIndicators.goalAchievement.trend === 'improving' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : analysis.progressIndicators.goalAchievement.trend === 'declining' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Target className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {analysis.progressIndicators.goalAchievement.trend}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.progressIndicators.goalAchievement.analysis}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Patterns and Milestones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recurring Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Patterns & Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Emotional Patterns</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.recurringPatterns.emotionalPatterns.map((pattern, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Common Challenges</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysis.recurringPatterns.challengeTypes.map((challenge, index) => (
                        <li key={index}>• {challenge}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Effective Strategies</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysis.recurringPatterns.copingStrategies.map((strategy, index) => (
                        <li key={index}>• {strategy}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Celebrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Milestones & Celebrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-4">
                      {analysis.celebrationsAndMilestones.map((milestone, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-semibold text-sm">{milestone.milestone}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.significance}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {milestone.evidence}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Belief Evolution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Belief Evolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Your Core Beliefs</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.beliefEvolution.coreBeliefsIdentified.map((belief, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {belief}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How Your Beliefs Have Evolved</h4>
                  <p className="text-muted-foreground">{analysis.beliefEvolution.evolutionStory}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recommendations for Continued Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Areas for Continued Growth</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysis.recommendations.areasForContinuedGrowth.map((area, index) => (
                      <li key={index}>• {area}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Strengths to Leverage</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysis.recommendations.strengthsToLeverage.map((strength, index) => (
                      <li key={index}>• {strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Focus for Next Sessions</h4>
                  <p className="text-muted-foreground">{analysis.recommendations.focusForNextSessions}</p>
                </div>
              </CardContent>
            </Card>

            {/* Inspirational Message */}
            <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
              <CardContent className="text-center py-8">
                <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-primary mb-2">A Message for You</p>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {analysis.inspirationalMessage}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/protocol">Start New Session</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sessions">Review Past Sessions</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
