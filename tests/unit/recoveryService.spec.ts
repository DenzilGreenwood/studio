// tests/unit/recoveryService.spec.ts
/**
 * Test file for Recovery Service
 * Run with: npm test tests/unit/recoveryService.spec.ts
 */

import {
  storeEncryptedPassphrase,
  recoverPassphrase,
  findUserByEmail,
  hasRecoveryData
} from '../../src/services/recoveryService';

// Mock the dependencies
jest.mock('../../src/lib/firebase');
jest.mock('../../src/lib/cryptoUtils');

describe('Recovery Service Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeEncryptedPassphrase function', () => {
    it('should store encrypted passphrase successfully', async () => {
      // Mock the crypto utils
      const mockCrypto = require('../../src/lib/cryptoUtils');
      const mockFirebase = require('../../src/lib/firebase');
      
      mockCrypto.generateRecoveryKey.mockReturnValue('a'.repeat(64));
      mockCrypto.encryptPassphrase.mockResolvedValue('encrypted_data');
      mockFirebase.setDoc.mockResolvedValue(undefined);

      const result = await storeEncryptedPassphrase('user123', 'TestPass123!');
      
      expect(result).toBe('a'.repeat(64));
      expect(mockCrypto.generateRecoveryKey).toHaveBeenCalled();
      expect(mockCrypto.encryptPassphrase).toHaveBeenCalledWith('TestPass123!', 'a'.repeat(64));
    });

    it('should handle encryption errors gracefully', async () => {
      const mockCrypto = require('../../src/lib/cryptoUtils');
      mockCrypto.encryptPassphrase.mockRejectedValue(new Error('Encryption failed'));

      await expect(storeEncryptedPassphrase('user123', 'TestPass123!'))
        .rejects.toThrow('Failed to store recovery data');
    });
  });

  describe('recoverPassphrase function', () => {
    it('should recover passphrase with valid recovery key', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      const mockCrypto = require('../../src/lib/cryptoUtils');
      
      mockFirebase.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ encryptedPassphrase: 'encrypted_data' })
      });
      mockCrypto.decryptPassphrase.mockResolvedValue('TestPass123!');

      const result = await recoverPassphrase('user123', 'a'.repeat(64));
      
      expect(result).toBe('TestPass123!');
    });

    it('should reject invalid recovery key formats', async () => {
      const invalidKeys = ['', 'short', 'g'.repeat(64), 'A'.repeat(64)];
      
      for (const key of invalidKeys) {
        const result = await recoverPassphrase('user123', key);
        expect(result).toBeNull();
      }
    });

    it('should return null for non-existent users', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDoc.mockResolvedValue({ exists: () => false });

      const result = await recoverPassphrase('nonexistent', 'a'.repeat(64));
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail function', () => {
    it('should find user by email', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'user123' }]
      });

      const result = await findUserByEmail('test@example.com');
      expect(result).toBe('user123');
    });

    it('should normalize email to lowercase', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'user123' }]
      });

      await findUserByEmail('TEST@EXAMPLE.COM');
      expect(mockFirebase.where).toHaveBeenCalledWith('email', '==', 'test@example.com');
    });

    it('should return null when user not found', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await findUserByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('hasRecoveryData function', () => {
    it('should return true when recovery data exists', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ encryptedPassphrase: 'encrypted_data' })
      });

      const result = await hasRecoveryData('user123');
      expect(result).toBe(true);
    });

    it('should return false when user has no recovery data', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDoc.mockResolvedValue({ exists: () => false });

      const result = await hasRecoveryData('user123');
      expect(result).toBe(false);
    });

    it('should return false when encryptedPassphrase is missing', async () => {
      const mockFirebase = require('../../src/lib/firebase');
      mockFirebase.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}) // No encryptedPassphrase field
      });

      const result = await hasRecoveryData('user123');
      expect(result).toBe(false);
    });
  });
});
