// src/app/api/emotional-tone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmotionalTone } from '@/ai/flows/emotional-tone-analyzer';
import type { EmotionalToneInput } from '@/ai/flows/emotional-tone-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body: EmotionalToneInput = await request.json();
    
    // Validate required fields
    if (!body.userMessage || typeof body.userMessage !== 'string' || body.userMessage.trim() === '') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: userMessage' },
        { status: 400 }
      );
    }

    console.log('Processing emotional tone analysis for message:', body.userMessage.substring(0, 100) + '...');
    
    const result = await analyzeEmotionalTone(body);
    
    console.log('Emotional tone analysis result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing emotional tone:', error);
    
    // Return a fallback response instead of just an error
    const fallbackResponse = {
      primaryEmotion: 'neutral',
      intensity: 5,
      confidence: 0.3,
      progression: 'stable' as const,
      triggerWords: [],
    };
    
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
