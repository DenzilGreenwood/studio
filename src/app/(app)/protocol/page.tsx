// src/app/(app)/protocol/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChatInterface, type Message as UIMessage } from '@/components/protocol/chat-interface';
import { PhaseIndicator } from '@/components/protocol/phase-indicator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, BookOpen, Eye } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { TTSSettings } from '@/components/ui/tts-settings';
import Link from 'next/link';
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
  writeBatch,
  getDoc
} from '@/lib/firebase';
import type { ProtocolSession, ChatMessage as FirestoreChatMessage } from '@/types';
import { useRouter } from 'next/navigation'; 
import { PostSessionFeedback } from '@/components/feedback/post-session-feedback';
import { ClaritySummary } from '@/components/protocol/clarity-summary';
import { EmotionalProgression } from '@/components/protocol/emotional-progression';
import { Button } from '@/components/ui/button';
import { encryptChatMessage, decryptChatMessage, encryptSessionData, decryptSessionData } from '@/lib/data-encryption';

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

// Type imports only (no functions)
import type { EmotionalToneOutput } from '@/ai/flows/emotional-tone-analyzer';

// Define input types locally to avoid importing server-side code
interface EmotionalToneInput {
  userMessage: string;
  context?: string;
  previousTone?: string;
}


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
  circumstance: string,
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
  
  const sessionDocRef = doc(db, `users/${userId}/sessions/${sessionId}`);
  const finalUpdatePayload: Partial<ProtocolSession> = {
    completedPhases,
    endTime: serverTimestamp() as any,
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
    
    // Call the API for clarity summary
    const summaryResponse = await fetch('/api/clarity-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summaryInputForAI),
    });

    if (!summaryResponse.ok) {
      throw new Error('Failed to generate clarity summary');
    }

    const summaryOutput = await summaryResponse.json();
    
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
  const [isLoading, setIsLoading] = useState(false); // Changed: Don't start with loading true
  const [sessionHistoryForAI, setSessionHistoryForAI] = useState<string | undefined>(undefined);
  const [isProtocolComplete, setIsProtocolComplete] = useState(false);
  const [sessionDataForSummary, setSessionDataForSummary] = useState<Partial<SessionDataForSummaryInternal>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentCircumstance, setCurrentCircumstance] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false); // New state to track initialization
  
  // Enhanced emotional tracking
  const [emotionalProgression, setEmotionalProgression] = useState<Array<{
    phaseIndex: number;
    phaseName: string;
    primaryEmotion: string;
    intensity: number;
    timestamp: Date;
    triggerMessage?: string;
  }>>([]);
  
  const [keyStatements, setKeyStatements] = useState<{
    reframedBelief?: {
      statement: string;
      phaseIndex: number;
      timestamp: Date;
      confidence: number;
    };
    legacyStatement?: {
      statement: string;
      phaseIndex: number;
      timestamp: Date;
      confidence: number;
    };
    insights?: Array<{
      insight: string;
      phaseIndex: number;
      timestamp: Date;
      emotionalContext: string;
    }>;
  }>({});
  
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
    
    // Since we removed profile requirements, we can proceed directly to session creation
    // The user can describe their challenge during the first phase

    // Check if there's already an active session
    try {
      // Get all sessions and filter in memory to avoid index requirements
      const allSessionsQuery = query(
        collection(db, `users/${firebaseUser.uid}/sessions`),
        orderBy("startTime", "desc")
      );
      const allSessionsSnap = await getDocs(allSessionsQuery);
      
      // Find the first active session (completedPhases < 6)
      const activeSessionDoc = allSessionsSnap.docs.find(doc => {
        const data = doc.data();
        return (data.completedPhases || 0) < 6;
      });
      
      if (activeSessionDoc) {
        const encryptedSessionData = activeSessionDoc.data() as ProtocolSession;
        
        // Decrypt session data before resuming
        const sessionData = await decryptSessionData(encryptedSessionData);
        
        // Resume existing session
        setCurrentSessionId(activeSessionDoc.id);
        setCurrentCircumstance(sessionData.circumstance);
        setCurrentPhase(sessionData.completedPhases + 1);
        setCurrentPhaseName(PHASE_NAMES[sessionData.completedPhases] || PHASE_NAMES[0]);
        
        // Restore session-specific state
        if (sessionData.emotionalProgression) {
          setEmotionalProgression(sessionData.emotionalProgression.map(ep => ({
            ...ep,
            timestamp: ep.timestamp instanceof Timestamp ? ep.timestamp.toDate() : ep.timestamp
          })));
        }
        
        if (sessionData.keyStatements) {
          setKeyStatements({
            reframedBelief: sessionData.keyStatements.reframedBelief ? {
              ...sessionData.keyStatements.reframedBelief,
              timestamp: sessionData.keyStatements.reframedBelief.timestamp instanceof Timestamp 
                ? sessionData.keyStatements.reframedBelief.timestamp.toDate()
                : sessionData.keyStatements.reframedBelief.timestamp
            } : undefined,
            legacyStatement: sessionData.keyStatements.legacyStatement ? {
              ...sessionData.keyStatements.legacyStatement,
              timestamp: sessionData.keyStatements.legacyStatement.timestamp instanceof Timestamp
                ? sessionData.keyStatements.legacyStatement.timestamp.toDate()
                : sessionData.keyStatements.legacyStatement.timestamp
            } : undefined,
            insights: sessionData.keyStatements.insights?.map(insight => ({
              ...insight,
              timestamp: insight.timestamp instanceof Timestamp ? insight.timestamp.toDate() : insight.timestamp
            }))
          });
        }
        
        // Restore session data for summary if it exists
        if (sessionData.summary) {
          setSessionDataForSummary({
            actualReframedBelief: sessionData.summary.actualReframedBelief,
            actualLegacyStatement: sessionData.summary.actualLegacyStatement,
            topEmotions: sessionData.summary.topEmotions,
            reframedBeliefInteraction: sessionData.summary.reframedBeliefInteraction,
            legacyStatementInteraction: sessionData.summary.legacyStatementInteraction,
          });
        }
        
        // Load existing messages
        const messagesQuery = query(
          collection(db, `users/${firebaseUser.uid}/sessions/${activeSessionDoc.id}/messages`),
          orderBy("timestamp", "asc")
        );
        const messagesSnap = await getDocs(messagesQuery);
        const existingMessages: UIMessage[] = [];
        
        // Decrypt each message before adding to UI
        for (const docSnap of messagesSnap.docs) {
          const data = docSnap.data() as FirestoreChatMessage;
          try {
            // Decrypt the message data
            const decryptedMessage = await decryptChatMessage(data);
            existingMessages.push({
              id: docSnap.id,
              sender: decryptedMessage.sender,
              text: decryptedMessage.text,
              timestamp: (decryptedMessage.timestamp as Timestamp)?.toDate() || new Date(),
            });
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            // Fallback to showing encrypted data indicator
            existingMessages.push({
              id: docSnap.id,
              sender: data.sender,
              text: '[Encrypted Message - Cannot Decrypt]',
              timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
            });
          }
        }
        
        setMessages(existingMessages);
        
        // Set the last AI message for context
        const lastAiMessage = existingMessages.filter(msg => msg.sender === 'ai').pop();
        if (lastAiMessage) {
          setLastAiQuestion(lastAiMessage.text);
        }
        
        // Build session history for AI context
        const conversationHistory = existingMessages
          .map(msg => `${msg.sender}: ${msg.text}`)
          .join('\n');
        setSessionHistoryForAI(conversationHistory);
        
        console.log('Session resumed successfully:', {
          sessionId: activeSessionDoc.id,
          circumstance: sessionData.circumstance,
          phase: sessionData.completedPhases + 1,
          messageCount: existingMessages.length,
          hasEmotionalProgression: !!sessionData.emotionalProgression,
          hasKeyStatements: !!sessionData.keyStatements
        });
        
        toast({
          title: "Session Resumed",
          description: `Continuing your session: ${sessionData.circumstance}`,
          variant: "default",
        });
        
        return;
      }
    } catch (error) {
      console.error("Error checking for active sessions:", error);
    }

    setIsLoading(true);
    setIsProtocolComplete(false); 
    setShowFeedbackForm(false); 
    
    // Users will describe their challenge during Phase 1, so we use a generic placeholder
    const circumstance = "Session in progress - challenge to be described";
    setCurrentCircumstance(circumstance);

    const newSessionRef = doc(collection(db, `users/${firebaseUser.uid}/sessions`));
    const newSessionId = newSessionRef.id;
    setCurrentSessionId(newSessionId);

    const initialSessionData: Partial<ProtocolSession> = {
      sessionId: newSessionId,
      userId: firebaseUser.uid,
      circumstance: circumstance,
      startTime: serverTimestamp() as unknown as Date,
      completedPhases: 0,
      summary: {
        insightSummary: "",
        actualReframedBelief: "",
        actualLegacyStatement: "",
        topEmotions: "",
        generatedAt: serverTimestamp() as unknown as Date,
      }
    };
    
    // Encrypt session data before storing
    const encryptedSessionData = await encryptSessionData(initialSessionData);
    await setDoc(newSessionRef, encryptedSessionData);
    
    const firstMessageText = `Welcome to CognitiveInsight! Let's begin with Phase 1: ${PHASE_NAMES[0]}. Please describe the challenge or situation you're currently facing. Take your time to share what's on your mind and what brought you here today.`;
    const firstUIMessage: UIMessage = {
      id: crypto.randomUUID(),
      sender: 'ai',
      text: firstMessageText,
      timestamp: new Date(),
    };
    setMessages([firstUIMessage]);
    setLastAiQuestion(firstMessageText);

    // Encrypt AI message before storing
    const encryptedAiMessage = await encryptChatMessage({
      sender: 'ai',
      text: firstMessageText,
      timestamp: serverTimestamp(),
      phaseName: PHASE_NAMES[0],
    });

    await addDoc(collection(db, `users/${firebaseUser.uid}/sessions/${newSessionId}/messages`), encryptedAiMessage);
    
    setCurrentPhase(1);
    setCurrentPhaseName(PHASE_NAMES[0]);
    setKeyQuestionAttemptCount(1);
    setSessionDataForSummary({ topEmotions: "Not analyzed" }); 
    setSessionHistoryForAI(undefined);
    setIsLoading(false);
  }, [firebaseUser, user, router, toast]);

  useEffect(() => {
    if (firebaseUser && user && !currentSessionId && !sessionInitialized) {
      console.log('Initializing session...', { firebaseUser: !!firebaseUser, user: !!user, currentSessionId, sessionInitialized });
      setSessionInitialized(true);
      initializeSession();
    }
  }, [firebaseUser, user, currentSessionId, sessionInitialized, initializeSession]);

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
          collection(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}/messages`),
          orderBy("timestamp", "asc")
        );
        const messagesSnap = await getDocs(messagesQuery);
        
        // Decrypt user messages for sentiment analysis
        const userMessagesTexts: string[] = [];
        for (const docSnap of messagesSnap.docs) {
          const data = docSnap.data() as FirestoreChatMessage;
          if (data.sender === 'user') {
            try {
              const decryptedMessage = await decryptChatMessage(data);
              userMessagesTexts.push(decryptedMessage.text);
            } catch (error) {
              console.error('Failed to decrypt user message for sentiment analysis:', error);
              // Skip encrypted messages that can't be decrypted
            }
          }
        }
        
        const userMessagesText = userMessagesTexts.join('\n\n');
        
        if (userMessagesText.trim()) {
          const sentimentInput: SentimentAnalysisInput = { userMessages: userMessagesText };
          
          // Call the API for sentiment analysis
          const sentimentResponse = await fetch('/api/sentiment-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sentimentInput),
          });

          if (sentimentResponse.ok) {
            const sentimentOutput = await sentimentResponse.json();
            detectedUserEmotions = sentimentOutput.detectedEmotions;
          } else {
            throw new Error('Failed to analyze sentiment');
          }
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
        currentCircumstance!,
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
    const currentPhaseIndex = PHASE_NAMES.indexOf(prevPhaseName);

    const newUserUIMessage: UIMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: currentUserInputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserUIMessage]);
    
    // Encrypt user message before storing
    const encryptedUserMessage = await encryptChatMessage({
      sender: 'user',
      text: currentUserInputText,
      timestamp: serverTimestamp(),
      phaseName: prevPhaseName,
    });

    await addDoc(collection(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}/messages`), encryptedUserMessage);

    // Analyze emotional tone of user input
    try {
      const previousEmotion = emotionalProgression.length > 0 
        ? emotionalProgression[emotionalProgression.length - 1].primaryEmotion 
        : undefined;
      
      // Call the API for emotional tone analysis
      const emotionalToneResponse = await fetch('/api/emotional-tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: currentUserInputText,
          context: `Phase: ${prevPhaseName}. Session context: ${currentCircumstance}`,
          previousTone: previousEmotion
        }),
      });

      let emotionalAnalysis = null;
      
      if (emotionalToneResponse.ok) {
        emotionalAnalysis = await emotionalToneResponse.json();
        
        // Add to emotional progression
        const newEmotionalData = {
          phaseIndex: currentPhaseIndex,
          phaseName: prevPhaseName,
          primaryEmotion: emotionalAnalysis.primaryEmotion || 'neutral',
          intensity: emotionalAnalysis.intensity || 5,
          timestamp: new Date(),
          triggerMessage: currentUserInputText
        };

        setEmotionalProgression(prev => [...prev, newEmotionalData]);
      } else {
        console.warn('Emotional tone analysis failed, continuing without it');
        
        // Add a fallback emotional data entry
        const fallbackEmotionalData = {
          phaseIndex: currentPhaseIndex,
          phaseName: prevPhaseName,
          primaryEmotion: 'neutral',
          intensity: 5,
          timestamp: new Date(),
          triggerMessage: currentUserInputText
        };
        
        setEmotionalProgression(prev => [...prev, fallbackEmotionalData]);
      }
    } catch (error) {
      console.error('Emotional tone analysis failed:', error);
      // Continue without emotional analysis rather than breaking the flow
    }

    setIsLoading(true);
    try {
      const input: CognitiveEdgeProtocolInput = {
        userInput: currentUserInputText,
        phase: prevPhaseName,
        sessionHistory: sessionHistoryForAI,
        attemptCount: keyQuestionAttemptCount,
      };

      // Call the API for cognitive edge protocol
      const response = await fetch('/api/protocol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        // Get more detailed error information
        let errorMessage = 'Failed to get AI response';
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || '';
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        console.error('Protocol API error:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorDetails
        });
        
        // Show user-friendly error message based on status
        if (response.status === 400) {
          toast({
            variant: "destructive",
            title: "Invalid Request",
            description: "There was an issue with your message. Please try again."
          });
        } else if (response.status === 500) {
          toast({
            variant: "destructive",
            title: "AI Service Error",
            description: "The AI service is temporarily unavailable. Please try again in a moment."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Unable to connect to the AI service. Please check your connection and try again."
          });
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }

      const output = await response.json();
      
      const aiResponseUIMessage: UIMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: output.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponseUIMessage]);
      
      // Encrypt AI response before storing
      const encryptedAiResponse = await encryptChatMessage({
        sender: 'ai',
        text: output.response,
        timestamp: serverTimestamp(),
        phaseName: output.nextPhase,
      });

      await addDoc(collection(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}/messages`), encryptedAiResponse);
      
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
            
            // Capture reframed belief as key statement
            setKeyStatements(prev => ({
              ...prev,
              reframedBelief: {
                statement: currentUserInputText,
                phaseIndex: currentPhaseIndex,
                timestamp: new Date(),
                confidence: 0.9 // High confidence for phase completion
              }
            }));
        }
        if (prevPhaseName === "Empower & Legacy Statement") {
            setSessionDataForSummary(prev => ({
                ...prev,
                legacyStatementInteraction: { aiQuestion: lastAiQuestion!, userResponse: currentUserInputText },
                actualLegacyStatement: currentUserInputText
            }));
            
            // Capture legacy statement as key statement
            setKeyStatements(prev => ({
              ...prev,
              legacyStatement: {
                statement: currentUserInputText,
                phaseIndex: currentPhaseIndex,
                timestamp: new Date(),
                confidence: 0.9 // High confidence for phase completion
              }
            }));
        }
        
        // Check for key insights in any phase
        const insightKeywords = ['realize', 'understand', 'see now', 'breakthrough', 'clarity', 'aha', 'insight'];
        const hasInsight = insightKeywords.some(keyword => 
          currentUserInputText.toLowerCase().includes(keyword)
        );
        
        if (hasInsight) {
          const currentEmotion = emotionalProgression.length > 0 
            ? emotionalProgression[emotionalProgression.length - 1].primaryEmotion 
            : 'neutral';
            
          setKeyStatements(prev => ({
            ...prev,
            insights: [
              ...(prev.insights || []),
              {
                insight: currentUserInputText,
                phaseIndex: currentPhaseIndex,
                timestamp: new Date(),
                emotionalContext: currentEmotion
              }
            ]
          }));
        }
        
        setKeyQuestionAttemptCount(1);
      } else {
        setKeyQuestionAttemptCount(prev => prev + 1);
      }

      const nextPhaseIndex = PHASE_NAMES.indexOf(output.nextPhase);
      const newPhaseNumber = nextPhaseIndex >= 0 ? nextPhaseIndex + 1 : currentPhase;

      const sessionDocRef = doc(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}`);

      // Check if protocol is complete
      const isProtocolComplete = output.nextPhase === 'Complete';

      if (newPhaseNumber > currentPhase || isProtocolComplete) {
        if (currentPhase < TOTAL_PHASES && !isProtocolComplete) {
          setCurrentPhase(newPhaseNumber);
          setCurrentPhaseName(output.nextPhase);
          await updateDoc(sessionDocRef, {
            completedPhases: newPhaseNumber
          });
           setIsLoading(false); 
        } else if (isProtocolComplete) {
          setIsLoading(true); // Keep loading while generating summary etc.
          
          let detectedUserEmotions = "Emotions not analyzed";
          try {
            const messagesQuery = query(
              collection(db, `users/${firebaseUser.uid}/sessions/${currentSessionId}/messages`),
              orderBy("timestamp", "asc")
            );
            const messagesSnap = await getDocs(messagesQuery);
            
            // Decrypt user messages for sentiment analysis
            const userMessagesTexts: string[] = [];
            for (const docSnap of messagesSnap.docs) {
              const data = docSnap.data() as FirestoreChatMessage;
              if (data.sender === 'user') {
                try {
                  const decryptedMessage = await decryptChatMessage(data);
                  userMessagesTexts.push(decryptedMessage.text);
                } catch (error) {
                  console.error('Failed to decrypt user message for sentiment analysis:', error);
                  // Skip encrypted messages that can't be decrypted
                }
              }
            }
            
            const userMessagesText = userMessagesTexts.join('\n\n');
            
            if (userMessagesText.trim()) {
              const sentimentInput: SentimentAnalysisInput = { userMessages: userMessagesText };
              
              // Call the API for sentiment analysis
              const sentimentResponse = await fetch('/api/sentiment-analysis', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(sentimentInput),
              });

              if (sentimentResponse.ok) {
                const sentimentOutput = await sentimentResponse.json();
                detectedUserEmotions = sentimentOutput.detectedEmotions;
              } else {
                throw new Error('Failed to analyze sentiment');
              }
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
            emotionalProgression: emotionalProgression,
            keyStatements: keyStatements,
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
            currentCircumstance!,
            finalDataForFirestore, 
            toast,
            TOTAL_PHASES
          );

          setIsProtocolComplete(true); 
          setShowFeedbackForm(false); // Don't show feedback immediately - let user see report first
          setIsLoading(false); 
          
          // Show success message and redirect to report
          toast({
            title: "Session Complete! 🎉",
            description: "Your session report is ready. Take a moment to review your insights before providing feedback.",
            duration: 8000,
          });
          
          // Redirect to session report after a brief moment
          setTimeout(() => {
            router.push(`/session-report/${currentSessionId}?newCompletion=true`);
          }, 2000);
          
          return; 
        }
      } else {
         // Only update phase name if not complete
         if (!isProtocolComplete) {
           setCurrentPhaseName(output.nextPhase);
         }
         setIsLoading(false); 
      }
      
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred. Check the server logs for more details.";
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
    setCurrentPhase(1);
    setCurrentPhaseName(PHASE_NAMES[0]);
    setSessionDataForSummary({ topEmotions: "Not analyzed" });
    setSessionHistoryForAI(undefined);
    setSessionInitialized(false); // Reset initialization state
  };


  if (!firebaseUser || !user || (!currentSessionId && !sessionInitialized)) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="h-16 w-16 animate-pulse text-primary" />
        <p className="mt-4 font-headline text-xl">Loading CognitiveInsight Session...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl flex flex-col gap-4 md:gap-6 min-h-[calc(100vh-theme(spacing.32))]">
      <div className="flex justify-between items-center">
        <PhaseIndicator
          currentPhase={currentPhase > TOTAL_PHASES ? TOTAL_PHASES : currentPhase}
          totalPhases={TOTAL_PHASES}
          phaseName={currentPhaseName}
          isCompleted={isProtocolComplete}
          isLoadingNextPhase={isLoading && !isProtocolComplete && currentPhase <= TOTAL_PHASES}
        />
        <div className="flex items-center gap-2">
          <TTSSettings />
          {!isProtocolComplete && currentSessionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={restartProtocol}
              disabled={isLoading}
            >
              New Session
            </Button>
          )}
        </div>
      </div>
      
      {isLoading && isProtocolComplete ? ( 
         <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md flex-grow">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="font-headline text-2xl text-primary mb-2">Finalizing Your Session...</h2>
          <p className="text-muted-foreground">Just a moment while we prepare your insights and report.</p>
        </div>
      ) : isProtocolComplete && !showFeedbackForm ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg shadow-md flex-grow border border-primary/20">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h2 className="font-headline text-3xl text-primary mb-3">Session Complete! 🎉</h2>
          <p className="text-muted-foreground text-lg mb-6 max-w-md">
            Congratulations! You've completed your session. Your personalized report with insights and analysis is ready for review.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <Button asChild size="lg" className="flex-1">
              <Link href={`/session-report/${currentSessionId}`}>
                <BookOpen className="mr-2 h-5 w-5" />
                View Report
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href="/sessions">
                <Eye className="mr-2 h-5 w-5" />
                All Sessions
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            You'll be redirected to your report shortly...
          </p>
        </div>
      ) : !isProtocolComplete ? (
        <>
          <div className="flex-grow flex flex-col min-h-[400px] md:min-h-[500px]">
              <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoadingResponse={isLoading} currentPhaseName={currentPhaseName} />
          </div>
          
          {/* Show emotional progression when there's meaningful data */}
          {emotionalProgression.length > 1 && (
            <div className="mt-6">
              <EmotionalProgression 
                emotionalProgression={emotionalProgression}
                keyStatements={keyStatements}
              />
            </div>
          )}
        </>
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
