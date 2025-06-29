// src/app/(app)/journal-v2/[sessionId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db, doc, updateDoc, Timestamp } from '@/lib/firebase';
import type { SessionReport, SessionJournal, Goal } from '@/types/session-reports';
import { getCompleteSessionDataWithMigration, generateJournalAssistance } from '@/lib/session-report-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Heart, Target, Lightbulb, MessageSquare, Plus, Trash2, ArrowLeft, Sparkles, BookOpen, Save, Download, PlusCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AiChatAssistant } from '@/components/journal/ai-chat-assistant';
import Link from 'next/link';

export default function JournalV2Page() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { firebaseUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [report, setReport] = useState<SessionReport | null>(null);
  const [journal, setJournal] = useState<SessionJournal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAssistance, setIsGeneratingAssistance] = useState(false);

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
      const { report: reportData, journal: journalData, session, wasMigrated } = await getCompleteSessionDataWithMigration(firebaseUser.uid, sessionId);

      if (!reportData) {
        setError("Session report not found. This session may not be completed or may need to be migrated to the new structure.");
        return;
      }

      if (session?.isDeleted) {
        setError("This session has been moved to trash. Please restore it from the trash to access the journal.");
        return;
      }

      // Show migration success message if applicable
      if (wasMigrated) {
        toast({
          title: 'Session Migrated',
          description: 'Your session has been successfully migrated to the new journal system!'
        });
      }

      setReport(reportData);
      setJournal(journalData);
      setReflectionText(journalData?.userReflection || '');
      setUserGoals(journalData?.goals || []);

    } catch (e: any) {
      console.error("Error fetching session data:", e);
      setError(e.message || "Failed to load session data.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIAssistance = async () => {
    if (!report || !firebaseUser) return;

    setIsGeneratingAssistance(true);
    try {
      const assistance = await generateJournalAssistance(firebaseUser.uid, sessionId);
      
      if (assistance) {
        // Refresh journal data to get the updated AI assistance
        await fetchSessionData();
        
        toast({
          title: 'AI Assistance Generated',
          description: 'Your personalized journaling assistance is ready!'
        });
      } else {
        throw new Error('Failed to generate assistance');
      }
    } catch (error: any) {
      console.error('Error generating AI assistance:', error);
      toast({
        variant: 'destructive',
        title: 'Assistance Failed',
        description: 'Could not generate AI assistance. Please try again.'
      });
    } finally {
      setIsGeneratingAssistance(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      text: newGoalText.trim(),
      completed: false,
      createdAt: new Date(),
      priority: 'medium'
    };
    
    setUserGoals(prev => [...prev, newGoal]);
    setNewGoalText('');
  };

  const toggleGoalCompletion = (goalId: string) => {
    setUserGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: !goal.completed, completedAt: !goal.completed ? new Date() : undefined }
        : goal
    ));
  };

  const removeGoal = (goalId: string) => {
    setUserGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleSaveJournal = async () => {
    if (!firebaseUser || !report) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save. Missing session data.' });
      return;
    }

    setIsSaving(true);
    try {
      const journalRef = doc(db, `users/${firebaseUser.uid}/journals/${sessionId}`);
      
      const completedGoals = userGoals.filter(g => g.completed).length;
      const journalCompleteness = calculateJournalCompleteness(reflectionText, userGoals);
      
      const updateData = {
        userReflection: reflectionText,
        reflectionWordCount: reflectionText.split(' ').length,
        goals: userGoals,
        completedGoals: completedGoals,
        journalCompleteness: journalCompleteness,
        reflectionUpdatedAt: Timestamp.fromDate(new Date()),
        goalsUpdatedAt: Timestamp.fromDate(new Date()),
        lastAccessedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(journalRef, updateData);

      // Update report to reflect journal status
      const reportRef = doc(db, `users/${firebaseUser.uid}/reports/${sessionId}`);
      await updateDoc(reportRef, {
        hasJournal: true
      });

      toast({ title: 'Journal Saved', description: 'Your reflection and goals have been saved.' });
    } catch (e: any) {
      console.error("Error saving journal:", e);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your journal. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateJournalCompleteness = (reflection: string, goals: Goal[]): number => {
    let completeness = 0;
    
    if (reflection && reflection.length > 100) completeness += 60;
    else if (reflection && reflection.length > 50) completeness += 30;
    else if (reflection && reflection.length > 0) completeness += 15;
    
    if (goals.length >= 3) completeness += 40;
    else if (goals.length >= 1) completeness += 20;
    
    return Math.min(completeness, 100);
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-primary">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="mt-4 font-headline text-xl">Loading Your Journal...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-3xl text-center">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center gap-2">
              <BookOpen className="h-6 w-6" />
              Error Loading Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || 'Session report not found'}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/sessions">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Sessions
                </Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link href="/protocol">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start New Session
                </Link>
              </Button>
            </div>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href={`/session-report/${sessionId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Report
              </Link>
            </Button>
            <div>
              <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Enhanced Journal
              </h1>
              <p className="text-muted-foreground">
                Session from {(report.startTime instanceof Date ? report.startTime : report.startTime.toDate()).toLocaleDateString()} • {report.circumstance}
              </p>
              {journal && (
                <Badge variant="secondary" className="mt-1">
                  {journal.journalCompleteness}% Complete
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - AI Assistance */}
          <div className="space-y-6">
            {/* Session Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-accent" />
                  Session Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-primary mb-2">Key Insights</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {report.insights.insightSummary}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-primary mb-2">Your Reframed Belief</h4>
                  <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-md border border-accent/20">
                    "{report.insights.primaryReframe}"
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-primary mb-2">Your Legacy Statement</h4>
                  <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-md border border-accent/20">
                    "{report.insights.legacyStatement}"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Journaling Assistance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Journaling Assistance
                </CardTitle>
                <CardDescription>
                  Personalized guidance for your reflection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {journal?.aiJournalSupport ? (
                  <div className="space-y-4">
                    {/* Conversational Highlights */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Session Highlights
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {journal.aiJournalSupport.conversationalHighlights}
                      </p>
                    </div>

                    {/* Encouragement */}
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                      <p className="text-sm font-medium text-accent-foreground">
                        {journal.aiJournalSupport.encouragement}
                      </p>
                    </div>

                    {/* Actionable Insights */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Actionable Insights
                      </h4>
                      <ul className="space-y-2">
                        {journal.aiJournalSupport.actionableInsights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Reflection Prompts */}
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Reflection Prompts
                      </h4>
                      <ul className="space-y-2">
                        {journal.aiJournalSupport.reflectionPrompts.map((prompt: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground italic">
                            • {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Progress Tracking */}
                    {journal.aiJournalSupport.progressTracking && (
                      <div>
                        <h4 className="font-semibold text-sm text-primary mb-2">Your Growth Journey</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {journal.aiJournalSupport.progressTracking}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      AI assistance generated {(journal.aiJournalSupport.generatedAt instanceof Date ? journal.aiJournalSupport.generatedAt : journal.aiJournalSupport.generatedAt.toDate()).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Generate personalized journaling assistance based on your session report
                    </p>
                    <Button 
                      onClick={generateAIAssistance} 
                      disabled={isGeneratingAssistance}
                      className="w-full"
                    >
                      {isGeneratingAssistance ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Assistance...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate AI Assistance
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Chat Assistant */}
            {report && (
              <AiChatAssistant
                sessionSummary={report.insights.insightSummary}
                reframedBelief={report.insights.primaryReframe}
                legacyStatement={report.insights.legacyStatement}
                topEmotions={report.insights.topEmotions}
                circumstance={report.circumstance}
                currentReflection={reflectionText}
                currentGoals={userGoals.map(g => g.text)}
              />
            )}
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
                  Write your thoughts and insights about this session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reflection Prompts */}
                {journal?.aiJournalSupport?.personalizedQuestions && journal.aiJournalSupport.personalizedQuestions.length > 0 && (
                  <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                    <h4 className="font-semibold text-sm text-primary mb-2">💭 Reflection Starters</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {journal.aiJournalSupport.personalizedQuestions.slice(0, 3).map((question: string, index: number) => (
                        <li key={index} className="italic">• {question}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder={journal?.aiJournalSupport?.personalizedQuestions && journal.aiJournalSupport.personalizedQuestions.length > 0 
                    ? "Use the prompts above to guide your reflection, or write freely about your session experience..."
                    : "How did this session impact you? What insights resonated most? What changes do you want to make moving forward?"
                  }
                  className="min-h-[250px] text-base"
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{reflectionText.split(' ').filter(word => word.trim()).length} words</span>
                  <span className="text-right">
                    {reflectionText.length > 100 ? "Great depth! 📝" : 
                     reflectionText.length > 50 ? "Good start! ✨" : 
                     reflectionText.length > 0 ? "Keep going... 💭" : ""}
                  </span>
                </div>
                
                {/* Quick Action Buttons */}
                {reflectionText.length === 0 && journal?.aiJournalSupport?.reflectionPrompts && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Quick start with a guided prompt:</p>
                    <div className="flex flex-wrap gap-2">
                      {journal.aiJournalSupport.reflectionPrompts.slice(0, 2).map((prompt: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setReflectionText(prompt + "\n\n")}
                          className="text-xs"
                        >
                          {prompt.split(' ').slice(0, 3).join(' ')}...
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
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
                {/* AI Suggested Actions */}
                {journal?.aiJournalSupport?.actionableInsights && journal.aiJournalSupport.actionableInsights.length > 0 && userGoals.length === 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                    <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI-Suggested Actions
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">Click to add as goals:</p>
                    <div className="space-y-2">
                      {journal.aiJournalSupport.actionableInsights.slice(0, 3).map((insight: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-left h-auto p-2 text-xs justify-start w-full"
                          onClick={() => {
                            const newGoal: Goal = {
                              id: `ai-goal-${Date.now()}-${index}`,
                              text: insight,
                              completed: false,
                              createdAt: new Date(),
                              priority: 'medium'
                            };
                            setUserGoals(prev => [...prev, newGoal]);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="text-left">{insight}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals List */}
                {userGoals.length > 0 ? (
                  <div className="space-y-3">
                    {userGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={goal.completed}
                          onCheckedChange={() => toggleGoalCompletion(goal.id)}
                        />
                        <label
                          htmlFor={`goal-${goal.id}`}
                          className={cn(
                            "flex-1 text-sm cursor-pointer",
                            goal.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {goal.text}
                          {goal.completed && goal.completedAt && (
                            <span className="text-xs text-green-600 ml-2">
                              ✓ {(goal.completedAt instanceof Date ? goal.completedAt : goal.completedAt.toDate()).toLocaleDateString()}
                            </span>
                          )}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {goal.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => removeGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    
                    {completedGoals > 0 && (
                      <div className="text-center py-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          🎉 {completedGoals} goal{completedGoals === 1 ? '' : 's'} completed!
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      No goals set yet. Set meaningful actions to build on your session insights.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try the AI suggestions above or create your own below.
                    </p>
                  </div>
                )}

                {/* Add New Goal */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
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
                  
                  {userGoals.length > 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                      💡 Tip: Make goals specific and actionable for better success
                    </div>
                  )}
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
