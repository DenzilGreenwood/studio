
// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminDb, admin } from '@/lib/firebase-admin';

// For fallback, store emails in memory if Firebase isn't available
const interestedEmails: { email: string; timestamp: string; }[] = [];

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
    // Debug: Check if Firebase credentials are available
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: 'Firebase configuration missing',
        debug: { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey }
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, type, data } = body;

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields: email and type' }, { status: 400 });
    }

    // Handle 'interest-notification' by trying Firebase first, fallback to memory
    if (type === 'interest-notification') {
      if (!data || !data.email) {
        return NextResponse.json({ error: 'Missing email for interest notification' }, { status: 400 });
      }

      try {
        if (adminDb) {
          // Store email in Firestore
          const docRef = await adminDb.collection('interested_users').add({
            email: data.email,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          });
          
          return NextResponse.json({ 
            success: true, 
            message: 'Interest logged successfully in Firestore',
            docId: docRef.id,
            storage: 'firestore'
          });
        } else {
          // Fallback: Store email in memory
          interestedEmails.push({
            email: data.email,
            timestamp: new Date().toISOString(),
          });
          
          return NextResponse.json({ 
            success: true, 
            message: 'Interest logged successfully in memory (Firebase unavailable)',
            count: interestedEmails.length,
            storage: 'memory'
          });
        }
      } catch (firebaseError) {
        // If Firebase fails, try memory fallback
        // Log the error for debugging but don't expose it to client
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Firebase error, falling back to memory storage:', firebaseError);
        }
        
        interestedEmails.push({
          email: data.email,
          timestamp: new Date().toISOString(),
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Interest logged successfully (Firebase failed, using memory)',
          count: interestedEmails.length,
          storage: 'memory-fallback'
        });
      }
    }
    
    // Handle other email types
    const config = emailConfigs[type as keyof typeof emailConfigs];
    if (!config) {
      return NextResponse.json({ error: 'Invalid email type specified' }, { status: 400 });
    }

    // Validate environment variables for sending emails
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
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
    // Log error details for debugging in development only
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Error in API route:', error);
    }
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
