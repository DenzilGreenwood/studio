'use client';

import {useState, useEffect, useRef, useCallback} from 'react';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {
  cognitiveEdgeProtocol,
  CognitiveEdgeProtocolInput,
} from '@/ai/flows/cognitive-edge-protocol';
import {
  generateClaritySummary,
  ClaritySummaryInput,
} from '@/ai/flows/clarity-summary-generator';
import {
  analyzeSentiment,
  SentimentAnalysisInput,
} from '@/ai/flows/sentiment-analysis-flow';
import {ChatInterface} from '@/components/protocol/chat-interface';
import {PhaseIndicator} from '@/components/protocol/phase-indicator';
import {
  ClaritySummary,
  ClaritySummaryProps,
} from '@/components/protocol/clarity-summary';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {
  ChatMessage,
  ClaritySummaryContentType,
  KeyInteraction,
  PhaseStep,
} from '@/types';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {PostSessionFeedback} from '@/components/feedback/post-session-feedback';

const protocolPhases = [
  {
    name: 'Stabilize & Structure',
    description: 'Organize your thoughts and identify key issues.',
  },
  {
    name: 'Listen for Core Frame',
    description: "Identify the underlying mental model or perspective.",
  },
  {
    name: 'Validate Emotion / Reframe',
    description: 'Acknowledge emotions and help reframe limiting beliefs.',
  },
  {
    name: 'Provide Grounded Support',
    description: 'Offer practical advice and encouragement.',
  },
  {
    name: 'Reflective Pattern Discovery',
    description: 'Identify patterns in thinking and behavior.',
  },
  {
    name: 'Empower & Legacy Statement',
    description: 'Create a statement reflecting values and goals.',
  },
];

