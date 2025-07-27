/**
 * Email Notification Function
 * Handles interest notifications and other email types
 */

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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

export const sendEmailFunction = onRequest({
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 30,
}, async (request, response) => {
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email, type, data } = request.body;

    if (!email || !type) {
      response.status(400).json({ error: 'Missing required fields: email and type' });
      return;
    }

    logger.info('Processing email request', { email, type });

    // Handle 'interest-notification' by storing in Firestore
    if (type === 'interest-notification') {
      if (!data || !data.email) {
        response.status(400).json({ error: 'Missing email for interest notification' });
        return;
      }

      try {
        // Store email in Firestore interested_users collection
        const docRef = await db.collection('interested_users').add({
          email: data.email,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown',
          userAgent: request.headers['user-agent'] || 'unknown',
          source: 'firebase-function',
        });
        
        logger.info('Interest notification stored successfully', { 
          email: data.email, 
          docId: docRef.id 
        });
        
        response.json({ 
          success: true, 
          message: 'Interest logged successfully in Firestore',
          docId: docRef.id 
        });
        return;
      } catch (error) {
        logger.error('Failed to store interest notification', error);
        response.status(500).json({ error: 'Failed to save to database' });
        return;
      }
    }
    
    // Handle other email types (like passphrase recovery)
    const config = emailConfigs[type as keyof typeof emailConfigs];
    if (!config) {
      response.status(400).json({ error: 'Invalid email type specified' });
      return;
    }

    // Check if SMTP is configured
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      logger.error('Email service not configured');
      response.status(503).json({ error: 'Email service is not configured on the server.' });
      return;
    }

    // Create transporter and send email
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
    
    logger.info('Email sent successfully', { email, type });
    response.json({ success: true, message: 'Email sent successfully' });
    
  } catch (error) {
    logger.error('Error in email function', error);
    response.status(500).json({ error: 'Failed to process request' });
  }
});
