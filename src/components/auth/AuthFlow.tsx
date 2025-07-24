'use client';

import React from 'react';
import { User } from 'firebase/auth';
import { LoginForm, SignupForm } from './authentication';
import { PassphraseForm, RecoveryKeyDisplay } from './encryption';
import { createUserProfileDocument } from '@/context/auth-context';
import { storeEncryptedPassphrase } from '@/services/recoveryService';
import { canCreateNewUser, incrementUserCount } from '@/lib/user-limit';
import { useAuth } from '@/context/auth-context-v2';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'choice' | 'login' | 'signup' | 'passphrase' | 'recovery-key';
type AuthMode = 'login' | 'signup';

interface AuthFlowProps {
  onAuthComplete: (user: User, hasPassphrase: boolean) => void;
}

export default function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [currentStep, setCurrentStep] = React.useState<AuthStep>('choice');
  const [currentMode, setCurrentMode] = React.useState<AuthMode>('login');
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [recoveryKey, setRecoveryKey] = React.useState<string>('');
  const [, setCurrentPassphrase] = React.useState<string>('');
  
  const { initializeDataService } = useAuth();
  const { toast } = useToast();

  const handleAuthChoice = async (mode: AuthMode) => {
    if (mode === 'signup') {
      // Check user limit before allowing signup
      setIsLoading(true);
      try {
        const limitCheck = await canCreateNewUser();
        if (!limitCheck.allowed) {
          toast({
            variant: "destructive",
            title: "Registration Unavailable",
            description: limitCheck.message || "Registration is currently closed.",
          });
          return;
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Registration Check Failed",
          description: "Unable to verify registration availability. Please try again.",
        });
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    setCurrentMode(mode);
    setCurrentStep(mode);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // For login, we need to check if user has passphrase setup
    setCurrentStep('passphrase');
  };

  const handleSignupSuccess = (user: User) => {
    setCurrentUser(user);
    // For signup, we need to create new passphrase
    setCurrentStep('passphrase');
  };

  const handlePassphraseSubmit = async (passphrase: string) => {
    setIsLoading(true);
    setCurrentPassphrase(passphrase);
    
    try {
      if (currentMode === 'signup') {
        if (!currentUser) {
          throw new Error('No user available for signup completion');
        }

        // Check user limit before proceeding
        const limitCheck = await canCreateNewUser();
        if (!limitCheck.allowed) {
          toast({
            variant: "destructive",
            title: "Registration Unavailable",
            description: limitCheck.message || "Registration is currently closed.",
          });
          return;
        }

        // Store encrypted passphrase and get recovery key
        const newRecoveryKey = await storeEncryptedPassphrase(currentUser.uid, passphrase);
        setRecoveryKey(newRecoveryKey);

        // Initialize DataService with passphrase (needed for encryption)
        await initializeDataService(passphrase);

        // Create user profile document in Firestore
        await createUserProfileDocument(currentUser, {
          pseudonym: currentUser.displayName || ''
        });

        // Increment user count after successful account creation
        try {
          await incrementUserCount();
        } catch (countError) {
          // Don't fail signup for counter error
          toast({
            variant: "destructive", 
            title: "User Count Update Warning",
            description: `Your account was created, but we encountered an issue updating our user count. Please contact support if you notice any issues.${countError instanceof Error ? ` Error: ${countError.message}` : ""}`,
          });
        }

        setCurrentStep('recovery-key');
      } else {
        // For login, initialize data service and complete auth
        if (currentUser) {
          await initializeDataService(passphrase);
          onAuthComplete(currentUser, true);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process passphrase';
      toast({
        variant: "destructive",
        title: currentMode === 'signup' ? "Signup Failed" : "Login Failed", 
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryKeyConfirm = () => {
    if (currentUser) {
      onAuthComplete(currentUser, true);
    }
  };

  const goBack = () => {
    if (currentStep === 'login' || currentStep === 'signup') {
      setCurrentStep('choice');
    } else if (currentStep === 'passphrase') {
      setCurrentStep(currentMode);
    } else if (currentStep === 'recovery-key') {
      setCurrentStep('passphrase');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentStep === 'choice' && 'Welcome'}
          {currentStep === 'login' && 'Sign In'}
          {currentStep === 'signup' && 'Create Account'}
          {currentStep === 'passphrase' && 'Encryption Setup'}
          {currentStep === 'recovery-key' && 'Save Recovery Key'}
        </h2>
        <p className="text-gray-600 mt-2">
          {currentStep === 'choice' && 'Choose how you\'d like to continue'}
          {currentStep === 'login' && 'Welcome back! Please sign in to your account'}
          {currentStep === 'signup' && 'Create your account to get started'}
          {currentStep === 'passphrase' && currentMode === 'signup' && 'Secure your data with encryption'}
          {currentStep === 'passphrase' && currentMode === 'login' && 'Enter your passphrase to access your data'}
          {currentStep === 'recovery-key' && 'Important: Save your recovery key'}
        </p>
      </div>

      {/* Back button */}
      {currentStep !== 'choice' && (
        <button
          onClick={goBack}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      )}

      {/* Step content */}
      {currentStep === 'choice' && (
        <div className="space-y-4">
          <button
            onClick={() => handleAuthChoice('login')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
          <button
            onClick={() => handleAuthChoice('signup')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
          >
            Create Account
          </button>
        </div>
      )}

      {currentStep === 'login' && (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {currentStep === 'signup' && (
        <SignupForm
          onSignupSuccess={handleSignupSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {currentStep === 'passphrase' && (
        <PassphraseForm
          onPassphraseSubmit={handlePassphraseSubmit}
          isLoading={isLoading}
          mode={currentMode === 'signup' ? 'create' : 'enter'}
        />
      )}

      {currentStep === 'recovery-key' && (
        <RecoveryKeyDisplay
          recoveryKey={recoveryKey}
          onConfirm={handleRecoveryKeyConfirm}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
