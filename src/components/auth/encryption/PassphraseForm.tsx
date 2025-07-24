'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { validatePassphrase } from '@/lib/encryption';

interface PassphraseFormData {
  passphrase: string;
}

interface PassphraseFormProps {
  onPassphraseSubmit: (passphrase: string) => void;
  isLoading: boolean;
  mode: 'create' | 'enter';
}

export default function PassphraseForm({ onPassphraseSubmit, isLoading, mode }: PassphraseFormProps) {
  const [showPassphrase, setShowPassphrase] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<PassphraseFormData>();

  const onSubmit = (data: PassphraseFormData) => {
    if (mode === 'create') {
      // Validate passphrase strength for new passphrases
      const validation = validatePassphrase(data.passphrase);
      if (!validation.isValid) {
        // Set form errors for each validation failure
        validation.errors.forEach((error, index) => {
          setError('passphrase', { 
            type: 'validation',
            message: index === 0 ? error : `${errors.passphrase?.message}; ${error}`
          });
        });
        return;
      }
    }
    onPassphraseSubmit(data.passphrase);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {mode === 'create' ? 'Create Your Encryption Passphrase' : 'Enter Your Encryption Passphrase'}
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          {mode === 'create' 
            ? 'This passphrase will encrypt your data. Make it strong and memorable.' 
            : 'Enter your passphrase to decrypt your data.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="passphrase" className="text-sm font-medium">
            Encryption Passphrase
          </label>
          <div className="relative">
            <input
              id="passphrase"
              type={showPassphrase ? 'text' : 'password'}
              {...register('passphrase', {
                required: 'Passphrase is required',
                minLength: {
                  value: mode === 'create' ? 12 : 1,
                  message: mode === 'create' ? 'Passphrase must be at least 12 characters' : 'Passphrase is required'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder={mode === 'create' ? 'Create a strong passphrase' : 'Enter your passphrase'}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.passphrase && (
            <p className="text-sm text-red-600">{errors.passphrase.message}</p>
          )}
        </div>

        {mode === 'create' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Your passphrase cannot be recovered. Make sure to remember it or store it safely.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : mode === 'create' ? 'Set Passphrase' : 'Unlock Data'}
        </button>
      </form>
    </div>
  );
}
