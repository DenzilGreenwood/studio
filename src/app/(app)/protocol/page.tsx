// src/app/(app)/protocol/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChatInterface, type Message as UIMessage } from '@/components/protocol/chat-interface';
import { PhaseIndicator } from '@/components/protocol/phase-indicator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cognitiveEdgeProtocol, type CognitiveEdgeProtocolInput, type CognitiveEdgeProtocolOutput } from '@/ai/flows/cognitive-edge-protocol';
import { generateClaritySummary, type ClaritySummaryInput, type ClaritySummaryOutput } from '@/ai/flows/clarity-summary-generator';
import { analyzeSentiment, type SentimentAnalysisInput, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis-flow';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { 
  db, 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  query, 
  orderBy, 
  getDocs,
  getDoc,
  updateDoc,
  Timestamp,
  where
} from '@/lib/firebase';
import type { ProtocolSession, ChatMessage as FirestoreChatMessage } from '@/types';
import { useRouter } from 'next/navigation'; 
import { ClaritySummary } from '@/components/protocol/clarity-summary';
import { PostSessionFeedback } from '@/components/feedback/post-session-feedback';


const TOTAL_PHASES = 6;
const PHASE_NAMES = [
  "Stabilize & Structure",
  "Listen for Core Frame",
  "Validate Emotion / Reframe",
  "Provide Grounded Support",
  "Reflective Pattern Discovery",
  "Empower & Legacy Statement"
];

interface KeyInteraction {
  aiQuestion: string;
  userResponse: string;
}

interface SessionDataForSummaryInternal {
  actualReframedBelief?: string; 
  reframedBeliefInteraction?: KeyInteraction | null;
  actualLegacyStatement?: string; 
  legacyStatementInteraction?: KeyInteraction | null;
  topEmotions: string;
}

interface SessionDataForSummaryFunctionArg {
  actualReframedBelief: string; 
  reframedBeliefInteraction?: KeyInteraction | null;
  actualLegacyStatement: string;
  legacyStatementInteraction?: KeyInteraction | null;
  topEmotions: string;
}


type ClaritySummaryContentType = ClaritySummaryOutput & SessionDataForSummaryFunctionArg;


async function generateAndSaveSummary(
  sessionId: string,
  userId: string,
  circumstance: string,
  summaryInputData: SessionDataForSummaryFunctionArg, 
  showToast: (options: any) => void 
): Promise<ClaritySummaryContentType | null> {
  if (!sessionId || !userId || !circumstance) {
    showToast({ variant: "destructive", title: "Error", description: "User, Session, or Circumstance ID missing for summary." });
    return null;
  }

  const baseSummaryContentToSaveOnError: ClaritySummaryContentType = {
    insightSummary: "AI summary could not be generated because key information (reframed belief or legacy statement) was not captured during the session.",
    actualReframedBelief: summaryInputData.actualReframedBelief || "",
    actualLegacyStatement: summaryInputData.actualLegacyStatement || "",
    topEmotions: summaryInputData.topEmotions,
    reframedBeliefInteraction: summaryInputData.reframedBeliefInteraction || null,
    legacyStatementInteraction: summaryInputData.legacyStatementInteraction || null,
  };
  
  const sessionDocRef = doc(db, `users/${userId}/circumstances/${circumstance}/sessions/${sessionId}`);

  if (!summaryInputData.actualReframedBelief.trim() && !summaryInputData.actualLegacyStatement.trim()) {
    showToast({ variant: "destructive", title: "Missing Key Data", description: "Crucial session elements (reframed belief or legacy statement) were not captured. A full AI summary cannot be generated." });
     await updateDoc(sessionDocRef, {
      summary: { 
        ...baseSummaryContentToSaveOnError,
        generatedAt: serverTimestamp()
      }
    });
    return baseSummaryContentToSaveOnError;
  }

  try {
    const summaryInputForAI: ClaritySummaryInput = {
      reframedBelief: summaryInputData.actualReframedBelief,
      legacyStatement: summaryInputData.actualLegacyStatement,
      topEmotions: summaryInputData.topEmotions,
    };
    const summaryOutput = await generateClaritySummary(summaryInputForAI);
    
    const summaryToPersist: ClaritySummaryContentType = {
      insightSummary: summaryOutput.insightSummary,
      actualReframedBelief: summaryInputData.actualReframedBelief,
      actualLegacyStatement: summaryInputData.actualLegacyStatement,
      topEmotions: summaryInputData.topEmotions,
      reframedBeliefInteraction: summaryInputData.reframedBeliefInteraction || null,
      legacyStatementInteraction: summaryInputData.legacyStatementInteraction || null,
    };

    await updateDoc(sessionDocRef, {
      summary: { 
        ...summaryToPersist,
        generatedAt: serverTimestamp()
      }
    });
    return summaryToPersist;

  } catch (error) {
    console.error("Error generating summary:", error);
    showToast({ variant: "destructive", title: "Summary Generation Failed", description: "Could not generate the insight summary." });
    const errorSummaryToPersist: ClaritySummaryContentType = {
      ...baseSummaryContentToSaveOnError,
      insightSummary: "Failed to generate AI summary. Please try downloading raw insights or contact support.",
    };
    await updateDoc(sessionDocRef, {
      summary: { 
        ...errorSummaryToPersist,
        generatedAt: serverTimestamp()
      }
    });
    return errorSummaryToPersist;
  }
}


