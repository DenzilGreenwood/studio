/**
 * Crypto Service - AES-GCM Encryption, PBKDF2 Key Derivation, XOR Memory Protection
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Implements Zero-Knowledge Encryption Framework v1.1.2 compliant
 * client-side encryption for DataService integration.
 */

/**
 * Encrypted data structure following v1.1.2 specification
 */
export interface EncryptedData {
  encryptedData: string;
  metadata: {
    salt: string;
    iv: string;
    version: string;
  };
}

/**
 * Key derivation options
 */
export interface KeyDerivationOptions {
  iterations?: number;
  keyLength?: number;
  hashAlgorithm?: string;
}

/**
 * Default encryption parameters following v1.1.2 specification
 */
const DEFAULT_OPTIONS: Required<KeyDerivationOptions> = {
  iterations: 100000, // Minimum PBKDF2 iterations per white paper
  keyLength: 256,     // AES-256 key length
  hashAlgorithm: 'SHA-256'
};

/**
 * Current encryption version
 */
const ENCRYPTION_VERSION = '1.1.2';

/**
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string
 */
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive encryption key from passphrase using PBKDF2
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  options: KeyDerivationOptions = {}
): Promise<CryptoKey> {
  const { iterations, keyLength, hashAlgorithm } = { ...DEFAULT_OPTIONS, ...options };

  const passphraseBytes = stringToBytes(passphrase);
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: hashAlgorithm
    },
    importedKey,
    {
      name: 'AES-GCM',
      length: keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptContent<T>(
  data: T,
  key: CryptoKey
): Promise<EncryptedData> {
  try {
    // Convert data to JSON string then to bytes
    const plaintext = stringToBytes(JSON.stringify(data));
    
    // Generate random IV (12 bytes for AES-GCM)
    const iv = generateRandomBytes(12);
    
    // Generate random salt (32 bytes)
    const salt = generateRandomBytes(32);
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      plaintext
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    return {
      encryptedData: bytesToBase64(encryptedBytes),
      metadata: {
        salt: bytesToHex(salt),
        iv: bytesToHex(iv),
        version: ENCRYPTION_VERSION
      }
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptContent<T>(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<T> {
  try {
    // Validate version compatibility
    if (encryptedData.metadata.version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${encryptedData.metadata.version}`);
    }

    // Convert hex strings back to bytes
    const iv = hexToBytes(encryptedData.metadata.iv);
    const ciphertext = base64ToBytes(encryptedData.encryptedData);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      ciphertext
    );

    const decryptedBytes = new Uint8Array(decryptedBuffer);
    const decryptedString = bytesToString(decryptedBytes);
    
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a new encryption key for recovery purposes
 */
export async function generateRecoveryKey(): Promise<{
  key: CryptoKey;
  keyString: string;
}> {
  // Generate random key material (32 bytes for AES-256)
  const keyMaterial = generateRandomBytes(32);
  const keyString = bytesToHex(keyMaterial);

  // Import as CryptoKey
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );

  return { key, keyString };
}

/**
 * Import recovery key from string
 */
export async function importRecoveryKey(keyString: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyString);
  
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * XOR obfuscation for session storage protection
 */
export function xorObfuscate(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const dataChar = data.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(dataChar ^ keyChar);
  }
  return btoa(result);
}

/**
 * XOR deobfuscation for session storage protection
 */
export function xorDeobfuscate(obfuscatedData: string, key: string): string {
  const data = atob(obfuscatedData);
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const dataChar = data.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(dataChar ^ keyChar);
  }
  return result;
}

/**
 * Secure memory protection utilities
 */
export class SecureMemory {
  private static xorKey = generateRandomBytes(32);

  /**
   * Store sensitive data in sessionStorage with XOR protection
   */
  static store(key: string, data: string): void {
    const xorKeyString = bytesToHex(this.xorKey);
    const obfuscated = xorObfuscate(data, xorKeyString);
    sessionStorage.setItem(key, obfuscated);
  }

  /**
   * Retrieve sensitive data from sessionStorage with XOR protection
   */
  static retrieve(key: string): string | null {
    const obfuscated = sessionStorage.getItem(key);
    if (!obfuscated) return null;

    try {
      const xorKeyString = bytesToHex(this.xorKey);
      return xorDeobfuscate(obfuscated, xorKeyString);
    } catch {
      return null;
    }
  }

  /**
   * Clear sensitive data from sessionStorage
   */
  static clear(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all secure memory
   */
  static clearAll(): void {
    sessionStorage.clear();
    this.xorKey = generateRandomBytes(32);
  }
}

/**
 * Validate encryption metadata structure
 */
export function validateEncryptionMetadata(metadata: unknown): metadata is {
  salt: string;
  iv: string;
  version: string;
} {
  if (!metadata || typeof metadata !== 'object' || metadata === null) {
    return false;
  }

  const obj = metadata as Record<string, unknown>;
  
  return (
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.version === 'string' &&
    obj.version === ENCRYPTION_VERSION
  );
}

/**
 * Generate recovery blob for passphrase storage
 */
export async function createRecoveryBlob(
  passphrase: string,
  recoveryKey: CryptoKey
): Promise<{
  encryptedPassphrase: string;
  salt: string;
  iv: string;
  iterations: number;
  version: string;
}> {
  const encrypted = await encryptContent(passphrase, recoveryKey);
  const salt = generateRandomBytes(32);

  return {
    encryptedPassphrase: encrypted.encryptedData,
    salt: bytesToHex(salt),
    iv: encrypted.metadata.iv,
    iterations: DEFAULT_OPTIONS.iterations,
    version: ENCRYPTION_VERSION
  };
}

/**
 * Decrypt recovery blob to retrieve passphrase
 */
export async function decryptRecoveryBlob(
  recoveryBlob: {
    encryptedPassphrase: string;
    salt: string;
    iv: string;
    iterations: number;
    version: string;
  },
  recoveryKey: CryptoKey
): Promise<string> {
  const encryptedData: EncryptedData = {
    encryptedData: recoveryBlob.encryptedPassphrase,
    metadata: {
      salt: recoveryBlob.salt,
      iv: recoveryBlob.iv,
      version: recoveryBlob.version
    }
  };

  return await decryptContent<string>(encryptedData, recoveryKey);
}
