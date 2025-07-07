# Email Service Setup and Recovery System

## Overview

The CognitiveInsight application now includes a secure email service for sending passphrase recovery emails when users use their recovery keys. This document outlines the setup and functionality.

## Security Features

### ✅ **Enhanced Login Requirements**
The login system now properly requires:

1. **Regular Login:**
   - Email address (required)
   - Password (required)
   - Security passphrase (required, validated for cryptographic strength)

2. **Recovery Mode:**
   - Email address (required)
   - Account password (required)
   - 64-character recovery key (required, hexadecimal format)
   - **NEW**: Email notification with recovered passphrase

### 🔒 **Security Improvements Made**

1. **Secure Email Delivery**: When a recovery key is used, the passphrase is sent to the user's email instead of being displayed in the UI
2. **No UI Exposure**: Recovered passphrases are no longer shown in browser alerts or UI components
3. **Email Validation**: All email addresses are validated before sending
4. **Service Availability**: Email service gracefully handles configuration issues

## Email Service Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@cognitiveinsight.com
```

### Gmail Setup Example

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
3. **Use App Password** as `SMTP_PASS` (not your regular password)

### Alternative SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## Recovery Process Flow

### 1. User Initiates Recovery
- User clicks "Forgot Passphrase? Use Recovery Key"
- Enters email, password, and 64-character recovery key

### 2. Server-Side Validation
- Validates recovery key format (64 hex characters)
- Checks if user exists and has recovery data
- Attempts to decrypt passphrase using recovery key

### 3. Email Notification
- If recovery successful, sends formatted email to user
- Email contains the recovered passphrase
- Email includes security reminders and warnings

### 4. User Authentication
- User is logged in automatically after successful recovery
- Passphrase is set in the encryption context
- User redirected to protocol page

## Email Template

The recovery email includes:

- **Professional formatting** with CognitiveInsight branding
- **Clear passphrase display** in monospace font
- **Security reminders** about passphrase protection
- **Warning about unauthorized access** attempts
- **Auto-deletion notice** for email security

## Error Handling

### Email Service Failures
- If email fails to send, user is still logged in
- Toast notification indicates email delivery status
- System logs errors for debugging (development only)

### Recovery Failures
- Clear error messages for different failure types:
  - Invalid recovery key format
  - User not found
  - No recovery data available
  - Authentication failures

## Security Considerations

### ✅ **Implemented Safeguards**
- Recovery keys are validated cryptographically
- Email service uses secure SMTP with authentication
- Passphrases are not logged or stored in plain text
- Email templates include security warnings
- Rate limiting through Firebase Auth

### ⚠️ **Ongoing Security Measures**
- Monitor email delivery for suspicious patterns
- Consider implementing email delivery confirmations
- Regular rotation of SMTP credentials
- Audit recovery attempts for security analysis

## API Endpoints

### POST `/api/send-email`
Handles email sending with validation:
- Validates email format and required fields
- Supports different email types (currently: passphrase-recovery)
- Returns success/failure status
- Gracefully handles service unavailability

## Testing the System

### 1. Test Email Configuration
1. Set up SMTP credentials in `.env.local`
2. Start the development server
3. Check console for "Email service initialized successfully"

### 2. Test Recovery Flow
1. Create a test account and note the recovery key
2. Log out and try recovery mode
3. Enter recovery key and verify email delivery
4. Check that passphrase is not displayed in UI

### 3. Test Error Scenarios
1. Try invalid recovery keys
2. Test with wrong email addresses
3. Verify graceful handling of email service failures

## Future Enhancements

- Email delivery confirmations
- HTML email templates with improved styling
- Multi-language support for email content
- Integration with dedicated email service providers
- Enhanced monitoring and analytics
- Rate limiting for recovery attempts
