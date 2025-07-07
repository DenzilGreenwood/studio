// Jest global types
import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attribute: string, value?: string): R;
    }
  }
  
  const jest: typeof import('jest');
  const describe: typeof import('jest').describe;
  const it: typeof import('jest').it;
  const test: typeof import('jest').test;
  const expect: typeof import('jest').expect;
  const beforeAll: typeof import('jest').beforeAll;
  const afterAll: typeof import('jest').afterAll;
  const beforeEach: typeof import('jest').beforeEach;
  const afterEach: typeof import('jest').afterEach;
}
