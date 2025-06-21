// src/app/(app)/protocol/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChatInterface, type Message as UIMessage } from '@/components/protocol/chat-interface';
import { PhaseIndicator } from '@/components/protocol/phase-indicator';
import { useToast } from '@/hooks/use-toast';
import { cognitiveEdgeProtocol, type CognitiveEdgeProtocolInput, type CognitiveEdgeProtocolOutput } from '@/ai/flows/cognitive-edge-protocol';
import { generateClaritySummary, type ClaritySummaryInput, type ClaritySummaryOutput } from '@/ai/flows/clarity-summary-generator';
import { analyzeSentiment, type SentimentAnalysisInput, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis-flow';
import { Loader2 } from 'lucide-react';
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
  updateDoc,
  Timestamp,
} from '@/lib/firebase';
import type { ProtocolSession, ChatMessage as FirestoreChatMessage } from '@/types';
import { useRouter } from 'next/navigation'; 
import { PostSessionFeedback } from '@/components/feedback/post-session-feedback';


const TOTAL_PHASES = 6;
const PHASE_NAMES: (CognitiveEdgeProtocolInput['phase'])[] = [
  "Stabilize & Structure",
  "Listen for Core Frame",
  "Validate Emotion / Reframe",
  "Provide Grounded Support",
  "Reflective Pattern Discovery",
  "Empower & Legacy Statement",
  "Complete"
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
  showToast: (options: any) => void,
  completedPhases: number
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
  const finalUpdatePayload: Partial<ProtocolSession> = {
    completedPhases,
    endTime: serverTimestamp(),
  };

  if (!summaryInputData.actualReframedBelief.trim() && !summaryInputData.actualLegacyStatement.trim()) {
    showToast({ variant: "destructive", title: "Missing Key Data", description: "Crucial session elements (reframed belief or legacy statement) were not captured. A full AI summary cannot be generated." });
     await updateDoc(sessionDocRef, {
       ...finalUpdatePayload,
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
      ...finalUpdatePayload,
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
      ...finalUpdatePayload,
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentCircumstance, setCurrentCircumstance] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // New state for robust statement capture and retry logic
  const [keyQuestionAttemptCount, setKeyQuestionAttemptCount] = useState(1);
  const [lastAiQuestion, setLastAiQuestion] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFeedbackAndRedirect = (feedbackId: string) => {
    if (currentSessionId && currentCircumstance) {
      const url = `/session-report/${currentSessionId}?circumstance=${encodeURIComponent(currentCircumstance)}&review_submitted=true`;
      router.push(url);
    } else {
      toast({
        title: "Feedback submitted!",
        description: "Could not redirect to report, but your feedback was received.",
        variant: "default",
      });
      router.push('/sessions');
    }
  };

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
    setLastAiQuestion(firstMessageText); // Initialize last AI question

    await addDoc(collection(db, `users/${firebaseUser.uid}/circumstances/${circumstance}/sessions/${newSessionId}/messages`), {
      sender: 'ai',
      text: firstMessageText,
      timestamp: serverTimestamp(),
      phaseName: PHASE_NAMES[0],
    });
    
    setCurrentPhase(1);
    setCurrentPhaseName(PHASE_NAMES[0]);
    setKeyQuestionAttemptCount(1);
    setSessionDataForSummary({ topEmotions: "Not analyzed" }); 
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
    const prevPhaseName = currentPhaseName;

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
      phaseName: prevPhaseName,
    });

    setIsLoading(true);
    try {
      const input: CognitiveEdgeProtocolInput = {
        userInput: currentUserInputText,
        phase: prevPhaseName,
        sessionHistory: sessionHistoryForAI,
        attemptCount: keyQuestionAttemptCount,
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
      setLastAiQuestion(output.response);

      const isPhaseAdvancing = prevPhaseName !== output.nextPhase;

      if (isPhaseAdvancing) {
        // Capture key statements when the phase ADVANCES from a key-statement phase.
        // This means the user's last input was the successful statement.
        if (prevPhaseName === "Validate Emotion / Reframe") {
            setSessionDataForSummary(prev => ({
                ...prev,
                reframedBeliefInteraction: { aiQuestion: lastAiQuestion!, userResponse: currentUserInputText },
                actualReframedBelief: currentUserInputText
            }));
        }
        if (prevPhaseName === "Empower & Legacy Statement") {
            setSessionDataForSummary(prev => ({
                ...prev,
                legacyStatementInteraction: { aiQuestion: lastAiQuestion!, userResponse: currentUserInputText },
                actualLegacyStatement: currentUserInputText
            }));
        }

        setKeyQuestionAttemptCount(1); // Reset counter on any phase change
      } else {
        // Phase is the same, so it's a retry.
        setKeyQuestionAttemptCount(prev => prev + 1);
      }

      const nextPhaseIndex = PHASE_NAMES.indexOf(output.nextPhase);
      const newPhaseNumber = nextPhaseIndex >= 0 ? nextPhaseIndex + 1 : currentPhase;
      setCurrentPhase(newPhaseNumber);
      setCurrentPhaseName(output.nextPhase);
      
      if (output.nextPhase === 'Complete') {
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
          
          // Use a function to get the latest state for summary generation
          setSessionDataForSummary(currentSummaryData => {
            const finalDataForFirestore: SessionDataForSummaryFunctionArg = {
              actualReframedBelief: currentSummaryData?.actualReframedBelief || "",
              reframedBeliefInteraction: currentSummaryData?.reframedBeliefInteraction || null,
              actualLegacyStatement: currentSummaryData?.actualLegacyStatement || userInput, // Use latest input if needed
              legacyStatementInteraction: currentSummaryData?.legacyStatementInteraction || { aiQuestion: lastAiQuestion!, userResponse: userInput},
              topEmotions: detectedUserEmotions,
            };

            generateAndSaveSummary(
              currentSessionId, 
              firebaseUser.uid, 
              currentCircumstance,
              finalDataForFirestore, 
              toast,
              TOTAL_PHASES
            );
            return currentSummaryData; // No need to update state here, it was already updated
          });

          setIsProtocolComplete(true); 
          setShowFeedbackForm(true); // Show feedback form immediately
          setIsLoading(false); 
          return; 
      }
      
      // Update completed phases count in Firestore if phase advanced
      if (isPhaseAdvancing) {
        const sessionDocRef = doc(db, `users/${firebaseUser.uid}/circumstances/${currentCircumstance}/sessions/${currentSessionId}`);
        await updateDoc(sessionDocRef, { completedPhases: newPhaseNumber - 1 });
      }

      setIsLoading(false); 
      
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
    setIsProtocolComplete(false);
    setShowFeedbackForm(false);
    setKeyQuestionAttemptCount(1);
    setLastAiQuestion(null);
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
        currentPhase={currentPhase > TOTAL_PHASES ? TOTAL_PHASES : currentPhase}
        totalPhases={TOTAL_PHASES}
        phaseName={currentPhaseName}
        isCompleted={isProtocolComplete}
        isLoadingNextPhase={isLoading && !isProtocolComplete && currentPhase <= TOTAL_PHASES}
      />
      
      {isLoading && isProtocolComplete ? ( 
         <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md flex-grow">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="font-headline text-2xl text-primary mb-2">Finalizing Your Session...</h2>
          <p className="text-muted-foreground">Just a moment while we prepare your insights and feedback form.</p>
        </div>
      ) : !isProtocolComplete ? (
        <div className="flex-grow flex flex-col min-h-[400px] md:min-h-[500px]">
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoadingResponse={isLoading} currentPhaseName={currentPhaseName} />
        </div>
      ) : null}
      
      {isProtocolComplete && showFeedbackForm && currentSessionId && firebaseUser && currentCircumstance && (
        <PostSessionFeedback 
            sessionId={currentSessionId} 
            userId={firebaseUser.uid}
            circumstance={currentCircumstance}
            onFeedbackSubmitted={handleFeedbackAndRedirect}
        />
      )}

    </div>
  );
}
