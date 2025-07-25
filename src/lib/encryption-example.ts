// Example Usage: New Encryption + Recovery System

// 1. During Signup
import { storeEncryptedPassphrase } from '@/services/recoveryService';
import { encryptForStorage } from '@/lib/encryption-context';
// import { useEncryption } from '@/lib/encryption-context'; // For React components

async function _handleSignup(userId: string, passphrase: string) {
  // Store encrypted passphrase and get recovery key
  const recoveryKey = await storeEncryptedPassphrase(userId, passphrase);
  
  // Show recovery key to user (they must save it securely)
  console.log("Your recovery key (store safely!):", recoveryKey);
  
  // Use encryption context to set passphrase (recommended)
  // const { setPassphrase } = useEncryption();
  // setPassphrase(passphrase);
  
  // OR store passphrase in session directly (if outside React component)
  // SECURITY: Always encrypt before storing in sessionStorage
  sessionStorage.setItem('userPassphrase', encryptForStorage(passphrase));
}

// 2. During Login
async function _handleLogin(passphrase: string) {
  // Recommended: Use encryption context
  // const { setPassphrase } = useEncryption();
  // setPassphrase(passphrase); // This also triggers profile refresh
  
  // OR store passphrase in session directly (if outside React component)
  // SECURITY: Always encrypt before storing in sessionStorage
  sessionStorage.setItem('userPassphrase', encryptForStorage(passphrase));
}

// 3. During Recovery
import { recoverPassphrase } from '@/services/recoveryService';

async function _handleRecovery(userId: string, recoveryKey: string) {
  const recoveredPassphrase = await recoverPassphrase(userId, recoveryKey);
  
  if (recoveredPassphrase) {
    console.log("Recovered passphrase:", recoveredPassphrase);
    
    // Recommended: Use encryption context
    // const { setPassphrase } = useEncryption();
    // setPassphrase(recoveredPassphrase);
    
    // OR store in session for immediate use
    // SECURITY: Always encrypt before storing in sessionStorage
    sessionStorage.setItem('userPassphrase', encryptForStorage(recoveredPassphrase));
  } else {
    console.log("Recovery failed - invalid recovery key");
  }
}

// 4. Encrypt/Decrypt Data
import { encryptData, decryptData } from '@/lib/cryptoUtils';

async function _encryptUserData(data: unknown) {
  const passphrase = sessionStorage.getItem('userPassphrase');
  if (!passphrase) throw new Error('No passphrase available');
  
  const encrypted = await encryptData(data, passphrase);
  return encrypted; // Returns base64 encoded string
}

async function _decryptUserData(encryptedData: string) {
  const passphrase = sessionStorage.getItem('userPassphrase');
  if (!passphrase) throw new Error('No passphrase available');
  
  const decrypted = await decryptData(encryptedData, passphrase);
  return decrypted; // Returns original data
}

// 5. React Component Examples
/*
// Example: Using encryption context in a React component
import { useEncryption } from '@/lib/encryption-context';
import { useAuth } from '@/context/auth-context-v2';

function LoginComponent() {
  const { setPassphrase } = useEncryption();
  const { refreshUserProfile } = useAuth();

  const handleLogin = async (passphrase: string) => {
    // This automatically triggers profile refresh
    setPassphrase(passphrase);
  };

  return (
    // Login form JSX
  );
}
*/

// 6. Data Encryption in Practice
/*
// Example: Using data encryption functions
import { encryptUserProfile, decryptUserProfile } from '@/lib/data-encryption';

async function saveUserProfile(profileData: UserProfile) {
  try {
    const encryptedProfile = await encryptUserProfile(profileData);
    // Save to Firestore
    await setDoc(doc(db, 'users', userId), encryptedProfile);
  } catch (error) {
    console.error('Failed to encrypt and save profile:', error);
  }
}

async function loadUserProfile(userId: string) {
  try {
    const encryptedProfile = await getDoc(doc(db, 'users', userId));
    const decryptedProfile = await decryptUserProfile(encryptedProfile.data());
    return decryptedProfile;
  } catch (error) {
    console.error('Failed to load and decrypt profile:', error);
    return null;
  }
}
*/

// 7. System Summary & Best Practices
/*
✅ Features Implemented:
- Client-side AES-GCM encryption with PBKDF2 key derivation
- Passphrase storage only in session (never sent to server)
- 64-character recovery key generation
- Passphrase backup encrypted with recovery key
- Recovery key stored in Firestore for account recovery
- Zero server-side access to user data
- Streamlined encryption format (base64 encoded)
- React context for passphrase management
- Automatic profile refresh when passphrase is set

🔐 Security Features:
- 100,000 PBKDF2 iterations for key derivation
- AES-GCM encryption with 256-bit keys
- Random salt and IV for each encryption (embedded in output)
- Recovery key generated with crypto.getRandomValues()
- Encrypted passphrase stored separately in Firestore
- Client-side only decryption (server never sees plaintext)
- Graceful error handling for missing passphrases
- Type-safe encryption functions

📋 Best Practices:
1. Use useEncryption() hook in React components
2. Use data-encryption.ts functions for specific data types
3. Always handle encryption errors gracefully
4. Never store passphrases server-side
5. Show users their recovery key during signup
6. Validate passphrase availability before operations
7. Use TypeScript for type safety
8. Test encryption/decryption flows thoroughly

🚨 Security Considerations:
- Recovery keys must be stored securely by users
- Passphrases are lost if sessionStorage is cleared
- Server cannot help with forgotten passphrases (by design)
- All encryption happens client-side only
- Recovery system provides backup without compromising security
*/
