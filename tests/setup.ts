// tests/setup.ts
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder in Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextDecoder } = require('util');
  global.TextDecoder = TextDecoder;
}

// Mock crypto with proper implementation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
    subtle: {
      importKey: () => Promise.resolve({ type: 'secret' } as CryptoKey),
      deriveKey: () => Promise.resolve({ type: 'secret' } as CryptoKey),
      encrypt: () => Promise.resolve(new ArrayBuffer(16)),
      decrypt: () => Promise.resolve(new TextEncoder().encode('{"test":"data"}').buffer),
    }
  },
  writable: true
});

// Mock ResizeObserver - using Object.defineProperty to avoid type conflicts
Object.defineProperty(global, 'ResizeObserver', {
  value: class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  writable: true
});

// Mock IntersectionObserver - using Object.defineProperty to avoid type conflicts
Object.defineProperty(global, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  writable: true
});

// Setup test environment (suppressing linting for test setup)
/* eslint-disable no-console */
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific React warnings in tests
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: React.createFactory is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
/* eslint-enable no-console */
