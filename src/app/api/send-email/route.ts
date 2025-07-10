
// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';

// Email types and their configurations
const emailConfigs = {
  'passphrase-recovery': {
    subject: 'Your CognitiveInsight Passphrase Recovery',
    createBody: (data: { passphrase?: string }) => `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>CognitiveInsight Passphrase Recovery</h2>
        <p>Your passphrase has been successfully recovered. Please save it securely:</p>
        <p style="font-size: 18px; font-family: monospace; background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
          ${data.passphrase || 'No passphrase provided'}
        </p>
        <p>This email is for recovery purposes only. For security, we recommend you delete this email after saving your passphrase.</p>
        <hr/>
        <p style="font-size: 12px; color: #777;">
          If you did not request this recovery, please secure your account immediately.
        </p>
      </div>
    `,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { email, type, data } = await request.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields: email and type' }, { status: 400 });
    }

    // Handle 'interest-notification' by writing to Firestore
    if (type === 'interest-notification') {
      if (!data || !data.email) {
        return NextResponse.json({ error: 'Missing email for interest notification' }, { status: 400 });
      }

      const interestedUsersRef = collection(db, 'interested_users');
      await addDoc(interestedUsersRef, {
        email: data.email,
        submittedAt: serverTimestamp(),
      });
      
      return NextResponse.json({ success: true, message: 'Interest logged successfully' });
    }
    
    // Handle other email types
    const config = emailConfigs[type as keyof typeof emailConfigs];
    if (!config) {
      return NextResponse.json({ error: 'Invalid email type specified' }, { status: 400 });
    }

    // Validate environment variables for sending emails
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      console.error('Email service not configured. Please set SMTP variables in .env.local');
      return NextResponse.json({ error: 'Email service is not configured on the server.' }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `CognitiveInsight <${SMTP_FROM}>`,
      to: email,
      subject: config.subject,
      html: config.createBody(data || {}),
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
