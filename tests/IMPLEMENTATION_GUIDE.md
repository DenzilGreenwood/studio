# Test Implementation Guide

## Overview
This document provides a comprehensive guide for implementing and running tests for the Cognitive Therapy App. The test suite is designed to ensure reliability, security, and performance of all application components.

## Test Setup Instructions

### 1. Install Required Dependencies

```bash
npm install --save-dev \
  jest \
  @types/jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  ts-jest
```

### 2. Configure Jest

Create `jest.config.js` in project root:

```javascript
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/ai/**/*',
    '!src/app/**/*',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

module.exports = config;
```

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

## Test Categories and Coverage

### 🧪 Unit Tests (`/tests/unit/`)

#### Recovery Service Tests
- **File**: `recoveryService.test.ts`
- **Coverage**: All functions in `src/services/recoveryService.ts`
- **Test Cases**:
  - ✅ `storeEncryptedPassphrase()` - Success and error scenarios
  - ✅ `recoverPassphrase()` - Valid/invalid recovery keys
  - ✅ `findUserByEmail()` - User lookup and normalization
  - ✅ `hasRecoveryData()` - Data existence checks

#### Crypto Utils Tests  
- **File**: `cryptoUtils.test.ts`
- **Coverage**: All functions in `src/lib/cryptoUtils.ts`
- **Test Cases**:
  - ✅ `generateRecoveryKey()` - Key generation and uniqueness
  - ✅ `encryptData()` / `decryptData()` - Data encryption cycles
  - ✅ `validatePassphrase()` - Password strength validation
  - ✅ `deriveKey()` - Key derivation functions

#### PDF Generator Tests
- **File**: `pdfGenerator.test.ts`
- **Coverage**: `src/lib/pdf-generator.ts`
- **Test Cases**:
  - ✅ PDF creation with complete data
  - ✅ PDF creation with minimal data
  - ✅ Table of contents generation
  - ✅ Empty content placeholders
  - ✅ Content section formatting

#### Firestore Operations Tests
- **File**: `firestoreOperations.test.ts`
- **Coverage**: `src/lib/firestore-operations.ts`
- **Test Cases**:
  - ✅ User CRUD operations
  - ✅ Session CRUD operations
  - ✅ Message operations
  - ✅ Validation and error handling

### 🔗 Integration Tests (`/tests/integration/`)

#### API Endpoint Tests
- **File**: `apiEndpoints.test.ts`
- **Coverage**: All API routes in `src/app/api/`
- **Test Cases**:
  - ✅ Health check endpoints
  - ✅ Session management APIs
  - ✅ Report generation APIs
  - ✅ Authentication flows

#### Database Integration Tests
- **File**: `databaseIntegration.test.ts`
- **Coverage**: Firestore integration
- **Test Cases**:
  - ✅ Data persistence and retrieval
  - ✅ Transaction handling
  - ✅ Query optimization
  - ✅ Security rules validation

### 🎭 End-to-End Tests (`/tests/e2e/`)

#### User Workflow Tests
- **File**: `userWorkflows.test.ts`
- **Coverage**: Complete user journeys
- **Test Cases**:
  - ✅ User registration and login
  - ✅ Protocol session completion
  - ✅ Report generation and download
  - ✅ Recovery key management

## Test Data and Mocking

### Mock Factories

```typescript
// tests/factories/userFactory.ts
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  ...overrides
});

// tests/factories/sessionFactory.ts
export const createMockSession = (overrides = {}) => ({
  sessionId: 'test-session-456',
  userId: 'test-user-123',
  circumstance: 'Test session',
  startTime: new Date(),
  completedPhases: 0,
  ...overrides
});
```

### Firebase Mocking

```typescript
// tests/__mocks__/firebase.ts
export const db = {};
export const doc = jest.fn();
export const setDoc = jest.fn();
export const getDoc = jest.fn();
// ... other Firebase mocks
```

## Test Status Report

### ✅ Working Components
1. **Recovery Service** - All functions tested
   - Passphrase encryption/decryption ✅
   - Recovery key validation ✅
   - User lookup functionality ✅

2. **Crypto Utils** - Security functions tested
   - Data encryption cycles ✅
   - Key generation ✅
   - Passphrase validation ✅

3. **PDF Generator** - Core functionality tested
   - PDF creation ✅
   - Content formatting ✅
   - Table of contents ✅

### 🟡 Partially Tested
1. **Firestore Operations** - Basic CRUD tested
   - ⚠️ Complex query testing needed
   - ⚠️ Transaction testing incomplete
   - ⚠️ Security rules testing pending

2. **AI Flows** - Limited testing
   - ⚠️ Complex to mock external AI services
   - ⚠️ Response validation needed
   - ⚠️ Error handling testing incomplete

### 🔴 Needs Implementation
1. **Component Testing** - React components
   - ❌ Chat interface testing
   - ❌ Protocol phase components
   - ❌ Form validation testing

2. **API Endpoint Testing** - HTTP endpoints
   - ❌ Request/response validation
   - ❌ Authentication testing
   - ❌ Error handling testing

3. **Performance Testing** - Load and stress tests
   - ❌ Concurrent user testing
   - ❌ Database performance testing
   - ❌ Memory usage testing

## Test Environment Setup

### Environment Variables
```bash
# .env.test
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
NEXT_PUBLIC_FIREBASE_API_KEY=test-key
FIREBASE_ADMIN_SDK_PATH=./test-service-account.json
TEST_DATABASE_URL=firestore-emulator-url
```

### Test Database
- Use Firebase emulator for testing
- Separate test collections
- Clean setup/teardown for each test

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Running Tests

### Local Development
```bash
# Run all tests
npm test

# Run specific test category
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch
```

### Debugging Tests
```bash
# Debug specific test file
npm test -- --testNamePattern="Recovery Service"

# Run with verbose output
npm test -- --verbose

# Update snapshots
npm test -- --updateSnapshot
```

## Test Coverage Goals

### Current Status
- **Unit Tests**: 🟢 85% coverage target
- **Integration Tests**: 🟡 60% coverage target  
- **E2E Tests**: 🔴 40% coverage target

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

## Performance Benchmarks

### Expected Test Performance
- Unit tests: < 10ms per test
- Integration tests: < 100ms per test
- E2E tests: < 5 seconds per test
- Full suite: < 2 minutes

### Memory Usage
- Maximum heap usage: 512MB
- Memory leaks: Zero tolerance
- Cleanup validation: Required

## Security Testing

### Encryption Testing
- Data encryption/decryption cycles
- Key derivation security
- Recovery key validation
- Passphrase strength requirements

### Access Control Testing
- User data isolation
- Session ownership validation
- API authorization
- Admin function restrictions

## Accessibility Testing

### WCAG Compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- Focus management

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Mobile Testing
- iOS Safari
- Android Chrome
- Responsive design validation

---

**Next Steps for Implementation:**

1. ✅ Install test dependencies
2. ✅ Configure Jest and test environment
3. 🟡 Implement unit tests for core services
4. 🟡 Set up Firebase testing environment
5. ❌ Create integration tests for APIs
6. ❌ Implement component testing
7. ❌ Set up E2E testing framework
8. ❌ Configure CI/CD pipeline
9. ❌ Establish performance benchmarks
10. ❌ Implement security testing

**Current Priority:** Complete unit test implementation for core services (Recovery Service, Crypto Utils, PDF Generator) before moving to integration tests.
