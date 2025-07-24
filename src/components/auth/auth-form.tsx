'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import AuthFlow from './AuthFlow';

interface AuthFormProps {
  mode?: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const handleAuthComplete = (user: User, hasPassphrase: boolean) => {
    // Navigate based on the completion state
    if (hasPassphrase) {
      // User has completed full auth flow
      if (mode === 'signup') {
        // New user - redirect to profile setup
        router.push('/profile');
      } else {
        // Existing user - redirect to main app
        router.push('/protocol');
      }
    } else {
      // This shouldn't happen in our current flow, but handle it
      router.push('/profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <AuthFlow onAuthComplete={handleAuthComplete} />
      </div>
    </div>
  );
}