export default function ProtocolPage() {
  const { firebaseUser, user } = useAuth();
  const router = useRouter(); 
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [currentPhaseName, setCurrentPhaseName] = useState(PHASE_NAMES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionHistoryForAI, setSessionHistoryForAI] = useState<string | undefined>(undefined);
  const [isProtocolComplete, setIsProtocolComplete] = useState(false);
  const [sessionDataForSummary, setSessionDataForSummary] = useState<Partial<SessionDataForSummaryInternal>>({});
  const [pendingAiQuestion, setPendingAiQuestion] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentCircumstance, setCurrentCircumstance] = useState<string | null>(null);
  const [finalClaritySummary, setFinalClaritySummary] = useState<ClaritySummaryContentType | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const { toast } = useToast();

  const initializeSession = useCallback(async () => {
    if (!firebaseUser || !user) return;
    
    if (!user.primaryChallenge) {
      toast({
        title: "Profile Incomplete",
        description: "Please select a primary challenge in your profile before starting a session.",
        variant: "destructive",
      });
      router.push('/profile');
      return;
    }

    setIsLoading(true);
    setFinalClaritySummary(null); 
    setIsProtocolComplete(false); 
    setShowFeedbackForm(false); 
    
    const circumstance = user.primaryChallenge;
    setCurrentCircumstance(circumstance);

    const newSessionRef = doc(collection(db, `users/${firebaseUser.uid}/circumstances/${circumstance}/sessions`));
    const newSessionId = newSessionRef.id;
    setCurrentSessionId(newSessionId);

    const initialSessionData: ProtocolSession = {
      sessionId: newSessionId,
      userId: firebaseUser.uid,
      circumstance: circumstance,
      startTime: serverTimestamp(),
      completedPhases: 0,
      summary: {
        insightSummary: "",
        actualReframedBelief: "",
        actualLegacyStatement: "",
        topEmotions: "",
        generatedAt: serverTimestamp(), 
      }
    };
    await setDoc(newSessionRef, initialSessionData);
    
    const firstMessageText = `Welcome to CognitiveInsight! Let's begin with Phase 1: ${PHASE_NAMES[0]}. Please describe the challenge or situation you're facing.`;
    const firstUIMessage: UIMessage = {
      id: crypto.randomUUID(),
      sender: 'ai',
      text: firstMessageText,
      timestamp: new Date(),
    };
    setMessages([firstUIMessage]);

    await addDoc(collection(db, `users/${firebaseUser.uid}/circumstances/${circumstance}/sessions/${newSessionId}/messages`), {
      sender: 'ai',
      text: firstMessageText,
      timestamp: serverTimestamp(),
      phaseName: PHASE_NAMES[0],
    });
    
    setCurrentPhase(1);
    setCurrentPhaseName(PHASE_NAMES[0]);
    setSessionDataForSummary({ topEmotions: "Not analyzed" }); 
    setPendingAiQuestion(null);
    setSessionHistoryForAI(undefined);
    setIsLoading(false);
  }, [firebaseUser, user, router, toast]);

  useEffect(() => {
    if (firebaseUser && user && !currentSessionId) {
      initializeSession();
    }
  }, [firebaseUser, user, currentSessionId, initializeSession]);


  const handleSendMessage = async (userInput: string) => {
    if (isProtocolComplete || !currentSessionId || !firebaseUser || !currentCircumstance) return;

    const currentUserInputText = userInput.trim();

    const newUserUIMessage: UIMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: currentUserInputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserUIMessage]);
    
    await addDoc(collection(db, `users/${firebaseUser.uid}/circumstances/${currentCircumstance}/sessions/${currentSessionId}/messages`), {
      sender: 'user',
      text: currentUserInputText,
      timestamp: serverTimestamp(),
      phaseName: currentPhaseName,
    });

    if (pendingAiQuestion) {
      if (currentPhaseName === "Validate Emotion / Reframe") {
        setSessionDataForSummary(prev => ({
          ...prev,
          reframedBeliefInteraction: { aiQuestion: pendingAiQuestion, userResponse: currentUserInputText },
          actualReframedBelief: currentUserInputText 
        }));
      } else if (currentPhaseName === "Empower & Legacy Statement") {
        setSessionDataForSummary(prev => ({
          ...prev,
          legacyStatementInteraction: { aiQuestion: pendingAiQuestion, userResponse: currentUserInputText },
          actualLegacyStatement: currentUserInputText 
        }));
      }
      setPendingAiQuestion(null);
    }

    setIsLoading(true);
    try {
      const input: CognitiveEdgeProtocolInput = {
        userInput: currentUserInputText,
        phase: currentPhaseName as CognitiveEdgeProtocolInput['phase'],
        sessionHistory: sessionHistoryForAI,
      };
      const output: CognitiveEdgeProtocolOutput = await cognitiveEdgeProtocol(input);
      
      const aiResponseUIMessage: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: output.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponseUIMessage]);
      
      await addDoc(collection(db, `users/${firebaseUser.uid}/circumstances/${currentCircumstance}/sessions/${currentSessionId}/messages`), {
        sender: 'ai',
        text: output.response,
        timestamp: serverTimestamp(),
        phaseName: output.nextPhase,
      });
      
      setSessionHistoryForAI(output.sessionHistory);

      if (output.nextPhase === "Validate Emotion / Reframe" || (currentPhaseName === "Validate Emotion / Reframe" && output.nextPhase === "Validate Emotion / Reframe")) {
        setPendingAiQuestion(output.response);
      } else if (output.nextPhase === "Empower & Legacy Statement" || (currentPhaseName === "Empower & Legacy Statement" && output.nextPhase === "Empower & Legacy Statement")) {
         setPendingAiQuestion(output.response);
      }

      const nextPhaseIndex = PHASE_NAMES.indexOf(output.nextPhase);
      const newPhaseNumber = nextPhaseIndex + 1;

      const sessionDocRef = doc(db, `users/${firebaseUser.uid}/circumstances/${currentCircumstance}/sessions/${currentSessionId}`);

      if (newPhaseNumber > currentPhase || (currentPhase === TOTAL_PHASES && output.nextPhase === PHASE_NAMES[TOTAL_PHASES-1])) {
        if (currentPhase < TOTAL_PHASES) {
          setCurrentPhase(newPhaseNumber);
          setCurrentPhaseName(output.nextPhase);
          await updateDoc(sessionDocRef, {
            completedPhases: currentPhase
          });
           setIsLoading(false); 
        } else if (currentPhase === TOTAL_PHASES && output.nextPhase === PHASE_NAMES[TOTAL_PHASES - 1]) {
          setIsLoading(true); // Keep loading while generating summary etc.
          
          let detectedUserEmotions = "Emotions not analyzed";
          try {
            const messagesQuery = query(
              collection(db, `users/${firebaseUser.uid}/circumstances/${currentCircumstance}/sessions/${currentSessionId}/messages`),
              orderBy("timestamp", "asc")
            );
            const messagesSnap = await getDocs(messagesQuery);
            const userMessagesText = messagesSnap.docs
              .filter(docSnap => (docSnap.data() as FirestoreChatMessage).sender === 'user')
              .map(docSnap => (docSnap.data() as FirestoreChatMessage).text)
              .join('\n\n');
            
            if (userMessagesText.trim()) {
              const sentimentInput: SentimentAnalysisInput = { userMessages: userMessagesText };
              const sentimentOutput = await analyzeSentiment(sentimentInput);
              detectedUserEmotions = sentimentOutput.detectedEmotions;
            }
          } catch (sentimentError) {
            console.error("Error analyzing sentiment:", sentimentError);
            toast({ variant: "destructive", title: "Sentiment Analysis Failed", description: "Could not determine emotional context." });
          }
          
          const finalDataForFirestore: SessionDataForSummaryFunctionArg = {
            actualReframedBelief: sessionDataForSummary?.actualReframedBelief || "",
            reframedBeliefInteraction: sessionDataForSummary?.reframedBeliefInteraction || null,
            actualLegacyStatement: sessionDataForSummary?.actualLegacyStatement || "",
            legacyStatementInteraction: sessionDataForSummary?.legacyStatementInteraction || null,
            topEmotions: detectedUserEmotions,
          };
          
          await updateDoc(sessionDocRef, {
            completedPhases: TOTAL_PHASES,
            endTime: serverTimestamp(),
            reframedBelief: finalDataForFirestore.actualReframedBelief, 
            legacyStatement: finalDataForFirestore.actualLegacyStatement, 
            topEmotions: finalDataForFirestore.topEmotions, 
          });
          
          const generatedSummary = await generateAndSaveSummary(
            currentSessionId, 
            firebaseUser.uid, 
            currentCircumstance,
            finalDataForFirestore, 
            toast
          );

          setFinalClaritySummary(generatedSummary); 
          setIsProtocolComplete(true); 
          // setShowFeedbackForm(true); // Do NOT show feedback form immediately
          setIsLoading(false); 
          return; 
        }
      } else {
         setIsLoading(false); 
      }
      
    } catch (error) {
      console.error("Error in AI protocol:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get a response from the AI. Please try again.",
      });
      const errorResponse: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "I'm sorry, I encountered an issue. Could you please try rephrasing or try again?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsLoading(false); 
    } 
  };

  const restartProtocol = () => {
    setCurrentSessionId(null); 
    setMessages([]);
    setFinalClaritySummary(null);
    setIsProtocolComplete(false);
    setShowFeedbackForm(false);
  };


  if (!firebaseUser || (!currentSessionId && isLoading && !isProtocolComplete)) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="h-16 w-16 animate-pulse text-primary" />
        <p className="mt-4 font-headline text-xl">Loading CognitiveInsight Session...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl flex flex-col gap-4 md:gap-6 min-h-[calc(100vh-theme(spacing.32))]">
      <PhaseIndicator
        currentPhase={currentPhase}
        totalPhases={TOTAL_PHASES}
        phaseName={currentPhaseName}
        isCompleted={isProtocolComplete}
        isLoadingNextPhase={isLoading && !isProtocolComplete && currentPhase < TOTAL_PHASES}
      />
      
      {isLoading && isProtocolComplete && !finalClaritySummary ? ( 
         <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md flex-grow">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="font-headline text-2xl text-primary mb-2">Finalizing Your Session...</h2>
          <p className="text-muted-foreground">Just a moment while we prepare your insights.</p>
        </div>
      ) : !isProtocolComplete ? (
        <div className="flex-grow flex flex-col min-h-[400px] md:min-h-[500px]">
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoadingResponse={isLoading} currentPhaseName={currentPhaseName} />
        </div>
      ) : null}
      

      {isProtocolComplete && finalClaritySummary && !showFeedbackForm && (
         <div className="my-6">
            <ClaritySummary summaryData={finalClaritySummary} sessionId={currentSessionId!} />
            <div className="mt-6 text-center">
                <Button onClick={() => setShowFeedbackForm(true)} variant="default" size="lg">
                    Proceed to Feedback
                </Button>
            </div>
         </div>
      )}

      {isProtocolComplete && showFeedbackForm && currentSessionId && firebaseUser && currentCircumstance && (
        <PostSessionFeedback 
            sessionId={currentSessionId} 
            userId={firebaseUser.uid}
            circumstance={currentCircumstance}
            onReturnToStart={restartProtocol}
        />
      )}

    </div>
  );
}
