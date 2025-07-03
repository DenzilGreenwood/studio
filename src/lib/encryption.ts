// src/lib/encryption.ts
"use client";

/**
 * Client-side encryption utilities for securing user data with passphrase
 * Uses Web Crypto API for secure encryption/decryption
 */

// Generate a random recovery key
export function generateRecoveryKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate a salt for key derivation
function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

// Derive a key from passphrase using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with passphrase
export async function encryptData(data: string, passphrase: string): Promise<{ encryptedData: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  const salt = generateSalt();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const key = await deriveKey(passphrase, salt);
  const encodedData = encoder.encode(data);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );

  return {
    encryptedData: Array.from(new Uint8Array(encryptedBuffer), byte => byte.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join('')
  };
}

// Decrypt data with passphrase
export async function decryptData(encryptedData: string, passphrase: string, salt: string, iv: string): Promise<string> {
  const decoder = new TextDecoder();
  
  // Convert hex strings back to Uint8Array
  const saltArray = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const ivArray = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const encryptedArray = new Uint8Array(encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const key = await deriveKey(passphrase, saltArray);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedArray
    );

    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Failed to decrypt data. Invalid passphrase.');
  }
}

// Encrypt passphrase with recovery key
export async function encryptPassphraseWithRecoveryKey(passphrase: string, recoveryKey: string): Promise<{ encryptedPassphrase: string; salt: string; iv: string }> {
  const result = await encryptData(passphrase, recoveryKey);
  return {
    encryptedPassphrase: result.encryptedData,
    salt: result.salt,
    iv: result.iv
  };
}

// Decrypt passphrase with recovery key
export async function decryptPassphraseWithRecoveryKey(encryptedPassphrase: string, recoveryKey: string, salt: string, iv: string): Promise<string> {
  return decryptData(encryptedPassphrase, recoveryKey, salt, iv);
}

// Validate passphrase strength
export function validatePassphrase(passphrase: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (passphrase.length < 8) {
    errors.push('Passphrase must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Store encryption metadata in localStorage (for recovery)
export function storeEncryptionMetadata(userId: string, metadata: {
  encryptedPassphrase: string;
  passphraseSalt: string;
  passphraseIv: string;
}) {
  localStorage.setItem(`encryption_metadata_${userId}`, JSON.stringify(metadata));
}

// Retrieve encryption metadata from localStorage
export function getEncryptionMetadata(userId: string): {
  encryptedPassphrase: string;
  passphraseSalt: string;
  passphraseIv: string;
} | null {
  const stored = localStorage.getItem(`encryption_metadata_${userId}`);
  return stored ? JSON.parse(stored) : null;
}

// Clear encryption metadata
export function clearEncryptionMetadata(userId: string) {
  localStorage.removeItem(`encryption_metadata_${userId}`);
}
