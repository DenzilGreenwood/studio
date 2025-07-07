// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { type, email, data } = await request.json();

    // Validate request
    if (!type || !email || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, email, data' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email service is configured
    if (!emailService.isReady()) {
      console.error('Email service not configured - missing SMTP environment variables');
      return NextResponse.json(
        { error: 'Email service not available' },
        { status: 503 }
      );
    }

    let success = false;

    switch (type) {
      case 'passphrase-recovery':
        if (!data.passphrase) {
          return NextResponse.json(
            { error: 'Missing passphrase in data' },
            { status: 400 }
          );
        }
        success = await emailService.sendPassphraseRecoveryEmail(email, data.passphrase);
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown email type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
