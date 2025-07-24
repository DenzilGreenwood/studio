# Authentication Component Architecture

This directory contains a refactored authentication system that provides clear separation of concerns between authentication and encryption.

## Structure

### `/authentication/`
Components responsible for Firebase authentication (login/signup):
- `LoginForm.tsx` - Handles user login with email/password
- `SignupForm.tsx` - Handles user registration with email/password/name

### `/encryption/`
Components responsible for client-side encryption:
- `PassphraseForm.tsx` - Creates or enters encryption passphrase
- `RecoveryKeyDisplay.tsx` - Shows and manages recovery key saving
- `RecoveryForm.tsx` - Handles data recovery using recovery key

### `/authComponents/`
Legacy components from the original monolithic approach (maintained for compatibility):
- Various field components (EmailField, PasswordField, etc.)
- AuthFormLogic hook
- Form action components

## Main Components

### `AuthFlow.tsx`
The main orchestrator component that manages the complete authentication flow:
1. **Choice Phase**: User selects login or signup
2. **Authentication Phase**: Firebase authentication (login/signup)
3. **Encryption Phase**: Passphrase setup or entry
4. **Recovery Key Phase**: Key display for new users

### `auth-form.tsx`
The simplified main component that wraps AuthFlow and handles navigation after authentication completion.

## Usage

```tsx
import { AuthForm } from '@/components/auth/auth-form';

// For login page
<AuthForm mode="login" />

// For signup page  
<AuthForm mode="signup" />

// For automatic flow detection
<AuthForm />
```

## Flow Logic

### New User Signup:
1. Choose "Create Account"
2. Fill signup form (name, email, password, confirm password)
3. Firebase account creation + profile update
4. Create encryption passphrase
5. Display and save recovery key
6. Redirect to `/profile`

### Existing User Login:
1. Choose "Sign In" 
2. Fill login form (email, password)
3. Firebase authentication
4. Enter encryption passphrase
5. Redirect to `/protocol`

## Key Features

- **Type Safety**: Full TypeScript support with proper Firebase User types
- **Error Handling**: Comprehensive error handling with toast notifications
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Security**: Password visibility toggles, secure recovery key handling
- **Responsive**: Mobile-first design with Tailwind CSS
- **Separation of Concerns**: Clear boundaries between auth and encryption

## Firestore Integration

### Complete Authentication Flow
Our refactored authentication system maintains **full Firestore integration** with these key operations:

#### New User Signup Flow:
1. **User Limit Check** - `canCreateNewUser()` validates registration availability
2. **Firebase Authentication** - `createUserWithEmailAndPassword()` creates auth account  
3. **Profile Update** - `updateProfile()` sets display name
4. **Passphrase Validation** - `validatePassphrase()` ensures strong encryption passphrase
5. **Encrypted Passphrase Storage** - `storeEncryptedPassphrase()` creates recovery system
6. **Data Service Initialization** - `initializeDataService()` sets up encryption context
7. **User Profile Creation** - `createUserProfileDocument()` creates Firestore user document
8. **User Count Increment** - `incrementUserCount()` updates system metrics

#### Existing User Login Flow:
1. **Firebase Authentication** - `signInWithEmailAndPassword()` validates credentials
2. **Passphrase Entry** - User provides encryption passphrase
3. **Data Service Initialization** - `initializeDataService()` unlocks encrypted data
4. **Profile Refresh** - `refreshUserProfile()` loads decrypted user data

#### Firestore Documents Created/Updated:
- **`users/{uid}`** - Encrypted user profile with metadata
- **`recovery/{uid}`** - Encrypted passphrase recovery data  
- **`system/stats`** - User count and system metrics

#### Zero-Knowledge Encryption:
- ✅ **Passphrase Encryption** - User passphrases encrypted with recovery keys
- ✅ **Profile Encryption** - All sensitive user data encrypted client-side
- ✅ **Email Preservation** - Email remains unencrypted for authentication
- ✅ **Recovery System** - Secure recovery key generation and storage
