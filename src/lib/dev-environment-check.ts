// src/lib/dev-environment-check.ts

/**
 * Development environment checker for Firebase Functions
 * Helps identify if emulators are running and provides helpful error messages
 */

export async function checkFirebaseEmulators(): Promise<{
  functionsRunning: boolean;
  firestoreRunning: boolean;
  authRunning: boolean;
  message: string;
}> {
  const results = {
    functionsRunning: false,
    firestoreRunning: false,
    authRunning: false,
    message: ''
  };

  try {
    // Check Functions emulator
    const functionsResponse = await fetch('http://localhost:5002', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    results.functionsRunning = functionsResponse.ok;
  } catch {
    results.functionsRunning = false;
  }

  try {
    // Check Firestore emulator
    const firestoreResponse = await fetch('http://localhost:8080', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    results.firestoreRunning = firestoreResponse.ok;
  } catch {
    results.firestoreRunning = false;
  }

  try {
    // Check Auth emulator
    const authResponse = await fetch('http://localhost:9099', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    results.authRunning = authResponse.ok;
  } catch {
    results.authRunning = false;
  }

  // Generate helpful message
  if (!results.functionsRunning && !results.firestoreRunning && !results.authRunning) {
    results.message = '🔴 Firebase emulators are not running. Start them with: npm run emulators';
  } else if (!results.functionsRunning) {
    results.message = '🟡 Functions emulator is not running. Some features may not work.';
  } else if (results.functionsRunning && results.firestoreRunning && results.authRunning) {
    results.message = '🟢 All Firebase emulators are running correctly.';
  } else {
    results.message = '🟡 Some Firebase emulators are running, but not all.';
  }

  return results;
}

export function showEmulatorStatus() {
  if (process.env.NODE_ENV === 'development') {
    checkFirebaseEmulators().then(status => {
      // eslint-disable-next-line no-console
      console.log('Firebase Emulator Status:', status.message);
      if (!status.functionsRunning) {
        // eslint-disable-next-line no-console
        console.log('💡 To start emulators: npm run emulators');
        // eslint-disable-next-line no-console
        console.log('💡 To start with UI: npm run emulators:ui');
      }
    });
  }
}
