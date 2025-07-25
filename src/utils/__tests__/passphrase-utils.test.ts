import { getPassphraseStatus, canUserProceed } from '../passphrase-utils';

// Mock the data-encryption module
jest.mock('@/lib/data-encryption', () => ({
  getPassphraseSafely: jest.fn()
}));

import { getPassphraseSafely } from '@/lib/data-encryption';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('Passphrase Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPassphraseStatus', () => {
    it('should return isAvailable: false when no passphrase in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      (getPassphraseSafely as jest.Mock).mockReturnValue(null);
      
      const result = getPassphraseStatus();
      
      expect(result.isAvailable).toBe(false);
      expect(result.hasSessionStorage).toBe(false);
      expect(result.canDecrypt).toBe(false);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('userPassphrase');
    });

    it('should return isAvailable: true with canDecrypt: true when passphrase found', () => {
      const testPassphrase = 'test-passphrase-123';
      mockSessionStorage.getItem.mockReturnValue('encrypted-passphrase');
      (getPassphraseSafely as jest.Mock).mockReturnValue(testPassphrase);
      
      const result = getPassphraseStatus();
      
      expect(result.isAvailable).toBe(true);
      expect(result.canDecrypt).toBe(true);
      expect(result.hasSessionStorage).toBe(true);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('userPassphrase');
    });
  });

  describe('canUserProceed', () => {
    it('should return true when user has valid passphrase', () => {
      mockSessionStorage.getItem.mockReturnValue('encrypted-passphrase');
      (getPassphraseSafely as jest.Mock).mockReturnValue('valid-passphrase');
      
      const result = canUserProceed();
      
      expect(result).toBe(true);
    });

    it('should return false when user has no passphrase', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      const result = canUserProceed();
      
      expect(result).toBe(false);
    });
  });
});
