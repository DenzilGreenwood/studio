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
  where,
  writeBatch
} from '@/lib/firebase';
import { cognitiveEdgeProtocol } from '@/ai/flows/cognitive-edge-protocol';
import { generateClaritySummary } from '@/ai/flows/clarity-summary-generator';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis-flow';
import type { ProtocolSession, ChatMessage as FirestoreChatMessage } from '@/types';
import { useRouter } from 'next/navigation'; 
import { PostSessionFeedback } from '@/components/feedback/post-session-feedback';
import { ClaritySummary } from '@/components/protocol/clarity-summary';
import { Button } from '@/components/ui/button';

// Type imports from the central types file
import type { FieldValue } from 'firebase/firestore';
import { 
  protocolPhaseNames,
  type ProtocolPhase,
  type CognitiveEdgeProtocolInput, 
  type CognitiveEdgeProtocolOutput,
  type ClaritySummaryInput, 
  type ClaritySummaryOutput,
  type SentimentAnalysisInput, 
  type SentimentAnalysisOutput
} from '@/types';


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

type ClaritySummaryContentType = ClaritySummaryOutput & SessionDataForSummaryFunctionArg & { generatedAt?: FieldValue | Date };


async function generateAndSaveSummary(
  sessionId: string,
  userId: string,
  summaryInputData: SessionDataForSummaryFunctionArg, 
  showToast: (options: any) => void,
  completedPhases: number
): Promise<ClaritySummaryContentType | null> {
  if (!sessionId || !userId) {
    showToast({ variant: "destructive", title: "Error", description: "User or Session ID missing for summary." });
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
     await setDoc(sessionDocRef, {
       summary: { 
        ...baseSummaryContentToSaveOnError,
        generatedAt: serverTimestamp() as unknown as Date
      }
    }, { merge: true });
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

    await setDoc(sessionDocRef, {
      summary: { 
        ...summaryToPersist,
        generatedAt: serverTimestamp() as unknown as Date
      }
    }, { merge: true });
    return summaryToPersist;

  } catch (error: any) {
    const errorMessage = error.message || "An unexpected error occurred.";
    console.error("Error generating summary:", error);
    showToast({ variant: "destructive", title: "Summary Generation Failed", description: `Could not generate the insight summary. Details: ${errorMessage}` });
    const errorSummaryToPersist: ClaritySummaryContentType = {
      ...baseSummaryContentToSaveOnError,
      insightSummary: "Failed to generate AI summary. Please try downloading raw insights or contact support.",
    };
    await setDoc(sessionDocRef, {
      summary: { 
        ...errorSummaryToPersist,
        generatedAt: serverTimestamp() as unknown as Date
      }
    }, { merge: true });
    return errorSummaryToPersist;
  }
}


