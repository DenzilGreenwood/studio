// src/app/(app)/journal/[sessionId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db, doc, getDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, collection, query, where, orderBy, getDocs } from '@/lib/firebase';
import { generateSessionReflection } from '@/ai/flows/session-reflection-flow';
import type { ProtocolSession, Goal } from '@/types';
import type { SessionReflectionInput, SessionReflectionOutput } from '@/ai/flows/session-reflection-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Heart, Target, Lightbulb, MessageSquare, Plus, Trash2, ArrowLeft, Sparkles, BookOpen, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface JournalSessionData {
  sessionId: string;
  userId: string;
  circumstance: string;
  startTime: Date;
  endTime?: Date;
  completedPhases: number;
  summary?: {
    insightSummary: string;
    actualReframedBelief: string;
    actualLegacyStatement: string;
    topEmotions: string;
    reframedBeliefInteraction?: { aiQuestion: string; userResponse: string } | null;
    legacyStatementInteraction?: { aiQuestion: string; userResponse: string } | null;
    generatedAt: Date;
  };
  userReflection?: string;
  userReflectionUpdatedAt?: Date;
  goals?: Goal[];
  feedbackId?: string;
  feedbackSubmittedAt?: Date;
  aiReflection?: SessionReflectionOutput & { generatedAt?: Date };
}

