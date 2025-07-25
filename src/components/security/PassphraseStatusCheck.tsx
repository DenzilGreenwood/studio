// src/components/security/PassphraseStatusCheck.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePassphraseCheck } from '@/hooks/usePassphraseCheck';
import { useAuth } from '@/context/auth-context-v2';

interface PassphraseStatusCheckProps {
  className?: string;
  showActions?: boolean;
  autoCheck?: boolean;
}

export function PassphraseStatusCheck({ 
  className = '', 
  showActions = true,
  autoCheck = false 
}: PassphraseStatusCheckProps) {
  const [mounted, setMounted] = React.useState(false);
  
  const { 
    checkWithToast, 
    checkDetailed, 
    getPassphraseStatus 
  } = usePassphraseCheck();
  
  const { 
    checkPassphrasesWithToast, 
    checkPassphrasesDetailed 
  } = useAuth();

  // Handle client-side mounting and prevent SSR issues
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only call getPassphraseStatus after mounting on client
  const [status, setStatus] = React.useState({
    isSecure: false,
    hasUserPassphrase: false,
    hasSessionEncryption: false,
    statusMessage: 'Loading security status...'
  });

  React.useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        setStatus(getPassphraseStatus());
      } catch {
        // Handle SSR or other errors gracefully
        setStatus({
          isSecure: false,
          hasUserPassphrase: false,
          hasSessionEncryption: false,
          statusMessage: 'Security status unavailable'
        });
      }
    }
  }, [mounted, getPassphraseStatus]);

  // Auto-check on component mount if requested
  React.useEffect(() => {
    if (autoCheck && mounted) {
      checkWithToast();
    }
  }, [autoCheck, checkWithToast, mounted]);

  const handleQuickCheck = () => {
    if (mounted) {
      checkWithToast();
    }
  };

  const handleDetailedCheck = () => {
    if (mounted) {
      checkDetailed();
    }
  };

  const handleAuthContextCheck = () => {
    checkPassphrasesWithToast();
  };

  const handleAuthDetailedCheck = () => {
    checkPassphrasesDetailed();
  };

  const getStatusIcon = () => {
    if (status.isSecure) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusBadge = () => {
    if (status.isSecure) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Secure</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">Partial</Badge>;
    }
  };

  // Show loading state during SSR or before mounting
  if (!mounted) {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Security Status Check
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
              <span className="font-medium">Loading security status...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Security Status Check
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Current Status</span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Status Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className={status.hasUserPassphrase ? "text-green-700" : "text-red-700"}>
              User Passphrase: {status.hasUserPassphrase ? "Available" : "Missing"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className={status.hasSessionEncryption ? "text-green-700" : "text-red-700"}>
              Session Encryption: {status.hasSessionEncryption ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
          {status.statusMessage}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleQuickCheck}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Quick Check
              </Button>
              
              <Button 
                onClick={handleDetailedCheck}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Detailed
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Auth Context Methods:
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleAuthContextCheck}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Context Check
              </Button>
              
              <Button 
                onClick={handleAuthDetailedCheck}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Context Detail
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
