// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  input: {
    markup: string;
  };
  voice: {
    languageCode: string;
    name: string;
    voiceClone?: {};
  };
  audioConfig: {
    audioEncoding: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();

    // Get the access token - you'll need to set this up
    // For now, we'll use a simpler approach with API key
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Cloud TTS API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to synthesize speech' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('TTS API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
