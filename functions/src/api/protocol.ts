/**
 * Protocol Function
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Types for the protocol input
interface CognitiveEdgeProtocolInput {
  userInput: string;
  phase: number | string;
  attemptCount?: number;
  sessionHistory?: any[];
}

const phaseNames = [
  'Stabilize & Structure',
  'Listen for Core Frame', 
  'Validate Emotion / Reframe',
  'Provide Grounded Support',
  'Reflective Pattern Discovery',
  'Empower & Legacy Statement',
  'Complete'
] as const;

// Since we can't directly import Genkit flows in Firebase Functions,
// we'll need to implement a different approach or use HTTP calls to Genkit
export const protocolFunction = onRequest({
  cors: true,
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 10
}, async (req, res) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const body: CognitiveEdgeProtocolInput = req.body;
    
    // Validate required fields
    if (!body.userInput || body.phase === undefined || body.phase === null) {
      logger.error('Protocol API: Missing required fields', { 
        hasUserInput: !!body.userInput, 
        hasPhase: body.phase !== undefined && body.phase !== null,
        phase: body.phase 
      });
      res.status(400).json({
        error: 'Missing required fields: userInput and phase'
      });
      return;
    }

    logger.info('Protocol API: Processing request', { 
      phase: body.phase, 
      userInputLength: body.userInput.length,
      attemptCount: body.attemptCount 
    });

    // Convert numeric phase to phase name if needed
    let phaseName: typeof phaseNames[number];
    if (typeof body.phase === 'number') {
      const phaseIndex = Math.max(0, Math.min(body.phase, phaseNames.length - 1));
      phaseName = phaseNames[phaseIndex];
    } else {
      phaseName = body.phase as typeof phaseNames[number];
    }

    // Import and call the Genkit cognitive edge protocol flow
    const { processCognitiveEdgeProtocol } = await import('../lib/ai-flows.js');
    
    const protocolInput = {
      userInput: body.userInput,
      phase: phaseName,
      sessionHistory: body.sessionHistory ? JSON.stringify(body.sessionHistory) : undefined,
      attemptCount: body.attemptCount
    };

    const aiResult = await processCognitiveEdgeProtocol(protocolInput);

    const result = {
      response: aiResult.response,
      nextPhase: aiResult.nextPhase,
      sessionHistory: body.sessionHistory || [],
      phase: body.phase,
      timestamp: new Date().toISOString(),
      updatedSessionHistory: aiResult.sessionHistory
    };

    logger.info('Protocol API: Success', { 
      hasResponse: !!result.response,
      nextPhase: result.nextPhase,
      sessionHistoryLength: result.sessionHistory.length 
    });
    
    res.status(200).json(result);

  } catch (error) {
    logger.error('Error in cognitive edge protocol:', error);
    
    // Provide more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : 'UnknownError'
    };
    
    logger.error('Protocol API: Detailed error', errorDetails);
    
    res.status(500).json({
      error: 'Failed to process protocol request',
      details: errorDetails.message
    });
  }
});
