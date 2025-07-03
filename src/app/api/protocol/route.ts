// src/app/api/protocol/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitiveEdgeProtocol } from '@/ai/flows/cognitive-edge-protocol';
import type { CognitiveEdgeProtocolInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CognitiveEdgeProtocolInput = await request.json();
    
    // Validate required fields
    if (!body.userInput || !body.phase) {
      console.error('Protocol API: Missing required fields', { 
        hasUserInput: !!body.userInput, 
        hasPhase: !!body.phase,
        phase: body.phase 
      });
      return NextResponse.json(
        { error: 'Missing required fields: userInput and phase' },
        { status: 400 }
      );
    }

    console.log('Protocol API: Processing request', { 
      phase: body.phase, 
      userInputLength: body.userInput.length,
      attemptCount: body.attemptCount 
    });

    const result = await cognitiveEdgeProtocol(body);
    
    console.log('Protocol API: Success', { 
      hasResponse: !!result.response,
      nextPhase: result.nextPhase,
      sessionHistoryLength: result.sessionHistory.length 
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in cognitive edge protocol:', error);
    
    // Provide more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : 'UnknownError'
    };
    
    console.error('Protocol API: Detailed error', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to process protocol request',
        details: errorDetails.message 
      },
      { status: 500 }
    );
  }
}
