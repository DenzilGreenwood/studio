// src/app/(app)/session-report/[sessionId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; 
import { useAuth } from '@/context/auth-context';
import { db, doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import type { ProtocolSession, ChatMessage as FirestoreChatMessage, UserProfile } from '@/types'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Brain, User, Loader2, AlertTriangle, FileText, Lightbulb, Milestone, Bot, MessageSquare, Edit3, CheckCircle, Download, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; 
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PostSessionFeedback } from '@/components/feedback/post-session-feedback';
import { useIsAdmin } from '@/hooks/use-is-admin';

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

  useEffect(() => {
    if (searchParams?.get('review_submitted') === 'true') {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
        variant: "default", 
      });
      router.replace(`/session-report/${sessionId}`, { scroll: false });
    }
  }, [searchParams, sessionId, toast, router]);


  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      router.push('/login');
      return;
    }
    if (!sessionId) {
      setError("Session ID is missing.");
      setIsLoading(false);
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
          setError("Session not found or you don't have permission to view it.");
          setIsLoading(false);
          return;
        }

        const fetchedSessionData = sessionSnap.data() as ProtocolSession;
        
        let sessionForUser: UserProfile | null = null;
        if (isAdmin && userIdFromQuery) {
            const userDocRef = doc(db, `users/${userIdFromQuery}`);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                sessionForUser = userSnap.data() as UserProfile;
            }
        } else {
            sessionForUser = authProfile;
        }


        const messagesQuery = query(
          collection(db, `users/${targetUserId}/sessions/${sessionId}/messages`),
          orderBy("timestamp", "asc")
        );
        const messagesSnap = await getDocs(messagesQuery);
        const fetchedMessages: DisplayMessage[] = messagesSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          timestamp: (docSnap.data().timestamp as Timestamp)?.toDate() || new Date(),
        } as DisplayMessage));
        
        const convertTimestampFields = (data: ProtocolSession): ProtocolSession => {
          const convertIfTimestamp = (field: any) => 
            field instanceof Timestamp ? field.toDate() : (field ? new Date(field) : undefined);

          return {
            ...data,
            startTime: convertIfTimestamp(data.startTime)!, 
            endTime: convertIfTimestamp(data.endTime),
            feedbackSubmittedAt: data.feedbackSubmittedAt ? convertIfTimestamp(data.feedbackSubmittedAt) : undefined,
            summary: data.summary ? {
              ...data.summary,
              generatedAt: convertIfTimestamp(data.summary.generatedAt)!, 
            } : undefined,
          };
        };
        
        setSessionData({ 
            ...convertTimestampFields(fetchedSessionData), 
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
    // Optimistically update the UI to show "Review Submitted"
    setSessionData(prev => prev ? { ...prev, feedbackId: feedbackId } : null);
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your valuable input!",
    });
  };


  const handleDownloadPdf = async () => {
    if (!sessionData || !firebaseUser) {
      toast({ variant: "destructive", title: "Error", description: "Session data not available for PDF generation." });
      return;
    }

    setIsGeneratingPdf(true);
    toast({ title: "Generating PDF...", description: "This may take a few moments. Please wait." });

    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
      const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();
      const MARGIN = 15; // General margin for content
      const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;

      // Font sizes (in points, jsPDF handles conversion)
      const HEADER_FOOTER_FONT_SIZE = 8;
      const BODY_FONT_SIZE = 10; 
      const SMALL_FONT_SIZE = 9;
      const SECTION_TITLE_FONT_SIZE = 14;
      const MAIN_TITLE_FONT_SIZE = 18;

      // Line heights (approximate, in mm)
      const LINE_HEIGHT_BODY = 5; 
      const LINE_HEIGHT_SMALL = 4.5; 
      const LINE_HEIGHT_SECTION_TITLE = 7; 
      const LINE_HEIGHT_MAIN_TITLE = 9; 

      const HEADER_TEXT = "Cognitive Insight Report";
      const HEADER_Y_TEXT = MARGIN - 5; 
      const HEADER_Y_LINE = MARGIN - 2; 
      const HEADER_SPACE = 10; 

      const FOOTER_Y_TEXT = PAGE_HEIGHT - MARGIN + 8; 
      const FOOTER_Y_LINE = PAGE_HEIGHT - MARGIN + 5;  
      const FOOTER_SPACE = 10; 
      
      const CONTENT_TOP_MARGIN = MARGIN + HEADER_SPACE;
      const CONTENT_BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN - FOOTER_SPACE;

      let yPosition = CONTENT_TOP_MARGIN;
      let currentPageNum = 1;

      const drawHeader = (docInstance: jsPDF) => {
        docInstance.setFontSize(HEADER_FOOTER_FONT_SIZE);
        docInstance.setFont(undefined, 'normal');
        docInstance.setTextColor(128, 128, 128); // Grey
        docInstance.text(HEADER_TEXT, PAGE_WIDTH / 2, HEADER_Y_TEXT, { align: 'center' });
        docInstance.setDrawColor(200, 200, 200); // Light grey line
        docInstance.line(MARGIN, HEADER_Y_LINE, PAGE_WIDTH - MARGIN, HEADER_Y_LINE);
      };

      const drawFooter = (docInstance: jsPDF, sessId: string, pageNum: number, totalPagesVal: number) => {
        docInstance.setFontSize(HEADER_FOOTER_FONT_SIZE);
        docInstance.setFont(undefined, 'normal');
        docInstance.setTextColor(128, 128, 128); // Grey
        const footerString = `Session ID: ${sessId}   -   Page ${pageNum} of ${totalPagesVal}`;
        docInstance.setDrawColor(200, 200, 200); // Light grey line
        docInstance.line(MARGIN, FOOTER_Y_LINE, PAGE_WIDTH - MARGIN, FOOTER_Y_LINE);
        docInstance.text(footerString, PAGE_WIDTH / 2, FOOTER_Y_TEXT, { align: 'center' });
      };
      
      const addNewPage = () => {
        pdf.addPage();
        currentPageNum++;
        drawHeader(pdf);
        yPosition = CONTENT_TOP_MARGIN;
      };

      const checkAndAddPage = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > CONTENT_BOTTOM_LIMIT) {
          addNewPage();
        }
      };
      
      const addWrappedText = (
        text: string | undefined | null, 
        x: number, 
        currentY: number, 
        maxWidth: number, 
        lineHeight: number, 
        options: { fontStyle?: 'normal' | 'bold' | 'italic', fontSize?: number, textColor?: string, isListItem?: boolean } = {}
      ): number => { 
        if (!text) return currentY;

        const originalFontSize = pdf.getFontSize();
        pdf.setFontSize(options.fontSize || BODY_FONT_SIZE);
        if (options.fontStyle) pdf.setFont(undefined, options.fontStyle);
        if (options.textColor) pdf.setTextColor(options.textColor);
        else pdf.setTextColor(40, 40, 40);

        const prefix = options.isListItem ? "- " : "";
        const textToSplit = prefix + text;
        const lines = pdf.splitTextToSize(textToSplit, options.isListItem ? maxWidth - 3 : maxWidth); 
        
        let tempY = currentY;

        lines.forEach((line: string) => {
          if (tempY + lineHeight > CONTENT_BOTTOM_LIMIT) { 
            addNewPage(); 
            tempY = yPosition; 
          }
          pdf.text(line, options.isListItem ? x + 3 : x, tempY);
          tempY += lineHeight;
        });
        
        yPosition = tempY; 

        pdf.setFontSize(originalFontSize); 
        pdf.setFont(undefined, 'normal'); 
        pdf.setTextColor(40, 40, 40); 
        return yPosition;
      };
      
      const addSectionTitle = (title: string) => {
        checkAndAddPage(LINE_HEIGHT_SECTION_TITLE * 2); 
        yPosition += LINE_HEIGHT_BODY / 2;
        addWrappedText(title, MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_SECTION_TITLE, { fontStyle: 'bold', fontSize: SECTION_TITLE_FONT_SIZE, textColor: '#7983F5' });
        yPosition += LINE_HEIGHT_BODY / 2;
      };

      const addSubText = (label: string, value: string | undefined | null, interaction?: {aiQuestion: string, userResponse: string} | null) => {
        const labelY = yPosition;
        addWrappedText(`${label}:`, MARGIN, labelY, MAX_TEXT_WIDTH, LINE_HEIGHT_BODY, { fontStyle: 'bold', fontSize: BODY_FONT_SIZE });
        
        if (interaction) {
            const interactionY = yPosition; 
            addWrappedText(`AI: ${interaction.aiQuestion}`, MARGIN + 5, interactionY, MAX_TEXT_WIDTH -5 , LINE_HEIGHT_SMALL, { fontSize: SMALL_FONT_SIZE, fontStyle: 'italic' });
            const userResponseY = yPosition;
            addWrappedText(`You: ${interaction.userResponse}`, MARGIN + 5, userResponseY, MAX_TEXT_WIDTH -5, LINE_HEIGHT_SMALL, { fontSize: SMALL_FONT_SIZE, fontStyle: 'italic' });
        }
        const valueY = yPosition;
        addWrappedText(value || '', MARGIN + (interaction ? 5 : 0), valueY, MAX_TEXT_WIDTH - (interaction ? 5 : 0), LINE_HEIGHT_BODY, { fontSize: BODY_FONT_SIZE });
        yPosition += LINE_HEIGHT_BODY * 0.5; 
      };

      drawHeader(pdf);

      yPosition += LINE_HEIGHT_MAIN_TITLE / 2;
      addWrappedText("CognitiveInsight Summary", MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_MAIN_TITLE, { fontStyle: 'bold', fontSize: MAIN_TITLE_FONT_SIZE, textColor: '#7983F5'});
      yPosition += LINE_HEIGHT_SMALL;
      addWrappedText(`Session ID: ${sessionId}`, MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_SMALL, {fontSize: SMALL_FONT_SIZE});
      addWrappedText(`Date: ${new Date(sessionData.startTime as Date).toLocaleString()}`, MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_SMALL, {fontSize: SMALL_FONT_SIZE});
      yPosition += LINE_HEIGHT_BODY;

      if (sessionData.summary) {
        addSectionTitle("Reframed Belief");
        addSubText("Final Belief", sessionData.summary.actualReframedBelief, sessionData.summary.reframedBeliefInteraction);
        
        addSectionTitle("Legacy Statement");
        addSubText("Final Statement", sessionData.summary.actualLegacyStatement, sessionData.summary.legacyStatementInteraction);

        addSectionTitle("Top Emotions");
        addWrappedText(sessionData.summary.topEmotions, MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_BODY, {fontSize: BODY_FONT_SIZE});
        yPosition += LINE_HEIGHT_BODY;
      } else {
        addWrappedText("Summary data is not available for this session.", MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_BODY, {fontSize: BODY_FONT_SIZE});
        yPosition += LINE_HEIGHT_BODY;
      }
      
      if (yPosition > CONTENT_TOP_MARGIN + LINE_HEIGHT_SECTION_TITLE) addNewPage();
      
      addSectionTitle("AI Generated Insight");
      if (sessionData.summary) {
        addWrappedText(sessionData.summary.insightSummary, MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_BODY, {fontSize: BODY_FONT_SIZE});
      } else {
        addWrappedText("No AI insight generated for this session.", MARGIN, yPosition, MAX_TEXT_WIDTH, LINE_HEIGHT_BODY, {fontSize: BODY_FONT_SIZE});
      }
      yPosition += LINE_HEIGHT_BODY;
      
      addNewPage(); 

      addSectionTitle("Full Session Transcript");
      let interactionsOnPage = 0;
      const MAX_INTERACTIONS_PER_PAGE = 3; 
      const userDisplayName = sessionData.sessionForUser?.displayName || sessionData.sessionForUser?.email || "User";

      sessionData.chatMessages.forEach((msg, index) => {
        if (interactionsOnPage >= MAX_INTERACTIONS_PER_PAGE && msg.sender === 'ai') { 
           addNewPage();
           interactionsOnPage = 0;
        }
        
        const senderPrefix = msg.sender === 'ai' ? "AI" : userDisplayName;
        const messageHeader = `${senderPrefix} (${msg.phaseName || 'N/A'}):`;
        
        checkAndAddPage(LINE_HEIGHT_SMALL + LINE_HEIGHT_BODY + LINE_HEIGHT_SMALL); 
        
        const headerY = yPosition;
        addWrappedText(messageHeader, MARGIN, headerY, MAX_TEXT_WIDTH, LINE_HEIGHT_SMALL, { fontStyle: 'bold', fontSize: SMALL_FONT_SIZE });
        const textY = yPosition;
        addWrappedText(msg.text, MARGIN + 5, textY, MAX_TEXT_WIDTH - 5, LINE_HEIGHT_BODY, {fontSize: BODY_FONT_SIZE});
        const timestampY = yPosition;
        addWrappedText(msg.timestamp ? new Date(msg.timestamp as Date).toLocaleTimeString() : 'N/A', MARGIN + 5, timestampY, MAX_TEXT_WIDTH - 5, LINE_HEIGHT_SMALL, { fontSize: HEADER_FOOTER_FONT_SIZE, fontStyle: 'italic' }); 
        yPosition += LINE_HEIGHT_BODY * 0.75; 
        
        if (msg.sender === 'user') { 
            interactionsOnPage++;
        } else if (index === sessionData.chatMessages.length - 1 && msg.sender === 'ai') {
            interactionsOnPage++;
        }
      });

      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          drawHeader(pdf); 
          drawFooter(pdf, sessionId, i, totalPages);
      }

      pdf.save(`CognitiveInsight-Report-${sessionId}.pdf`);
      toast({ title: "PDF Downloaded", description: "Your report has been downloaded successfully." });

    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({ variant: "destructive", title: "PDF Generation Failed", description: error.message || "Could not generate the PDF for your report." });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


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
              <Link href="/protocol">Go Back to Protocol</Link>
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
            <Link href="/protocol">Go Back to Protocol</Link>
         </Button>
      </div>
    );
  }
  
  const { summary, feedbackId, sessionForUser } = sessionData;
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
                           {firebaseUser && (
                              <PostSessionFeedback
                                sessionId={sessionId}
                                userId={firebaseUser.uid}
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
                    <Button variant="outline" onClick={() => router.push('/protocol')} className="w-full sm:w-auto">
                        Back to Protocol
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
            &copy; {new Date().getFullYear()} CognitiveInsight. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