export default function ProtocolPage() {
  const {user, loading} = useAuth();
  const router = useRouter();
  const {toast} = useToast();

  const [currentPhase, setCurrentPhase] = useState(1);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProtocolComplete, setIsProtocolComplete] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [sessionDataForSummary, setSessionDataForSummary] = useState<
    Partial<ClaritySummaryContentType>
  >({});
  const [finalClaritySummary, setFinalClaritySummary] =
    useState<ClaritySummaryContentType | null>(null);

  const [pendingAiQuestion, setPendingAiQuestion] = useState<string | null>(
    null
  );
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const startNewSession = useCallback(async () => {
    if (!user) return;

    setIsProtocolComplete(false);
    setFinalClaritySummary(null);
    setShowFeedbackForm(false);
    setCurrentPhase(1);
    setChatHistory([]);
    setSessionDataForSummary({});

    try {
      const sessionRef = await addDoc(
        collection(db, 'users', user.uid, 'sessions'),
        {
          userId: user.uid,
          startTime: serverTimestamp(),
          completedPhases: 0,
          isComplete: false,
        }
      );
      setCurrentSessionId(sessionRef.id);
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting new session:', error);
      toast({
        title: 'Error',
        description: 'Could not start a new session. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user && !currentSessionId) {
      startNewSession();
    }
  }, [user, loading, router, currentSessionId, startNewSession]);

  const triggerSummaryGeneration = useCallback(async () => {
    if (!user || !currentSessionId) return;

    try {
      // 1. Analyze sentiment from user messages
      const userMessagesQuery = query(
        collection(db, 'users', user.uid, 'sessions', currentSessionId, 'messages'),
        where('sender', '==', 'user'),
        orderBy('timestamp')
      );
      const userMessagesSnapshot = await getDocs(userMessagesQuery);
      const userMessages = userMessagesSnapshot.docs.map(doc => doc.data().text);
      
      let topEmotions = 'Could not be determined';
      if (userMessages.length > 0) {
        try {
          const sentimentInput: SentimentAnalysisInput = {messages: userMessages};
          const sentimentResult = await analyzeSentiment(sentimentInput);
          topEmotions = sentimentResult.emotions;
        } catch (sentimentError) {
          console.error("Error in sentiment analysis:", sentimentError);
        }
      }

      // 2. Generate Insight Summary
      const summaryInput: ClaritySummaryInput = {
        sessionId: currentSessionId,
        userId: user.uid,
      };
      const summaryResult = await generateClaritySummary(summaryInput);

      const finalSummaryData: ClaritySummaryContentType = {
        insightSummary:
          summaryResult.insightSummary ||
          'Could not generate an AI summary at this time.',
        topEmotions: topEmotions,
        actualReframedBelief: sessionDataForSummary.actualReframedBelief || '',
        actualLegacyStatement:
          sessionDataForSummary.actualLegacyStatement || '',
        reframedBeliefInteraction:
          sessionDataForSummary.reframedBeliefInteraction || null,
        legacyStatementInteraction:
          sessionDataForSummary.legacyStatementInteraction || null,
        generatedAt: serverTimestamp(),
      };

      setFinalClaritySummary(finalSummaryData);

      // 3. Update Firestore session document
      const sessionRef = doc(
        db,
        'users',
        user.uid,
        'sessions',
        currentSessionId
      );
      await updateDoc(sessionRef, {
        isComplete: true,
        endTime: serverTimestamp(),
        completedPhases: currentPhase,
        summary: finalSummaryData,
      });
    } catch (error) {
      console.error('Error generating or saving summary:', error);
      toast({
        title: 'Summary Error',
        description: 'Could not generate the final summary.',
        variant: 'destructive',
      });
      // Save partial data if summary fails
       const partialSummaryData: ClaritySummaryContentType = {
        insightSummary: 'Could not generate an AI summary at this time.',
        topEmotions: sessionDataForSummary.topEmotions || 'Not analyzed',
        actualReframedBelief: sessionDataForSummary.actualReframedBelief || '',
        actualLegacyStatement:
          sessionDataForSummary.actualLegacyStatement || '',
        reframedBeliefInteraction:
          sessionDataForSummary.reframedBeliefInteraction || null,
        legacyStatementInteraction:
          sessionDataForSummary.legacyStatementInteraction || null,
        generatedAt: serverTimestamp(),
      };
      setFinalClaritySummary(partialSummaryData);
       const sessionRef = doc(
        db,
        'users',
        user.uid,
        'sessions',
        currentSessionId
      );
      await updateDoc(sessionRef, { summary: partialSummaryData });
    }
  }, [user, currentSessionId, toast, sessionDataForSummary, currentPhase]);

  const handleSendMessage = async (inputText: string) => {
    if (!user || !currentSessionId) {
      toast({
        title: 'Error',
        description: 'User not authenticated or session not started.',
        variant: 'destructive',
      });
      return;
    }

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      phaseName: protocolPhases[currentPhase - 1].name,
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    if (pendingAiQuestion) {
      const interaction: KeyInteraction = {
        aiQuestion: pendingAiQuestion,
        userResponse: inputText,
      };
      if (currentPhase === 3) {
        // Validate Emotion / Reframe phase
        setSessionDataForSummary(prev => ({
          ...prev,
          reframedBeliefInteraction: interaction,
          actualReframedBelief: inputText,
        }));
      } else if (currentPhase === 6) {
        // Empower & Legacy Statement phase
        setSessionDataForSummary(prev => ({
          ...prev,
          legacyStatementInteraction: interaction,
          actualLegacyStatement: inputText,
        }));
      }
      setPendingAiQuestion(null);
    }

    try {
      const input: CognitiveEdgeProtocolInput = {
        sessionId: currentSessionId,
        userId: user.uid,
        message: inputText,
        phase: currentPhase,
      };

      await addDoc(
        collection(db, 'users', user.uid, 'sessions', currentSessionId, 'messages'),
        {
          text: inputText,
          sender: 'user',
          timestamp: serverTimestamp(),
          phaseName: protocolPhases[currentPhase - 1].name,
        }
      );

      const aiResponse = await cognitiveEdgeProtocol(input);

      const newAiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: aiResponse.response,
        sender: 'ai',
        timestamp: new Date(),
        phaseName: protocolPhases[currentPhase - 1].name,
      };
      setChatHistory(prev => [...prev, newAiMessage]);

      await addDoc(
        collection(db, 'users', user.uid, 'sessions', currentSessionId, 'messages'),
        {
          text: aiResponse.response,
          sender: 'ai',
          timestamp: serverTimestamp(),
          phaseName: protocolPhases[currentPhase - 1].name,
        }
      );

      // Save phase step
      const phaseStepData: PhaseStep = {
        phaseName: protocolPhases[currentPhase - 1].name,
        userInput: inputText,
        aiOutput: aiResponse.response,
        timestamp: serverTimestamp(),
        userId: user.uid,
      };
      await addDoc(
        collection(db, 'users', user.uid, 'sessions', currentSessionId, 'phases'),
        phaseStepData
      );

      if (currentPhase === 3 || currentPhase === 6) {
        setPendingAiQuestion(aiResponse.response);
      }

      if (aiResponse.nextPhase === 0 || aiResponse.nextPhase > 6) {
        setIsProtocolComplete(true);
        await triggerSummaryGeneration();
      } else {
        setCurrentPhase(aiResponse.nextPhase);
      }
    } catch (error) {
      console.error('Error in chat interaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI. Please try again.',
        variant: 'destructive',
      });
      const errorAiMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: 'Sorry, I encountered an error. Could you please try rephrasing or try again?',
        sender: 'ai',
        timestamp: new Date(),
        phaseName: protocolPhases[currentPhase - 1].name,
      };
      setChatHistory(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const restartProtocol = () => {
    startNewSession();
  };

  if (loading || !user || !currentSessionId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-3.5rem)] max-w-4xl flex-col py-4">
      <PhaseIndicator
        currentPhase={currentPhase}
        phases={protocolPhases}
        isComplete={isProtocolComplete}
        isLoading={isLoading}
      />

      {isProtocolComplete ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {isLoading ? (
            <div>
              <h2 className="font-headline text-2xl font-bold">
                Finalizing your report...
              </h2>
              <p>This may take a moment.</p>
            </div>
          ) : finalClaritySummary ? (
            <div className="w-full">
              {!showFeedbackForm ? (
                <>
                  <ClaritySummary
                    summaryData={finalClaritySummary}
                    sessionId={currentSessionId}
                  />
                  <Button
                    onClick={() => setShowFeedbackForm(true)}
                    className="mt-4"
                  >
                    Proceed to Feedback
                  </Button>
                </>
              ) : (
                <PostSessionFeedback
                  sessionId={currentSessionId}
                  userId={user.uid}
                  onFeedbackSubmitted={restartProtocol}
                />
              )}
            </div>
          ) : (
            <div>
              <h2 className="font-headline text-2xl font-bold">
                An Error Occurred
              </h2>
              <p>
                We couldn't generate your summary. Please try starting a new
                session.
              </p>
              <Button onClick={restartProtocol} className="mt-4">
                Start New Session
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ChatInterface
          chatHistory={chatHistory}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
