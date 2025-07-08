// src/lib/auth-constants.ts
"use client";

// Form field configurations
export const AUTH_FORM_CONFIG = {
  minPassphraseLength: 8,
  recoveryKeyLength: 64,
  maxPseudonymLength: 50,
  minPseudonymLength: 2,
} as const;

// Error messages
export const AUTH_ERRORS = {
  passphraseRequired: "Please enter your passphrase to login.",
  passphraseMinLength: "Passphrase must be at least 8 characters long.",
  recoveryKeyRequired: "Please enter your recovery key.",
  accountPasswordRequired: "Please enter your account password to complete recovery.",
  weakPassphrase: "Weak Passphrase",
  loginFailed: "Login Failed",
  signupFailed: "Signup Failed",
  recoveryFailed: "Recovery Failed",
  unexpectedError: "An unexpected error occurred. Please try again later.",
} as const;

// Success messages
export const AUTH_SUCCESS = {
  loginSuccessful: "Login Successful",
  redirecting: "Redirecting...",
  recoveryComplete: "🔐 Zero-Knowledge Recovery Successful",
  recoveryDescription: "Your passphrase has been recovered and is displayed below. Save it securely - it will not be sent via email.",
} as const;

// Field descriptions and labels
export const FIELD_DESCRIPTIONS = {
  passphrase: {
    title: "Security Passphrase",
    description: "This passphrase encrypts all your personal data:",
    features: [
      "Session content & AI conversations",
      "Journal entries & personal reflections", 
      "Goals, insights & feedback",
      "Profile details (name, challenges, etc.)"
    ],
    warning: "⚠️ Only you can decrypt this data - we cannot recover it without your passphrase."
  },
  recoveryKey: {
    title: "Recovery Key",
    description: "Enter the recovery key you saved during signup. This will decrypt your passphrase locally in your browser.",
    format: "Format: 64-character hexadecimal string (0-9, a-f)",
    note: "Zero-Knowledge: Decryption happens client-side only."
  }
} as const;
