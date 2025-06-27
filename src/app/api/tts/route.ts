// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  input: {
    text: string;  // Changed from 'markup' to 'text' as per Google TTS API
  };
  voice: {
    languageCode: string;
    name: string;
  };
  audioConfig: {
    audioEncoding: string;
    speakingRate?: number;
    pitch?: number;
  };
}

// Function to get Google Cloud access token
async function getAccessToken(): Promise<string> {
  try {
    // Try to get access token using Google Cloud metadata service (works in Google Cloud environments)
    const metadataResponse = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      {
        headers: {
          'Metadata-Flavor': 'Google',
        },
      }
    );
    
    if (metadataResponse.ok) {
      const tokenData = await metadataResponse.json();
      return tokenData.access_token;
    }
  } catch (error) {
    console.log('Metadata service not available, trying environment variables...');
  }

  // Fallback to API key from environment variables
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return apiKey;
  }

  throw new Error('No authentication method available for Google Cloud TTS');
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();

    // Validate request body
    if (!body.input?.text) {
      console.error('Missing or invalid input text:', body);
      return NextResponse.json(
        { error: 'Missing input text' },
        { status: 400 }
      );
    }

    if (!body.voice?.languageCode || !body.voice?.name) {
      console.error('Missing or invalid voice configuration:', body.voice);
      return NextResponse.json(
        { error: 'Missing voice configuration' },
        { status: 400 }
      );
    }

    if (!body.audioConfig?.audioEncoding) {
      console.error('Missing audio encoding:', body.audioConfig);
      return NextResponse.json(
        { error: 'Missing audio encoding' },
        { status: 400 }
      );
    }

    console.log('TTS request:', {
      textLength: body.input.text.length,
      voice: body.voice,
      audioConfig: body.audioConfig
    });

    // Get authentication
    let authHeader: string;
    let url: string;
    
    try {
      const token = await getAccessToken();
      
      // Check if it's an API key or access token
      if (token.startsWith('ya29.') || token.startsWith('1//')) {
        // This is an OAuth2 access token
        authHeader = `Bearer ${token}`;
        url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
      } else {
        // This is an API key
        authHeader = '';
        url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${token}`;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Google Cloud TTS authentication failed' },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        requestBody: JSON.stringify(body, null, 2),
        url,
        headers: Object.keys(headers)
      });
      return NextResponse.json(
        { error: 'Failed to synthesize speech', details: errorText },
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
