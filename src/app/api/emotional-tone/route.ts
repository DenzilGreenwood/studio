// src/app/api/emotional-tone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmotionalTone } from '@/ai/flows/emotional-tone-analyzer';
import type { EmotionalToneInput } from '@/ai/flows/emotional-tone-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body: EmotionalToneInput = await request.json();
    
    // Validate required fields
    if (!body.userMessage) {
      return NextResponse.json(
        { error: 'Missing required field: userMessage' },
        { status: 400 }
      );
    }

    const result = await analyzeEmotionalTone(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing emotional tone:', error);
    return NextResponse.json(
      { error: 'Failed to analyze emotional tone' },
      { status: 500 }
    );
  }
}
