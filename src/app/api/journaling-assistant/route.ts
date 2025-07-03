// src/app/api/journaling-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateJournalingResponse } from '@/ai/flows/journaling-assistant-flow';
import type { JournalingAssistantInput } from '@/ai/flows/journaling-assistant-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.sessionSummary || !body.userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionSummary and userMessage are required' },
        { status: 400 }
      );
    }

    const input: JournalingAssistantInput = {
      sessionSummary: body.sessionSummary,
      reframedBelief: body.reframedBelief || '',
      legacyStatement: body.legacyStatement || '',
      topEmotions: body.topEmotions || '',
      circumstance: body.circumstance || '',
      userMessage: body.userMessage,
      conversationHistory: body.conversationHistory || [],
      currentReflection: body.currentReflection,
      currentGoals: body.currentGoals,
      previousSessions: body.previousSessions
    };

    const response = await generateJournalingResponse(input);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in journaling assistant API:', error);
    
    // Return a supportive fallback response instead of an error
    return NextResponse.json({
      response: "I'm here to support your reflection. What would you like to explore about your session today?",
      suggestedQuestions: [
        "What was the most meaningful moment in your session?",
        "How are you feeling about the insights you gained?",
        "What would you like to focus on moving forward?"
      ],
      encouragement: "You've done important work today, and every step of reflection helps you grow."
    }, { status: 200 });
  }
}