export default function JournalPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { firebaseUser, user: authProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [sessionData, setSessionData] = useState<JournalSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);

  // Journal state
  const [reflectionText, setReflectionText] = useState('');
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      router.push('/login');
      return;
    }
    if (!sessionId) {
      notFound();
      return;
    }

    fetchSessionData();
  }, [sessionId, firebaseUser, authLoading, router]);

  const fetchSessionData = async () => {
    if (!firebaseUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionDocRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      const sessionSnap = await getDoc(sessionDocRef);

      if (!sessionSnap.exists()) {
        notFound();
        return;
      }

      const fetchedSessionData = sessionSnap.data() as ProtocolSession;
      
      // Convert timestamps
      const convertTimestampFields = (data: ProtocolSession): JournalSessionData => {
        const convert = (field: any) => field instanceof Timestamp ? field.toDate() : (field ? new Date(field) : undefined);
        return {
          ...data,
          startTime: convert(data.startTime)!,
          endTime: convert(data.endTime),
          feedbackSubmittedAt: data.feedbackSubmittedAt ? convert(data.feedbackSubmittedAt) : undefined,
          summary: data.summary ? { ...data.summary, generatedAt: convert(data.summary.generatedAt)! } : undefined,
          userReflectionUpdatedAt: data.userReflectionUpdatedAt ? convert(data.userReflectionUpdatedAt) : undefined,
          goals: data.goals?.map(g => ({ ...g, createdAt: convert(g.createdAt)! })) || [],
          aiReflection: data.aiReflection ? {
            ...data.aiReflection,
            generatedAt: convert(data.aiReflection.generatedAt)
          } : undefined,
        };
      };

      const processedSessionData = convertTimestampFields(fetchedSessionData);
      setSessionData(processedSessionData);
      setReflectionText(processedSessionData.userReflection || '');
      setUserGoals(processedSessionData.goals || []);

    } catch (e: any) {
      console.error("Error fetching session data:", e);
      setError(e.message || "Failed to load session data.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIReflection = async () => {
    if (!sessionData || !firebaseUser) return;

    setIsGeneratingReflection(true);
    try {
      // Fetch previous sessions for context
      const sessionsQuery = query(
        collection(db, `users/${firebaseUser.uid}/sessions`),
        where('completedPhases', '==', 6),
        orderBy('startTime', 'desc')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const previousSessions = sessionsSnapshot.docs
        .filter(doc => doc.id !== sessionId)
        .slice(0, 5) // Last 5 sessions for context
        .map(doc => {
          const data = doc.data() as ProtocolSession;
          return {
            date: data.startTime instanceof Timestamp ? data.startTime.toDate().toLocaleDateString() : new Date(data.startTime).toLocaleDateString(),
            circumstance: data.circumstance,
            reframedBelief: data.summary?.actualReframedBelief,
            legacyStatement: data.summary?.actualLegacyStatement,
            goals: data.goals?.map(g => g.text) || [],
            completed: data.goals?.every(g => g.completed) || false
          };
        });

      const reflectionInput: SessionReflectionInput = {
        sessionSummary: sessionData.summary?.insightSummary || '',
        actualReframedBelief: sessionData.summary?.actualReframedBelief || '',
        actualLegacyStatement: sessionData.summary?.actualLegacyStatement || '',
        topEmotions: sessionData.summary?.topEmotions || '',
        userReflection: reflectionText,
        circumstance: sessionData.circumstance,
        sessionDate: sessionData.startTime.toLocaleDateString(),
        previousSessions: previousSessions.length > 0 ? previousSessions : undefined
      };

      const aiReflection = await generateSessionReflection(reflectionInput);

      // Save the AI reflection to the session
      const sessionDocRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      await updateDoc(sessionDocRef, {
        aiReflection: aiReflection,
        reflectionGeneratedAt: serverTimestamp()
      });

      setSessionData(prev => prev ? {
        ...prev,
        aiReflection: {
          ...aiReflection,
          generatedAt: new Date()
        }
      } : null);

      toast({
        title: 'Reflection Generated',
        description: 'Your personalized session reflection is ready!'
      });

    } catch (error: any) {
      console.error('Error generating AI reflection:', error);
      toast({
        variant: 'destructive',
        title: 'Reflection Failed',
        description: 'Could not generate reflection. Please try again.'
      });
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    
    const newGoal: Goal = {
      text: newGoalText.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setUserGoals(prev => [...prev, newGoal]);
    setNewGoalText('');
  };

  const toggleGoalCompletion = (index: number) => {
    setUserGoals(prev => prev.map((goal, i) => 
      i === index ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const removeGoal = (index: number) => {
    setUserGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveJournal = async () => {
    if (!firebaseUser || !sessionData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save. Missing session data.' });
      return;
    }

    setIsSaving(true);
    try {
      const sessionDocRef = doc(db, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      const userDocRef = doc(db, `users/${firebaseUser.uid}`);
      
      const goalsToSave = userGoals.map(g => ({
        ...g,
        createdAt: g.createdAt instanceof Date ? Timestamp.fromDate(g.createdAt) : g.createdAt
      }));

      const batch = writeBatch(db);
      batch.update(sessionDocRef, {
        userReflection: reflectionText,
        goals: goalsToSave,
        userReflectionUpdatedAt: serverTimestamp(),
      });
      batch.update(userDocRef, { lastCheckInAt: serverTimestamp() });
      await batch.commit();

      toast({ title: 'Journal Saved', description: 'Your reflection and goals have been saved.' });
    } catch (e: any) {
      console.error("Error saving journal:", e);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your journal. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-primary">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="mt-4 font-headline text-xl">Loading Your Journal...</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-3xl text-center">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Journal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || 'Session not found'}</p>
            <Button asChild>
              <Link href="/sessions">Go Back to Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedGoals = userGoals.filter(g => g.completed).length;
  const totalGoals = userGoals.length;

  return (
    <div className="bg-secondary/30 min-h-screen py-8">
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href={`/session-report/${sessionId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Report
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Journal & Reflection
            </h1>
            <p className="text-muted-foreground">
              Session from {sessionData.startTime.toLocaleDateString()} • {sessionData.circumstance}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - AI Reflection */}
          <div className="space-y-6">
            {/* AI Reflection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Reflection & Insights
                </CardTitle>
                <CardDescription>
                  Personalized insights and encouragement from your session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionData.aiReflection ? (
                  <div className="space-y-4">
                    {/* Conversational Highlights */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Session Highlights
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {sessionData.aiReflection.conversationalHighlights}
                      </p>
                    </div>

                    {/* Emotional Insights */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2">
                        Emotional Journey
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {sessionData.aiReflection.emotionalInsights}
                      </p>
                    </div>

                    {/* Progress Reflection */}
                    {sessionData.aiReflection.progressReflection && (
                      <div>
                        <h4 className="font-semibold text-sm text-primary mb-2">
                          Your Growth Journey
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {sessionData.aiReflection.progressReflection}
                        </p>
                      </div>
                    )}

                    {/* Encouraging Message */}
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                      <p className="text-sm font-medium text-accent-foreground">
                        {sessionData.aiReflection.encouragingMessage}
                      </p>
                    </div>

                    {/* Actionable Items */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Actionable Items
                      </h4>
                      <ul className="space-y-2">
                        {sessionData.aiReflection.actionableItems.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Reflection Prompts */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Questions for Deeper Reflection
                      </h4>
                      <ul className="space-y-2">
                        {sessionData.aiReflection.reflectionPrompts.map((prompt: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground italic">
                            • {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Generated {sessionData.aiReflection?.generatedAt?.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Generate a personalized reflection and insights for this session
                    </p>
                    <Button 
                      onClick={generateAIReflection} 
                      disabled={isGeneratingReflection}
                      className="w-full"
                    >
                      {isGeneratingReflection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Reflection...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate AI Reflection
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Personal Journal */}
          <div className="space-y-6">
            {/* Personal Reflection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Your Personal Reflection
                </CardTitle>
                <CardDescription>
                  Write your thoughts, insights, and feelings about this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="How did this session impact you? What insights resonated most? What changes do you want to make moving forward?"
                  className="min-h-[200px] text-base"
                />
              </CardContent>
            </Card>

            {/* Goals & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Goals & Actions
                </CardTitle>
                <CardDescription>
                  Track your commitments and progress
                  {totalGoals > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {completedGoals}/{totalGoals} completed
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Goals List */}
                {userGoals.length > 0 ? (
                  <div className="space-y-3">
                    {userGoals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-3 group">
                        <Checkbox
                          id={`goal-${index}`}
                          checked={goal.completed}
                          onCheckedChange={() => toggleGoalCompletion(index)}
                        />
                        <label
                          htmlFor={`goal-${index}`}
                          className={cn(
                            "flex-1 text-sm cursor-pointer",
                            goal.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {goal.text}
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => removeGoal(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No goals set yet. Add one below to start tracking your progress.
                  </p>
                )}

                {/* Add New Goal */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Input
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Add a new goal or action item"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                  />
                  <Button onClick={handleAddGoal} disabled={!newGoalText.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSaveJournal} disabled={isSaving} className="w-full" size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Journal
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
