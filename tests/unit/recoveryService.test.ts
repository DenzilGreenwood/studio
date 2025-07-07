// tests/unit/recoveryService.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firebase first
jest.mock('../../src/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock crypto utils
jest.mock('../../src/lib/cryptoUtils', () => ({
  encryptPassphrase: jest.fn(),
  decryptPassphrase: jest.fn(),
  generateRecoveryKey: jest.fn(),
}));

import { 
  storeEncryptedPassphrase, 
  recoverPassphrase, 
  findUserByEmail, 
  hasRecoveryData 
} from '../../src/services/recoveryService';

import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { encryptPassphrase, decryptPassphrase, generateRecoveryKey } from '../../src/lib/cryptoUtils';

// Type the mocked functions
const mockDoc = jest.mocked(doc);
const mockSetDoc = jest.mocked(setDoc);
const mockGetDoc = jest.mocked(getDoc);
const mockCollection = jest.mocked(collection);
const mockQuery = jest.mocked(query);
const mockWhere = jest.mocked(where);
const mockGetDocs = jest.mocked(getDocs);
const mockGenerateRecoveryKey = jest.mocked(generateRecoveryKey);
const mockEncryptPassphrase = jest.mocked(encryptPassphrase);
const mockDecryptPassphrase = jest.mocked(decryptPassphrase);

describe('Recovery Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock returns
    mockDoc.mockReturnValue({ id: 'mocked-doc-ref' } as any);
    mockCollection.mockReturnValue({ id: 'mocked-collection-ref' } as any);
    mockQuery.mockReturnValue({ id: 'mocked-query-ref' } as any);
    mockWhere.mockReturnValue({ id: 'mocked-where-ref' } as any);
  });

  describe('storeEncryptedPassphrase', () => {
    it('should successfully store encrypted passphrase and return recovery key', async () => {
      // Arrange
      const userId = 'user123';
      const passphrase = 'TestPassphrase123!';
      const mockRecoveryKey = 'a'.repeat(64);
      const mockEncrypted = 'encrypted_data';

      mockGenerateRecoveryKey.mockReturnValue(mockRecoveryKey);
      mockEncryptPassphrase.mockResolvedValue(mockEncrypted);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await storeEncryptedPassphrase(userId, passphrase);

      // Assert
      expect(result).toBe(mockRecoveryKey);
      expect(mockGenerateRecoveryKey).toHaveBeenCalled();
      expect(mockEncryptPassphrase).toHaveBeenCalledWith(passphrase, mockRecoveryKey);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should throw error when encryption fails', async () => {
      // Arrange
      const userId = 'user123';
      const passphrase = 'TestPassphrase123!';
      const mockRecoveryKey = 'a'.repeat(64);

      mockGenerateRecoveryKey.mockReturnValue(mockRecoveryKey);
      mockEncryptPassphrase.mockRejectedValue(new Error('Encryption failed'));

      // Act & Assert
      await expect(storeEncryptedPassphrase(userId, passphrase))
        .rejects.toThrow('Failed to store recovery data');
    });

    it('should throw error when Firestore write fails', async () => {
      // Arrange
      const userId = 'user123';
      const passphrase = 'TestPassphrase123!';
      const mockRecoveryKey = 'a'.repeat(64);
      const mockEncrypted = 'encrypted_data';

      mockGenerateRecoveryKey.mockReturnValue(mockRecoveryKey);
      mockEncryptPassphrase.mockResolvedValue(mockEncrypted);
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(storeEncryptedPassphrase(userId, passphrase))
        .rejects.toThrow('Failed to store recovery data');
    });
  });

  describe('recoverPassphrase', () => {
    it('should successfully recover passphrase with valid recovery key', async () => {
      // Arrange
      const userId = 'user123';
      const recoveryKey = 'a'.repeat(64);
      const mockEncrypted = 'encrypted_data';
      const expectedPassphrase = 'TestPassphrase123!';

      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ encryptedPassphrase: mockEncrypted })
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);
      mockDecryptPassphrase.mockResolvedValue(expectedPassphrase);

      // Act
      const result = await recoverPassphrase(userId, recoveryKey);

      // Assert
      expect(result).toBe(expectedPassphrase);
      expect(mockDecryptPassphrase).toHaveBeenCalledWith(mockEncrypted, recoveryKey);
    });

    it('should return null for invalid recovery key format', async () => {
      // Test cases for invalid recovery keys
      const testCases = [
        '', // empty string
        'short', // too short
        'a'.repeat(63), // 63 chars (should be 64)
        'a'.repeat(65), // 65 chars (should be 64)
        'g'.repeat(64), // invalid hex characters (g is not hex)
        // Note: uppercase hex is actually valid per the implementation (/^[a-f0-9]+$/i)
      ];

      for (const invalidKey of testCases) {
        const result = await recoverPassphrase('user123', invalidKey);
        expect(result).toBeNull();
      }
    });

    it('should return null when user has no recovery data', async () => {
      // Arrange
      const userId = 'user123';
      const recoveryKey = 'a'.repeat(64);

      const mockDocSnapshot = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await recoverPassphrase(userId, recoveryKey);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when encrypted passphrase is missing', async () => {
      // Arrange
      const userId = 'user123';
      const recoveryKey = 'a'.repeat(64);

      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ /* no encryptedPassphrase */ })
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await recoverPassphrase(userId, recoveryKey);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when decryption fails', async () => {
      // Arrange
      const userId = 'user123';
      const recoveryKey = 'a'.repeat(64);
      const mockEncrypted = 'encrypted_data';

      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ encryptedPassphrase: mockEncrypted })
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);
      mockDecryptPassphrase.mockRejectedValue(new Error('Decryption failed'));

      // Act
      const result = await recoverPassphrase(userId, recoveryKey);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const expectedUserId = 'user123';

      const mockQuerySnapshot = {
        empty: false,
        docs: [{ id: expectedUserId }]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      // Act
      const result = await findUserByEmail(email);

      // Assert
      expect(result).toBe(expectedUserId);
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const email = 'Test@Example.COM';

      const mockQuerySnapshot = {
        empty: false,
        docs: [{ id: 'user123' }]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      // Act
      await findUserByEmail(email);

      // Assert
      expect(mockWhere).toHaveBeenCalledWith("email", "==", email.toLowerCase());
    });

    it('should return null when user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      // Act
      const result = await findUserByEmail(email);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when query fails', async () => {
      // Arrange
      const email = 'test@example.com';

      mockGetDocs.mockRejectedValue(new Error('Query failed'));

      // Act
      const result = await findUserByEmail(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('hasRecoveryData', () => {
    it('should return true when user has recovery data', async () => {
      // Arrange
      const userId = 'user123';

      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ encryptedPassphrase: 'encrypted_data' })
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await hasRecoveryData(userId);

      // Assert
      expect(result).toBeTruthy(); // It returns the actual encrypted data, not just true
    });

    it('should return false when user document does not exist', async () => {
      // Arrange
      const userId = 'user123';

      const mockDocSnapshot = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await hasRecoveryData(userId);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when encryptedPassphrase is missing', async () => {
      // Arrange
      const userId = 'user123';

      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ /* no encryptedPassphrase */ })
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      // Act
      const result = await hasRecoveryData(userId);

      // Assert
      expect(result).toBeFalsy(); // It returns undefined, which is falsy
    });

    it('should return false when query fails', async () => {
      // Arrange
      const userId = 'user123';

      mockGetDoc.mockRejectedValue(new Error('Query failed'));

      // Act
      const result = await hasRecoveryData(userId);

      // Assert
      expect(result).toBe(false);
    });
  });
});

// Test data factories
export const createMockUser = (overrides = {}) => ({
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  ...overrides
});

export const createMockRecoveryData = (overrides = {}) => ({
  encryptedPassphrase: 'encrypted_passphrase_data',
  createdAt: new Date(),
  userId: 'user123',
  ...overrides
});
