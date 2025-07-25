// lib/cryptoUtils.ts - DEPRECATED: Use encryption.ts instead
// This file is kept for backward compatibility only
// All new code should use encryption.ts with metadata format

import { 
  generateRecoveryKey as newGenerateRecoveryKey,
  encryptDataWithMetadata,
  decryptDataWithMetadata
} from './encryption';

// Re-export the new functions for compatibility
export const generateRecoveryKey = newGenerateRecoveryKey;

// Updated to use metadata format for all operations
export async function encryptData(data: unknown, passphrase: string): Promise<string> {
  return await encryptDataWithMetadata(JSON.stringify(data), passphrase);
}

export async function decryptData(ciphertext: string, passphrase: string): Promise<unknown> {
  const decryptedString = await decryptDataWithMetadata(ciphertext, passphrase);
  return JSON.parse(decryptedString);
}

// Backup Passphrase (encrypted with recovery key) - now uses metadata format
export async function encryptPassphrase(passphrase: string, recoveryKey: string): Promise<string> {
  return await encryptDataWithMetadata(passphrase, recoveryKey);
}

export async function decryptPassphrase(encryptedPassphrase: string, recoveryKey: string): Promise<string> {
  return await decryptDataWithMetadata(encryptedPassphrase, recoveryKey);
}