export default function ProtocolPage() {
  const { firebaseUser, user } = useAuth();
  const router = useRouter(); 
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [currentPhaseName, setCurrentPhaseName] = useState<ProtocolPhase>(PHASE_NAMES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionHistoryForAI, setSessionHistoryForAI] = useState<string | undefined>(undefined);
  const [isProtocolComplete, setIsProtocolComplete] = useState(false);
  const [sessionDataForSummary, setSessionDataForSummary] = useState<Partial<SessionDataForSummaryInternal>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentCircumstance, setCurrentCircumstance] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [currentCircumstance, setCurrentCircumstance] = useState<string | null>(null); // <-- Added
  
  const [keyQuestionAttemptCount, setKeyQuestionAttemptCount] = useState(1);
  const [lastAiQuestion, setLastAiQuestion] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false); // New state to trigger finalization

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
    
    if (!user.primaryChallenge || !user.ageRange) {
      toast({
        title: "Profile Incomplete",
        description: "Please select a primary challenge and age range in your profile before starting a session.",
        variant: "destructive",
      });
      router.push('/profile');
      return;
    }

    setIsLoading(true);
    setIsProtocolComplete(false); 
    setShowFeedbackForm(false); 
    
    const circumstance = user.primaryChallenge;
    setCurrentCircumstance(circumstance); // <-- Set state

    const newSessionRef = doc(collection(db, `users/${firebaseUser.uid}/sessions`));
    const newSessionId = newSessionRef.id;
    setCurrentSessionId(newSessionId);

    const initialSessionData: Partial<ProtocolSession> = {
      sessionId: newSessionId,
      userId: firebaseUser.uid,
      circumstance: circumstance,
      ageRange: user.ageRange,
      startTime: serverTimestamp() as unknown as Date, // allow FieldValue
      completedPhases: 0,
      summary: {
        insightSummary: "",
        actualReframedBelief: "",
        actualLegacyStatement: "",
        topEmotions: "",
        generatedAt: serverTimestamp() as unknown as Date, // allow FieldValue
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
    setLastAiQuestion(firstMessageText);

    await addDoc(collection(db, `users/${firebaseUser.uid}/sessions/${newSessionId}/messages`), {
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

  // This effect runs when the protocol is marked as 'finishing' to handle async operations
  useEffect(() => {
    if (!isFinishing || !firebaseUser || !currentSessionId || !currentCircumstance) {
      return;
    }

    const finalizeSession = async () => {
      setIsLoading(true);

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

      await generateAndSaveSummary(
        currentSessionId, 
        firebaseUser.uid, 
        finalDataForFirestore, 
        toast,
        TOTAL_PHASES
      );

      setShowFeedbackForm(true);
      setIsLoading(false);
      setIsFinishing(false); // Reset the trigger
    };

    finalizeSession();
  }, [isFinishing, firebaseUser, currentSessionId, currentCircumstance, sessionDataForSummary, toast]);


  const handleSendMessage = async (userInput: string) => {
    if (isProtocolComplete || !currentSessionId || !firebaseUser) return;

    const currentUserInputText = userInput.trim();
    const prevPhaseName = currentPhaseName;

    const newUserUIMessage: UIMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: currentUserInputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserUIMessage]);
    
    await addDoc(collection(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}/messages`), {
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

      const output = await cognitiveEdgeProtocol(input);
      
      const aiResponseUIMessage: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: output.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponseUIMessage]);
      
      await addDoc(collection(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}/messages`), {
        sender: 'ai',
        text: output.response,
        timestamp: serverTimestamp(),
        phaseName: output.nextPhase,
      });
      
      setSessionHistoryForAI(output.sessionHistory);
      setLastAiQuestion(output.response);

      const isPhaseAdvancing = prevPhaseName !== output.nextPhase;

      if (isPhaseAdvancing) {
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
        setKeyQuestionAttemptCount(1);
      } else {
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
          
          const finalDataForFirestore: SessionDataForSummaryFunctionArg = {
            actualReframedBelief: sessionDataForSummary?.actualReframedBelief || "",
            reframedBeliefInteraction: sessionDataForSummary?.reframedBeliefInteraction || null,
            actualLegacyStatement: sessionDataForSummary?.actualLegacyStatement || "",
            legacyStatementInteraction: sessionDataForSummary?.legacyStatementInteraction || null,
            topEmotions: detectedUserEmotions,
          };
          
          // Batch write to update session and user profile
          const userDocRef = doc(db, `users/${firebaseUser.uid}`);
          const userDocSnap = await getDoc(userDocRef);
          const currentSessionCount = userDocSnap.exists() ? (userDocSnap.data().sessionCount || 0) : 0;
          
          const batch = writeBatch(db);

          batch.update(sessionDocRef, {
            completedPhases: TOTAL_PHASES,
            endTime: serverTimestamp(),
            'summary.actualReframedBelief': finalDataForFirestore.actualReframedBelief, 
            'summary.actualLegacyStatement': finalDataForFirestore.actualLegacyStatement, 
            'summary.topEmotions': finalDataForFirestore.topEmotions,
            'summary.reframedBeliefInteraction': finalDataForFirestore.reframedBeliefInteraction,
            'summary.legacyStatementInteraction': finalDataForFirestore.legacyStatementInteraction,
          });

          batch.update(userDocRef, {
            lastSessionAt: serverTimestamp(),
            sessionCount: currentSessionCount + 1,
          });

          await batch.commit();
          
          const generatedSummary = await generateAndSaveSummary(
            currentSessionId, 
            firebaseUser.uid, 
            finalDataForFirestore, 
            toast
          );

          setIsProtocolComplete(true); 
          setShowFeedbackForm(true); // Show feedback form immediately
          setIsLoading(false); 
          return; 
      }
      
      if (isPhaseAdvancing) {
        const sessionDocRef = doc(db, `users/${firebaseUser.uid}/circumstances/${currentCircumstance}/sessions/${currentSessionId}`);
        await updateDoc(sessionDocRef, { completedPhases: newPhaseNumber - 1 });
      }

      setIsLoading(false); 
      
    } catch (error) {
      console.error("Error in AI protocol:", error);
      toast({
        variant: "destructive",
        title: "AI Protocol Error",
        description: errorMessage,
        duration: 10000,
      });
      const errorResponse: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `I'm sorry, I encountered an issue and couldn't proceed. The error was: "${errorMessage}" Please try again.`,
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
    setIsFinishing(false);
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
