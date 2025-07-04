// lib/cryptoUtils.ts
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function generateRecoveryKey(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 64);
}

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: unknown, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encoded = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const result = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);
  return btoa(String.fromCharCode(...result));
}

export async function decryptData(ciphertext: string, passphrase: string): Promise<unknown> {
  const binary = atob(ciphertext).split("").map((c) => c.charCodeAt(0));
  const data = new Uint8Array(binary);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  return JSON.parse(decoder.decode(decrypted));
}

// Backup Passphrase (encrypted with recovery key)
export async function encryptPassphrase(passphrase: string, recoveryKey: string): Promise<string> {
  return await encryptData(passphrase, recoveryKey);
}

export async function decryptPassphrase(encryptedPassphrase: string, recoveryKey: string): Promise<string> {
  const result = await decryptData(encryptedPassphrase, recoveryKey);
  return result as string;
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
