// src/app/api/sentiment-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis-flow';
import type { SentimentAnalysisInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SentimentAnalysisInput = await request.json();
    
    // Validate required fields
    if (!body.userMessages) {
      return NextResponse.json(
        { error: 'Missing required field: userMessages' },
        { status: 400 }
      );
    }

    const result = await analyzeSentiment(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
