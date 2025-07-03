// src/app/api/session-reflection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReflection } from '@/ai/flows/session-reflection-flow';
import type { SessionReflectionInput } from '@/ai/flows/session-reflection-flow';

export async function POST(request: NextRequest) {
  try {
    const body: SessionReflectionInput = await request.json();
    
    // Validate required fields
    if (!body.sessionSummary || !body.actualReframedBelief || !body.actualLegacyStatement || !body.topEmotions || !body.circumstance || !body.sessionDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const reflection = await generateSessionReflection(body);
    
    return NextResponse.json(reflection);
  } catch (error) {
    console.error('Error generating session reflection:', error);
    return NextResponse.json(
      { error: 'Failed to generate session reflection' },
      { status: 500 }
    );
  }
}
