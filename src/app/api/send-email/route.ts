
// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';

// Email types and their configurations
const emailConfigs = {
  'interest-confirmation': {
    subject: 'Welcome to CognitiveInsight - Thank You for Your Interest!',
    createBody: (data: { email?: string }) => `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🧠 CognitiveInsight</h1>
          <p style="color: #666; margin: 0;">Turn Confusion Into Clarity</p>
        </div>
        
        <h2 style="color: #333;">Thank You for Your Interest!</h2>
        
        <p>Hi there,</p>
        
        <p>Thank you for signing up to be notified about CognitiveInsight! We&apos;re excited to have you on board as we prepare to launch our AI-powered thought partner built on the Cognitive Edge Protocol™.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #2563eb;">What to Expect:</h3>
          <ul style="margin-bottom: 0;">
            <li>Updates on our development progress</li>
            <li>Early access opportunities</li>
            <li>Insights about the Cognitive Edge Protocol™</li>
            <li>Information about our zero-knowledge encryption framework</li>
          </ul>
        </div>
        
        <p>We&apos;re committed to building something truly meaningful - a platform that helps you navigate life&apos;s challenges with absolute privacy as the foundation, not just a feature.</p>
        
        <p>As we get closer to launch, we&apos;ll keep you updated on our progress. In the meantime, if you have any questions or feedback, feel free to reply to this email.</p>
        
        <p>Best regards,<br/>
        <strong>James Greenwood</strong><br/>
        Founder, CognitiveInsight<br/>
        <a href="mailto:founder@cognitiveinsight.ai" style="color: #2563eb;">founder@cognitiveinsight.ai</a></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;"/>
        
        <p style="font-size: 12px; color: #777; line-height: 1.4;">
          You&apos;re receiving this email because you signed up for notifications at CognitiveInsight. 
          Your email (${data.email || 'your email'}) has been added to our notification list.
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

      // Store the interest in Firestore
      const interestedUsersRef = collection(db, 'interested_users');
      await addDoc(interestedUsersRef, {
        email: data.email,
        submittedAt: serverTimestamp(),
      });

      // Check if SMTP is configured for sending confirmation email
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
      
      if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
        // If SMTP not configured, just return success for Firestore storage
        return NextResponse.json({ 
          success: true, 
          message: 'Interest logged successfully (confirmation email not sent - SMTP not configured)' 
        });
      }

      // Send confirmation email
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(SMTP_PORT, 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });

        const confirmationConfig = emailConfigs['interest-confirmation'];
        const mailOptions = {
          from: `CognitiveInsight <${SMTP_FROM}>`,
          to: data.email,
          subject: confirmationConfig.subject,
          html: confirmationConfig.createBody({ email: data.email }),
        };

        await transporter.sendMail(mailOptions);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Interest logged successfully and confirmation email sent!' 
        });
      } catch (emailError) {
        // If email fails, still return success since Firestore save worked
        // But provide more detailed error information
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown email error';
        return NextResponse.json({ 
          success: true, 
          message: 'Interest logged successfully (confirmation email failed to send)',
          emailError: errorMessage
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
