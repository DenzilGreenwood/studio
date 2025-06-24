// src/app/(app)/session-report/[sessionId]/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation'; 
import { useAuth } from '@/context/auth-context';
import { db, doc, getDoc, collection, query, orderBy, getDocs, Timestamp, updateDoc, serverTimestamp, writeBatch } from '@/lib/firebase';
import type { ProtocolSession, ChatMessage as FirestoreChatMessage, UserProfile, Goal } from '@/types'; 
import { generateGoals, type GoalGeneratorInput } from '@/ai/flows/goal-generator-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Brain, User, Loader2, AlertTriangle, FileText, Lightbulb, Milestone, Bot, MessageSquare, Edit3, CheckCircle, Download, Shield, PenSquare, Target, Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; 
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PostSessionFeedback } from '@/components/feedback/post-session-feedback';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DisplayMessage extends FirestoreChatMessage {
  id: string; 
}

type ReportSessionData = ProtocolSession & {
  chatMessages: DisplayMessage[];
  sessionForUser?: UserProfile | null;
};


export default function SessionReportPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams(); 
    const sessionId = params.sessionId as string;
    const { firebaseUser, user: authProfile, loading: authLoading } = useAuth();
    const { toast } = useToast(); 
    const isAdmin = useIsAdmin();
    const userIdFromQuery = searchParams.get('userId');

    const [sessionData, setSessionData] = useState<ReportSessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

    // New state for Journaling & Goals
    const [reflectionText, setReflectionText] = useState('');
    const [userGoals, setUserGoals] = useState<Goal[]>([]);
    const [newGoalText, setNewGoalText] = useState('');
    const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
    const [suggestedGoals, setSuggestedGoals] = useState<string[]>([]);
    const [isSavingJournal, setIsSavingJournal] = useState(false);

    const canEditJournal = !isSavingJournal && !(isAdmin && !!userIdFromQuery);
    const completedGoals = useMemo(() => userGoals.filter(g => g.completed).length, [userGoals]);
    const totalGoals = userGoals.length;


  useEffect(() => {
    const reviewSubmitted = searchParams?.get('review_submitted') === 'true';
    const newUrl = `/session-report/${sessionId}`;

    if (reviewSubmitted) {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
        variant: "default", 
      });
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, sessionId, toast, router]);


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

    const fetchSessionData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const targetUserId = isAdmin && userIdFromQuery ? userIdFromQuery : firebaseUser.uid;
        const sessionDocRef = doc(db, `users/${targetUserId}/sessions/${sessionId}`);
        const sessionSnap = await getDoc(sessionDocRef);

        if (!sessionSnap.exists()) {
          notFound();
          return;
        }

        const fetchedSessionData = sessionSnap.data() as ProtocolSession;
        
        const convertTimestampFields = (data: ProtocolSession): ProtocolSession => {
          const convert = (field: any) => field instanceof Timestamp ? field.toDate() : (field ? new Date(field) : undefined);
          return {
            ...data,
            startTime: convert(data.startTime)!, 
            endTime: convert(data.endTime),
            feedbackSubmittedAt: data.feedbackSubmittedAt ? convert(data.feedbackSubmittedAt) : undefined,
            summary: data.summary ? { ...data.summary, generatedAt: convert(data.summary.generatedAt)! } : undefined,
            userReflectionUpdatedAt: data.userReflectionUpdatedAt ? convert(data.userReflectionUpdatedAt) : undefined,
            goals: data.goals?.map(g => ({ ...g, createdAt: convert(g.createdAt)! })) || [],
          };
        };

        const processedSessionData = convertTimestampFields(fetchedSessionData);
        setReflectionText(processedSessionData.userReflection || '');
        setUserGoals(processedSessionData.goals || []);
        
        let sessionForUser: UserProfile | null = null;
        if (isAdmin && userIdFromQuery) {
            const userDocRef = doc(db, `users/${userIdFromQuery}`);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) sessionForUser = userSnap.data() as UserProfile;
        } else {
            sessionForUser = authProfile;
        }

        const messagesQuery = query(collection(db, `users/${targetUserId}/sessions/${sessionId}/messages`), orderBy("timestamp", "asc"));
        const messagesSnap = await getDocs(messagesQuery);
        const fetchedMessages: DisplayMessage[] = messagesSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          timestamp: (docSnap.data().timestamp as Timestamp)?.toDate() || new Date(),
        } as DisplayMessage));
        
        setSessionData({ 
            ...processedSessionData, 
            chatMessages: fetchedMessages,
            sessionForUser: sessionForUser
        });

      } catch (e: any) {
        console.error("Error fetching session report:", e);
        setError(e.message || "Failed to load session report.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, firebaseUser, authProfile, authLoading, router, isAdmin, userIdFromQuery]);

    const getInitials = (name?: string | null) => {
        if (!name) return "?";
        const nameParts = name.split(' ').filter(Boolean);
        if (nameParts.length === 0) return "?";
        if (nameParts.length === 1 && nameParts[0]) return nameParts[0][0]!.toUpperCase();
        if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length-1]) {
        return (nameParts[0][0]! + nameParts[nameParts.length - 1]![0]!).toUpperCase();
        }
        return "?";
    };
    
    const handleFeedbackSubmitted = (feedbackId: string) => {
        setIsReviewDialogOpen(false);
        setSessionData(prev => prev ? { ...prev, feedbackId: feedbackId } : null);
        toast({ title: "Feedback Submitted", description: "Thank you for your valuable input!" });
    };

  const handleGenerateGoals = async () => {
    if (!reflectionText.trim()) {
        toast({
            variant: 'destructive',
            title: 'Cannot Generate Goals',
            description: 'Please write a reflection first to give the AI some context.',
        });
        return;
    }
    setIsGeneratingGoals(true);
    setSuggestedGoals([]);
    try {
        const input: GoalGeneratorInput = {
            sessionSummary: sessionData?.summary?.insightSummary || 'No summary available.',
            userReflection: reflectionText
        };
        const result = await generateGoals(input);
        setSuggestedGoals(result.suggestedGoals);
    } catch(e: any) {
        console.error("Error generating goals:", e);
        toast({ variant: 'destructive', title: 'Goal Generation Failed', description: 'Could not get suggestions from the AI.' });
    } finally {
        setIsGeneratingGoals(false);
    }
  };

  const addSuggestedGoal = (goalText: string) => {
    if (!userGoals.some(g => g.text === goalText)) {
        setUserGoals(prev => [...prev, { text: goalText, completed: false, createdAt: new Date() }]);
    }
    setSuggestedGoals(prev => prev.filter(g => g !== goalText));
  };
  
  const handleAddNewGoal = () => {
      if(newGoalText.trim()){
          setUserGoals(prev => [...prev, { text: newGoalText.trim(), completed: false, createdAt: new Date() }]);
          setNewGoalText('');
      }
  };

  const toggleGoalCompletion = (index: number) => {
    setUserGoals(prev => prev.map((goal, i) => i === index ? { ...goal, completed: !goal.completed } : goal));
  };

  const removeGoal = (index: number) => {
    setUserGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveJournalAndGoals = async () => {
    if (!firebaseUser || !sessionData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save. Missing user or session data.'});
      return;
    }
    setIsSavingJournal(true);
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

      toast({ title: 'Journal & Goals Saved', description: 'Your progress has been successfully saved.' });
    } catch (e: any) {
      console.error("Error saving journal and goals:", e);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your journal. Please try again.' });
    } finally {
      setIsSavingJournal(false);
    }
  };
  
  const handleDownloadPdf = async () => {
    toast({title: "PDF Download", description: "PDF generation logic needs to be updated to include new journal section."});
  }

    if (isLoading || authLoading) {
        return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-primary">
            <Loader2 className="h-16 w-16 animate-spin" />
            <p className="mt-4 font-headline text-xl">Loading Session Report...</p>
        </div>
        );
    }

    if (error) {
        return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl text-center">
            <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center justify-center">
                <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild>
                <Link href="/sessions">Go Back to History</Link>
                </Button>
            </CardContent>
            </Card>
        </div>
        );
    }

    if (!sessionData) {
        return ( 
        <div className="container mx-auto p-4 md:p-8 max-w-3xl text-center">
            <p>No session data available.</p>
            <Button asChild className="mt-4">
                <Link href="/sessions">Go Back to History</Link>
            </Button>
        </div>
        );
    }

  const { summary, feedbackId, sessionForUser, circumstance } = sessionData;
  const userToDisplay = sessionForUser || authProfile;

  return (
    <div className="bg-secondary/30 min-h-screen py-8">
      <div className="container mx-auto p-4 md:p-6 max-w-3xl">
        {isAdmin && userIdFromQuery && (
          <Card className="mb-6 bg-accent/20 border-accent">
              <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-accent-foreground/80">
                      <Shield size={20} /> Admin View
                  </CardTitle>
                  <CardDescription>
                      You are viewing the report for user: <span className="font-medium text-foreground">{userToDisplay?.displayName || userToDisplay?.email} ({userToDisplay?.uid})</span>
                  </CardDescription>
              </CardHeader>
          </Card>
        )}

        <Card id="sessionReportContent" className="shadow-xl bg-card">
          <CardHeader className="bg-primary/5 rounded-t-lg p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <FileText className="h-8 w-8 text-primary" />
                        <CardTitle className="font-headline text-3xl text-primary">CognitiveInsight Summary</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                        Session ID: {sessionId} <br />
                        Date: {new Date(sessionData.startTime as Date).toLocaleDateString()} at {new Date(sessionData.startTime as Date).toLocaleTimeString()}
                    </CardDescription>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    {!feedbackId ? (
                      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="default" disabled={isAdmin && !!userIdFromQuery}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Leave a Review
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                           {firebaseUser && circumstance && (
                              <PostSessionFeedback
                                sessionId={sessionId}
                                userId={firebaseUser.uid}
                                circumstance={circumstance}
                                onFeedbackSubmitted={handleFeedbackSubmitted}
                              />
                           )}
                        </DialogContent>
                      </Dialog>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600 p-2 border border-green-200 bg-green-50 rounded-md">
                           <CheckCircle className="h-5 w-5" /> 
                           <span>Review Submitted</span>
                        </div>
                    )}
                     <Button
                        variant="outline"
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="w-full sm:w-auto"
                      >
                        {isGeneratingPdf ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Download PDF
                      </Button>
                    <Button variant="outline" onClick={() => router.push('/sessions')} className="w-full sm:w-auto">
                        Back to History
                    </Button>
                </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {summary ? (
              <>
                <section>
                  <h2 className="font-headline text-xl font-semibold text-foreground mb-3 flex items-center">
                    <Lightbulb className="h-6 w-6 mr-2 text-accent" />
                    Reframed Belief
                  </h2>
                  {summary.reframedBeliefInteraction && (
                    <Card className="mb-3 p-4 bg-muted/30 border-dashed">
                      <p className="text-xs text-foreground/90 mb-1 font-medium flex items-center">
                        <Bot className="h-4 w-4 mr-2 text-accent" />
                        AI's Question:
                      </p>
                      <p className="text-sm text-muted-foreground italic mb-3">"{summary.reframedBeliefInteraction.aiQuestion}"</p>
                      <p className="text-xs text-foreground/90 mb-1 font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        Your Answer:
                      </p>
                      <p className="text-sm text-muted-foreground italic">"{summary.reframedBeliefInteraction.userResponse}"</p>
                    </Card>
                  )}
                  <p className="text-muted-foreground bg-background p-3 rounded-md border"><strong className="text-primary">Final Belief:</strong> {summary.actualReframedBelief}</p>
                </section>

                <section>
                  <h2 className="font-headline text-xl font-semibold text-foreground mb-3 flex items-center">
                    <Milestone className="h-6 w-6 mr-2 text-accent" />
                    Legacy Statement
                  </h2>
                  {summary.legacyStatementInteraction && (
                    <Card className="mb-3 p-4 bg-muted/30 border-dashed">
                      <p className="text-xs text-foreground/90 mb-1 font-medium flex items-center">
                        <Bot className="h-4 w-4 mr-2 text-accent" />
                        AI's Question:
                      </p>
                      <p className="text-sm text-muted-foreground italic mb-3">"{summary.legacyStatementInteraction.aiQuestion}"</p>
                      <p className="text-xs text-foreground/90 mb-1 font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        Your Answer:
                      </p>
                      <p className="text-sm text-muted-foreground italic">"{summary.legacyStatementInteraction.userResponse}"</p>
                    </Card>
                  )}
                  <p className="text-muted-foreground bg-background p-3 rounded-md border"><strong className="text-primary">Final Statement:</strong> {summary.actualLegacyStatement}</p>
                </section>
                
                {summary.topEmotions && (
                    <section>
                        <h2 className="font-headline text-xl font-semibold text-foreground mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent h-6 w-6"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                            Top Emotions
                        </h2>
                        <p className="text-muted-foreground bg-background p-3 rounded-md border">{summary.topEmotions}</p>
                    </section>
                )}

                {summary.insightSummary && (
                    <section className="pt-4 border-t">
                        <h2 className="font-headline text-xl font-semibold text-foreground mb-3 flex items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent h-6 w-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 0-1.5-.67-1.5-1.5V8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5z"/></svg>
                            AI Generated Insight
                        </h2>
                        <p className="text-muted-foreground bg-background p-3 rounded-md border whitespace-pre-line">
                            {summary.insightSummary}
                        </p>
                    </section>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">No summary information available for this session.</p>
            )}

            <section className="pt-6 border-t">
                <Card className="bg-secondary/30 border-secondary shadow-inner">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <PenSquare className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="font-headline text-2xl text-primary">Journal & Goals</CardTitle>
                                <CardDescription>Reflect on your session and set meaningful goals for what comes next.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="reflection" className="text-lg font-semibold text-foreground flex items-center mb-2">Your Private Reflection</Label>
                            <Textarea
                                id="reflection"
                                value={reflectionText}
                                onChange={(e) => setReflectionText(e.target.value)}
                                placeholder="What are your thoughts now, looking back at this session? Use this space to track your evolution. This is only visible to you."
                                className="min-h-[150px] text-base bg-background"
                                disabled={!canEditJournal}
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-foreground flex items-center mb-2">
                                <Target className="mr-2 h-5 w-5"/>
                                Your Goals & Achievements
                            </h3>
                            <div className="p-4 bg-background rounded-md border space-y-4">
                                {userGoals.length > 0 ? (
                                    <div className="space-y-3">
                                      <p className="text-sm text-muted-foreground">{completedGoals} of {totalGoals} completed.</p>
                                      {userGoals.map((goal, index) => (
                                          <div key={index} className="flex items-center gap-3 group">
                                              <Checkbox id={`goal-${index}`} checked={goal.completed} onCheckedChange={() => toggleGoalCompletion(index)} disabled={!canEditJournal} />
                                              <label htmlFor={`goal-${index}`} className={cn("flex-1 text-sm cursor-pointer", goal.completed && "line-through text-muted-foreground")}>{goal.text}</label>
                                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeGoal(index)} disabled={!canEditJournal}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                              </Button>
                                          </div>
                                      ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No goals defined yet. Add one below or get AI suggestions.</p>
                                )}
                                
                                {canEditJournal && (
                                <div className="flex items-center gap-2 pt-4 border-t">
                                    <Input 
                                        value={newGoalText}
                                        onChange={e => setNewGoalText(e.target.value)}
                                        placeholder="Add a new goal manually"
                                        disabled={!canEditJournal}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewGoal()}
                                    />
                                    <Button onClick={handleAddNewGoal} disabled={!canEditJournal || !newGoalText.trim()}><PlusCircle className="mr-2"/>Add</Button>
                                </div>
                                )}
                            </div>
                        </div>

                        {canEditJournal && (
                            <div className="space-y-4">
                                <Button onClick={handleGenerateGoals} disabled={isGeneratingGoals} variant="outline" className="w-full">
                                    {isGeneratingGoals ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating...</>
                                    ) : (
                                        <><Sparkles className="mr-2 h-4 w-4 text-accent"/>Get AI Goal Suggestions</>
                                    )}
                                </Button>
                                {suggestedGoals.length > 0 && (
                                    <div className="p-4 bg-background rounded-md border space-y-3">
                                        <h4 className="text-sm font-semibold">AI Suggestions (click to add):</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestedGoals.map((g, i) => (
                                                <Button key={i} variant="secondary" size="sm" onClick={() => addSuggestedGoal(g)}>
                                                    <PlusCircle className="mr-2 h-4 w-4"/> {g}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleSaveJournalAndGoals} disabled={!canEditJournal} className="w-full sm:w-auto">
                            {isSavingJournal ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                'Save Journal & Goals'
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </section>

            <section className="pt-6 border-t">
              <h2 className="font-headline text-xl font-semibold text-foreground mb-4 flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-accent" />
                Full Session Transcript
              </h2>
              <ScrollArea className="h-[400px] md:h-[500px] w-full rounded-md border p-4 bg-muted/20">
                <div className="space-y-6">
                  {sessionData.chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-3',
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.sender === 'ai' && (
                        <Avatar className="h-8 w-8 self-start">
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            <Brain size={18} />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="max-w-[75%]">
                        <div
                          className={cn(
                            'rounded-xl px-4 py-3 shadow-sm text-sm md:text-base break-words',
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-card text-card-foreground border border-border rounded-bl-none'
                          )}
                        >
                          {msg.text.split('\n').map((line, index, arr) => (
                              <React.Fragment key={index}>
                                  {line}
                                  {index < arr.length - 1 && <br />}
                              </React.Fragment>
                          ))}
                        </div>
                        <p className={cn("text-xs text-muted-foreground mt-1 px-1", msg.sender === 'user' ? 'text-right' : 'text-left')}>
                           {msg.phaseName} - {msg.timestamp ? new Date(msg.timestamp as Date).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                       {msg.sender === 'user' && firebaseUser && (
                        <Avatar className="h-8 w-8 self-start">
                           <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(userToDisplay?.displayName || userToDisplay?.email)}
                           </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </section>
          </CardContent>
        </Card>
        <footer className="py-6 mt-4 text-center text-sm text-muted-foreground border-t">
            &copy; 2024 CognitiveInsight. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
