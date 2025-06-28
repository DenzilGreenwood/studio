// src/app/api/protocol/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitiveEdgeProtocol } from '@/ai/flows/cognitive-edge-protocol';
import type { CognitiveEdgeProtocolInput } from '@/types';

export async function GET(request: NextRequest) {
  try {
    console.log('Protocol Health Check: Starting...');
    
    // Test the cognitive edge protocol with a minimal input
    const testInput: CognitiveEdgeProtocolInput = {
      userInput: "I'm feeling a bit overwhelmed with work lately.",
      phase: "Stabilize & Structure",
      sessionHistory: "",
      attemptCount: 1
    };

    const startTime = Date.now();
    const result = await cognitiveEdgeProtocol(testInput);
    const endTime = Date.now();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime,
      testResult: {
        hasResponse: !!result.response,
        responseLength: result.response?.length || 0,
        nextPhase: result.nextPhase,
        sessionHistoryLength: result.sessionHistory?.length || 0
      }
    };
    
    console.log('Protocol Health Check: Success', healthData);
    
    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Protocol Health Check: Failed', error);
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    };
    
    return NextResponse.json(errorData, { status: 500 });
  }
}
