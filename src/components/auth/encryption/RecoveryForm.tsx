'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface RecoveryFormData {
  recoveryKey: string;
}

interface RecoveryFormProps {
  onRecoverySubmit: (recoveryKey: string) => void;
  isLoading: boolean;
}

export default function RecoveryForm({ onRecoverySubmit, isLoading }: RecoveryFormProps) {
  const [showRecoveryKey, setShowRecoveryKey] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RecoveryFormData>();

  const onSubmit = (data: RecoveryFormData) => {
    onRecoverySubmit(data.recoveryKey);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Data Recovery</h3>
        <p className="text-sm text-gray-600 mt-2">
          Enter your recovery key to restore access to your encrypted data.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="recoveryKey" className="text-sm font-medium">
            Recovery Key
          </label>
          <div className="relative">
            <input
              id="recoveryKey"
              type={showRecoveryKey ? 'text' : 'password'}
              {...register('recoveryKey', {
                required: 'Recovery key is required',
                minLength: {
                  value: 32,
                  message: 'Recovery key must be at least 32 characters'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 font-mono text-sm"
              placeholder="Enter your recovery key"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowRecoveryKey(!showRecoveryKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showRecoveryKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.recoveryKey && (
            <p className="text-sm text-red-600">{errors.recoveryKey.message}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your recovery key is case-sensitive and should be exactly as you saved it.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Recovering data...' : 'Recover Data'}
        </button>
      </form>
    </div>
  );
}
