// src/services/emailService.ts
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Check for environment variables
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };

      // Validate configuration
      if (!config.host || !config.auth.user || !config.auth.pass) {
        console.warn('Email service not configured: Missing SMTP environment variables');
        return;
      }

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service is not properly configured');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });

      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPassphraseRecoveryEmail(userEmail: string, recoveredPassphrase: string): Promise<boolean> {
    const subject = 'CognitiveInsight - Your Recovered Passphrase';
    
    const text = `
Dear CognitiveInsight User,

Your passphrase has been successfully recovered using your recovery key.

Your Passphrase: ${recoveredPassphrase}

IMPORTANT SECURITY REMINDERS:
- Store this passphrase securely
- Do not share it with anyone
- This passphrase encrypts all your personal data
- Consider updating your passphrase after login if you suspect it may have been compromised

For your security, this email will be automatically deleted from our servers.

If you did not request this recovery, please contact our support team immediately.

Best regards,
The CognitiveInsight Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CognitiveInsight - Passphrase Recovery</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .passphrase { background: #fff; border: 2px solid #4f46e5; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 16px; text-align: center; margin: 20px 0; word-break: break-all; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 CognitiveInsight</h1>
            <h2>Passphrase Recovery</h2>
        </div>
        
        <div class="content">
            <p>Dear CognitiveInsight User,</p>
            
            <p>Your passphrase has been successfully recovered using your recovery key.</p>
            
            <div class="passphrase">
                <strong>Your Passphrase:</strong><br>
                ${recoveredPassphrase}
            </div>
            
            <div class="warning">
                <h3>🔒 IMPORTANT SECURITY REMINDERS:</h3>
                <ul>
                    <li>Store this passphrase securely</li>
                    <li>Do not share it with anyone</li>
                    <li>This passphrase encrypts all your personal data</li>
                    <li>Consider updating your passphrase after login if you suspect it may have been compromised</li>
                </ul>
            </div>
            
            <p>For your security, this email will be automatically deleted from our servers.</p>
            
            <p><strong>If you did not request this recovery, please contact our support team immediately.</strong></p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The CognitiveInsight Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
