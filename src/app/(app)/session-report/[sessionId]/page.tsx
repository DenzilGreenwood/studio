'use client';

import {useState, useEffect, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useAuth} from '@/context/auth-context';
import {db} from '@/lib/firebase';
import {doc, getDoc, collection, getDocs, orderBy, query} from 'firebase/firestore';
import {
  ProtocolSession,
  ChatMessage,
  ClaritySummaryContentType,
} from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  ArrowLeft,
  Bot,
  User,
  Lightbulb,
  Milestone,
  Download,
  Loader2,
  MessageSquareQuote,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {PostSessionFeedback} from '@/components/feedback/post-session-feedback';
import {useToast} from '@/hooks/use-toast';

import jsPDF from 'jspdf';
import {useIsAdmin} from '@/hooks/use-is-admin';

export default function SessionReportPage() {
  const {user, loading: authLoading} = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const {toast} = useToast();

  const [sessionData, setSessionData] = useState<ProtocolSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const fetchSessionData = useCallback(async () => {
    if (!user && !isAdmin) return;

    try {
      // Admin can view any report, so we need to find the user first.
      // This is a simplification. A real-world scenario would require a more efficient way to find the user for a session.
      let userId = user?.uid;
      if (isAdmin && !userId) {
        const querySnapshot = await getDocs(collection(db, 'users'));
        for (const userDoc of querySnapshot.docs) {
          const sessionDocRef = doc(
            db,
            'users',
            userDoc.id,
            'sessions',
            sessionId
          );
          const sessionDocSnap = await getDoc(sessionDocRef);
          if (sessionDocSnap.exists()) {
            userId = userDoc.id;
            break;
          }
        }
      }

      if (!userId) {
        throw new Error(
          'Session not found or you do not have permission to view it.'
        );
      }

      const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
      const sessionDocSnap = await getDoc(sessionDocRef);

      if (!sessionDocSnap.exists()) {
        throw new Error('Session not found.');
      }

      const data = sessionDocSnap.data() as ProtocolSession;
      setSessionData(data);

      const messagesQuery = query(
        collection(db, 'users', userId, 'sessions', sessionId, 'messages'),
        orderBy('timestamp')
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate(),
        } as ChatMessage;
      });
      setChatMessages(messages);
    } catch (err: any) {
      console.error('Error fetching session data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user, isAdmin]);

  useEffect(() => {
    if (!authLoading) {
      fetchSessionData();
    }
  }, [authLoading, fetchSessionData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('review_success') === 'true') {
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your valuable input!',
      });
      // Clean up URL
      router.replace(`/session-report/${sessionId}`);
    }
  }, [sessionId, router, toast]);

  const handleDownloadPdf = async () => {
    if (!sessionData || !sessionData.summary) return;
    setIsGeneratingPdf(true);
    toast({
      title: 'Generating PDF...',
      description: 'Your report is being prepared for download.',
    });

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 40;
      let yPosition = margin;
      let currentPage = 1;
      let totalPages = 1; // Start with 1, will be updated at the end

      const drawHeader = (docInstance: jsPDF) => {
        docInstance.setFont('helvetica', 'bold');
        docInstance.setFontSize(10);
        docInstance.setTextColor(100);
        docInstance.text('Cognitive Insight Report', margin, margin / 2);
        docInstance.setDrawColor(200);
        docInstance.line(margin, margin / 2 + 5, pageWidth - margin, margin / 2 + 5);
      };

      const drawFooter = (
        docInstance: jsPDF,
        sessionId: string,
        pageNum: number,
        totalPagesNum: number
      ) => {
        docInstance.setFont('helvetica', 'normal');
        docInstance.setFontSize(8);
        docInstance.setTextColor(150);
        const footerText = `Session ID: ${sessionId} - Page ${pageNum} of ${totalPagesNum}`;
        const textWidth = docInstance.getTextWidth(footerText);
        docInstance.text(
          footerText,
          pageWidth - margin - textWidth,
          pageHeight - margin / 2
        );
         docInstance.setDrawColor(200);
        docInstance.line(margin, pageHeight - margin/2 - 5, pageWidth - margin, pageHeight - margin/2 - 5);
      };

      const addNewPage = () => {
        doc.addPage();
        currentPage++;
        yPosition = margin;
      };

      const checkAndAddPage = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > pageHeight - margin * 2) {
          // Check against content area
          addNewPage();
        }
      };

      const addWrappedText = (
        text: string,
        x: number,
        maxWidth: number,
        options: any = {}
      ) => {
        const {
          fontName = 'helvetica',
          fontStyle = 'normal',
          fontSize = 10,
          lineSpacing = 1.2,
          textColor = 40,
        } = options;
        doc.setFont(fontName, fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(textColor);
        const lines = doc.splitTextToSize(text || 'N/A', maxWidth);
        const lineHeight = fontSize * lineSpacing;
        checkAndAddPage(lines.length * lineHeight);
        doc.text(lines, x, yPosition);
        yPosition += lines.length * lineHeight;
      };

      const addSectionTitle = (title: string) => {
        checkAndAddPage(40);
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 80);
        doc.text(title, margin, yPosition);
        yPosition += 20;
      };
      
      const addSubText = (text: string, isQuestion: boolean = false) => {
        checkAndAddPage(20);
        yPosition += 5;
         addWrappedText(text, margin + (isQuestion ? 0 : 15), pageWidth - margin * 2 - 15, {
          fontStyle: isQuestion ? 'italic' : 'normal',
          textColor: isQuestion ? 100 : 40,
        });
      };

      // --- PDF CONTENT START ---

      // Page 1: Cover / Key Insights
      yPosition = margin + 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(30, 30, 80);
      doc.text('CognitiveInsight Summary', margin, yPosition);
      yPosition += 30;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Session Date: ${
        (sessionData.startTime as any)
          ?.toDate()
          .toLocaleDateString() || 'N/A'
      }`, margin, yPosition);
      yPosition += 25;

      addSectionTitle('Reframed Belief');
      if (sessionData.summary.reframedBeliefInteraction) {
        addSubText(`AI Question: ${sessionData.summary.reframedBeliefInteraction.aiQuestion}`, true);
        addSubText(`Your Answer: ${sessionData.summary.reframedBeliefInteraction.userResponse}`);
      }
      doc.setFont('helvetica', 'bold');
      addSubText(`Final Belief: ${sessionData.summary.actualReframedBelief}`);

      addSectionTitle('Legacy Statement');
       if (sessionData.summary.legacyStatementInteraction) {
        addSubText(`AI Question: ${sessionData.summary.legacyStatementInteraction.aiQuestion}`, true);
        addSubText(`Your Answer: ${sessionData.summary.legacyStatementInteraction.userResponse}`);
      }
      doc.setFont('helvetica', 'bold');
      addSubText(`Final Statement: ${sessionData.summary.actualLegacyStatement}`);
      
      addSectionTitle('Top Emotions');
      addSubText(sessionData.summary.topEmotions);

      // Page Break before AI Insight
      addNewPage();
      addSectionTitle('AI Generated Insight');
      addWrappedText(sessionData.summary.insightSummary, margin, pageWidth - margin * 2);

      // Page Break before Transcript
      addNewPage();
      addSectionTitle('Full Session Transcript');
      
      const MAX_INTERACTIONS_PER_PAGE = 5;
      let interactionCount = 0;

      for (const message of chatMessages) {
        checkAndAddPage(60); // Estimate space for a message block
        
        if (interactionCount >= MAX_INTERACTIONS_PER_PAGE) {
          addNewPage();
          interactionCount = 0;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(message.sender === 'ai' ? 60 : 30);
        const senderText = message.sender === 'ai' ? 'AI' : 'You';
        doc.text(`${senderText} (Phase: ${message.phaseName})`, margin, yPosition);
        yPosition += 15;
        
        addWrappedText(message.text, margin, pageWidth - margin * 2, { fontSize: 10 });
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(150);
        yPosition += 5;
        doc.text(new Date(message.timestamp).toLocaleString(), margin, yPosition);
        yPosition += 15;
        
        if (message.sender === 'user') {
          interactionCount++;
        }
      }

      // Final pass to add headers and footers with correct page count
      totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawHeader(doc);
        drawFooter(doc, sessionId, i, totalPages);
      }

      doc.save(`CognitiveInsight-Report-${sessionId}.pdf`);
      toast({
        title: 'Download Ready',
        description: 'Your PDF report has been downloaded.',
      });
    } catch (pdfError) {
      console.error('Failed to generate PDF:', pdfError);
      toast({
        title: 'PDF Generation Failed',
        description:
          'There was an error creating your PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>No session data found.</p>
      </div>
    );
  }
  
  const summary = sessionData.summary;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card id="sessionReportContent">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              className="mb-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle className="font-headline text-3xl">Your Insight Summary</CardTitle>
            <CardDescription>
              Session from{' '}
              {sessionData.startTime instanceof Date
                ? sessionData.startTime.toLocaleDateString()
                : (sessionData.startTime as any)
                    ?.toDate()
                    .toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
            {!sessionData.feedbackId ? (
              <Dialog
                open={feedbackDialogOpen}
                onOpenChange={setFeedbackDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <MessageSquareQuote className="mr-2 h-4 w-4" />
                    Leave a Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Provide Feedback</DialogTitle>
                  </DialogHeader>
                  <PostSessionFeedback
                    sessionId={sessionId}
                    userId={sessionData.userId}
                    onFeedbackSubmitted={() => {
                      setFeedbackDialogOpen(false);
                      fetchSessionData(); // Refetch to get updated feedback status
                      toast({
                        title: 'Feedback Submitted',
                        description: 'Thank you for your valuable input!',
                      });
                    }}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="secondary" disabled>
                Review Submitted
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {summary ? (
            <>
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-headline text-lg font-semibold">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Reframed Belief
                </h3>
                {summary.reframedBeliefInteraction && (
                  <div className="rounded-md border-l-4 border-primary/50 bg-muted/30 p-3 space-y-2 text-sm border-dashed">
                    <p className="flex items-start gap-2">
                      <Bot className="h-4 w-4 shrink-0 mt-0.5 text-primary"/> 
                      <span className="italic text-muted-foreground">{summary.reframedBeliefInteraction.aiQuestion}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <User className="h-4 w-4 shrink-0 mt-0.5"/> 
                      <span>{summary.reframedBeliefInteraction.userResponse}</span>
                    </p>
                  </div>
                )}
                <p className="text-muted-foreground bg-background p-3 rounded-md border">
                  <strong className="text-primary">Final Belief: </strong>
                  {summary.actualReframedBelief}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-headline text-lg font-semibold">
                  <Milestone className="h-5 w-5 text-primary" />
                  Legacy Statement
                </h3>
                 {summary.legacyStatementInteraction && (
                  <div className="rounded-md border-l-4 border-primary/50 bg-muted/30 p-3 space-y-2 text-sm border-dashed">
                    <p className="flex items-start gap-2">
                      <Bot className="h-4 w-4 shrink-0 mt-0.5 text-primary"/> 
                      <span className="italic text-muted-foreground">{summary.legacyStatementInteraction.aiQuestion}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <User className="h-4 w-4 shrink-0 mt-0.5"/> 
                      <span>{summary.legacyStatementInteraction.userResponse}</span>
                    </p>
                  </div>
                )}
                <p className="text-muted-foreground bg-background p-3 rounded-md border">
                  <strong className="text-primary">Final Statement: </strong>
                  {summary.actualLegacyStatement}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-headline text-lg font-semibold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                  Top Emotions
                </h3>
                <p className="text-muted-foreground bg-background p-3 rounded-md border">
                  {summary.topEmotions}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-headline text-lg font-semibold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  AI Generated Insight
                </h3>
                <p className="text-muted-foreground bg-background p-3 rounded-md border whitespace-pre-wrap">
                  {summary.insightSummary}
                </p>
              </div>
            </>
          ) : (
             <p>Summary not available for this session.</p>
          )}

          <div className="space-y-4">
            <h3 className="font-headline text-lg font-semibold">Full Session Transcript</h3>
            <div className="space-y-4 rounded-md border bg-muted/20 p-4 max-h-96 overflow-y-auto">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-md rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      Phase: {message.phaseName}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
