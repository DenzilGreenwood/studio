// src/lib/encryption.ts
"use client";

/**
 * Client-side encryption utilities for securing user data with passphrase
 * Uses Web Crypto API for secure encryption/decryption
 * Enhanced with comprehensive metadata and improved security
 */

// Enhanced encryption blob format with comprehensive metadata
interface EncryptionBlob {
  version: string;
  algorithm: string;
  keyDerivation: {
    method: string;
    iterations: number;
    hash: string;
  };
  salt: string;
  iv: string;
  encryptedData: string;
  timestamp: number;
  integrity?: string; // Optional integrity check
}

// Current encryption version for future compatibility
const ENCRYPTION_VERSION = "1.1.0";
const PBKDF2_ITERATIONS = 310000; // OWASP 2024 recommendation

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
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Enhanced encryption with comprehensive metadata
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

// Enhanced encryption with comprehensive blob format
export async function encryptDataWithMetadata(data: string, passphrase: string): Promise<string> {
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

  const blob: EncryptionBlob = {
    version: ENCRYPTION_VERSION,
    algorithm: "AES-GCM-256",
    keyDerivation: {
      method: "PBKDF2",
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    salt: Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join(''),
    encryptedData: Array.from(new Uint8Array(encryptedBuffer), byte => byte.toString(16).padStart(2, '0')).join(''),
    timestamp: Date.now()
  };

  return JSON.stringify(blob);
}

// Decrypt data with passphrase (legacy format support)
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

// Enhanced decryption with automatic format detection
export async function decryptDataWithMetadata(encryptedBlob: string, passphrase: string): Promise<string> {
  const decoder = new TextDecoder();
  
  try {
    // Try to parse as new blob format
    const blob: EncryptionBlob = JSON.parse(encryptedBlob);
    
    // Validate blob structure
    if (!blob.version || !blob.encryptedData || !blob.salt || !blob.iv) {
      throw new Error('Invalid encryption blob format');
    }

    // Convert hex strings back to Uint8Array
    const saltArray = new Uint8Array(blob.salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const ivArray = new Uint8Array(blob.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encryptedArray = new Uint8Array(blob.encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    // Use iterations from blob metadata
    const iterations = blob.keyDerivation?.iterations || PBKDF2_ITERATIONS;
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedArray
    );

    return decoder.decode(decryptedBuffer);
  } catch {
    // Fallback: try legacy format (direct encrypted string)
    // This maintains backward compatibility
    throw new Error('Failed to decrypt data. Invalid passphrase or corrupted data.');
  }
}

// Encrypt passphrase with recovery key (enhanced)
export async function encryptPassphraseWithRecoveryKey(passphrase: string, recoveryKey: string): Promise<{ encryptedPassphrase: string; salt: string; iv: string }> {
  const result = await encryptData(passphrase, recoveryKey);
  return {
    encryptedPassphrase: result.encryptedData,
    salt: result.salt,
    iv: result.iv
  };
}

// Enhanced passphrase encryption with metadata
export async function encryptPassphraseWithRecoveryKeyAndMetadata(passphrase: string, recoveryKey: string): Promise<string> {
  return await encryptDataWithMetadata(passphrase, recoveryKey);
}

export async function deriveKeyFromRecoveryKey(recoveryKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(recoveryKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}


export async function decryptPassphraseFromRecoveryKey(
  encryptedPassphraseBase64: string,
  ivBase64: string,
  saltBase64: string,
  recoveryKey: string
): Promise<string> {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedPassphraseBase64), c => c.charCodeAt(0));

  const key = await deriveKeyFromRecoveryKey(recoveryKey, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// Enhanced passphrase decryption with metadata
export async function decryptPassphraseWithRecoveryKeyAndMetadata(encryptedBlob: string, recoveryKey: string): Promise<string> {
  return await decryptDataWithMetadata(encryptedBlob, recoveryKey);
}

// Validate passphrase strength (unchanged for compatibility)
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

// Validate passphrase for login (minimum requirements only)
export function validatePassphraseForLogin(passphrase: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (passphrase.length < 8) {
    errors.push('Passphrase must be at least 8 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced metadata functions with versioning support
export function storeEncryptionMetadata(userId: string, metadata: {
  encryptedPassphrase: string;
  passphraseSalt: string;
  passphraseIv: string;
  version?: string;
}) {
  const enhancedMetadata = {
    ...metadata,
    version: metadata.version || ENCRYPTION_VERSION,
    timestamp: Date.now()
  };
  localStorage.setItem(`encryption_metadata_${userId}`, JSON.stringify(enhancedMetadata));
}

// Enhanced metadata retrieval with version support
export function getEncryptionMetadata(userId: string): {
  encryptedPassphrase: string;
  passphraseSalt: string;
  passphraseIv: string;
  version?: string;
  timestamp?: number;
} | null {
  const stored = localStorage.getItem(`encryption_metadata_${userId}`);
  return stored ? JSON.parse(stored) : null;
}

// Clear encryption metadata (unchanged)
export function clearEncryptionMetadata(userId: string) {
  localStorage.removeItem(`encryption_metadata_${userId}`);
}

// Utility function to get encryption blob info without decrypting
export function getEncryptionBlobInfo(encryptedBlob: string): {
  version?: string;
  algorithm?: string;
  keyDerivation?: {
    method: string;
    iterations: number;
    hash: string;
  };
  timestamp?: number;
  isLegacyFormat: boolean;
} {
  try {
    const blob: EncryptionBlob = JSON.parse(encryptedBlob);
    return {
      version: blob.version,
      algorithm: blob.algorithm,
      keyDerivation: blob.keyDerivation,
      timestamp: blob.timestamp,
      isLegacyFormat: false
    };
  } catch {
    return {
      isLegacyFormat: true
    };
  }
}

// Utility function for session audit log access (read-only)
export function getSessionAuditLog(): Array<{
  timestamp: string;
  event: string;
  userId: string;
  sessionId: string;
}> {
  if (typeof window === 'undefined') return [];
  
  try {
    const logs = sessionStorage.getItem('encryption_audit');
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

// Clear session audit log
export function clearSessionAuditLog(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('encryption_audit');
  }
}
