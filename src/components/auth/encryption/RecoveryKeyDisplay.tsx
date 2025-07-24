'use client';

import React from 'react';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';

interface RecoveryKeyDisplayProps {
  recoveryKey: string;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function RecoveryKeyDisplay({ recoveryKey, onConfirm, isLoading }: RecoveryKeyDisplayProps) {
  const [showKey, setShowKey] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = recoveryKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const downloadKey = () => {
    const blob = new Blob([recoveryKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    onConfirm();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Your Recovery Key</h3>
        <p className="text-sm text-gray-600 mt-2">
          Save this key safely. You&apos;ll need it to recover your data if you forget your passphrase.
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ Critical Security Information</h4>
        <ul className="text-xs text-red-700 space-y-1">
          <li>• This recovery key can decrypt all your data</li>
          <li>• Store it in a secure location (password manager, safe, etc.)</li>
          <li>• Never share it with anyone</li>
          <li>• You cannot generate a new one later</li>
        </ul>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Recovery Key:</label>
        <div className="relative">
          <div className="bg-gray-50 border border-gray-300 rounded-md p-3 font-mono text-sm break-all">
            {showKey ? recoveryKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
          </div>
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Copy size={14} />
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={downloadKey}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">
            I have safely stored my recovery key and understand I cannot recover it later
          </span>
        </label>

        <button
          onClick={handleConfirm}
          disabled={!isConfirmed || isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Setting up encryption...' : 'Continue to Application'}
        </button>
      </div>
    </div>
  );
}
