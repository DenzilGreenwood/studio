// src/app/api/clarity-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateClaritySummary } from '@/ai/flows/clarity-summary-generator';
import type { ClaritySummaryInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ClaritySummaryInput = await request.json();
    
    // Validate required fields
    if (!body.reframedBelief || !body.legacyStatement || !body.topEmotions) {
      return NextResponse.json(
        { error: 'Missing required fields: reframedBelief, legacyStatement, topEmotions' },
        { status: 400 }
      );
    }

    const result = await generateClaritySummary(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating clarity summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate clarity summary' },
      { status: 500 }
    );
  }
}
