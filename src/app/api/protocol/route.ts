// src/app/api/protocol/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cognitiveEdgeProtocol } from '@/ai/flows/cognitive-edge-protocol';
import type { CognitiveEdgeProtocolInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CognitiveEdgeProtocolInput = await request.json();
    
    // Validate required fields
    if (!body.userInput || !body.phase) {
      return NextResponse.json(
        { error: 'Missing required fields: userInput and phase' },
        { status: 400 }
      );
    }

    const result = await cognitiveEdgeProtocol(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in cognitive edge protocol:', error);
    return NextResponse.json(
      { error: 'Failed to process protocol request' },
      { status: 500 }
    );
  }
}
