// src/components/auth/OAuthPassphraseSetup.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Shield, Key } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useEncryption } from "@/lib/encryption-context";
import { storeEncryptedPassphrase } from "@/services/recoveryService";
import { useAuth } from "@/context/auth-context";
import { selectAllText, copyToClipboard } from "@/lib/clipboard-utils";
import * as z from "zod";

const passphraseSchema = z.object({
  passphrase: z.string()
    .min(8, { message: "Must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain an uppercase letter." })
    .regex(/[a-z]/, { message: "Must contain a lowercase letter." })
    .regex(/[0-9]/, { message: "Must contain a number." })
    .regex(/[^A-Za-z0-9]/, { message: "Must contain a special character." }),
  confirmPassphrase: z.string().min(1, "Please confirm your passphrase."),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases don't match",
  path: ["confirmPassphrase"],
});

type PassphraseFormValues = z.infer<typeof passphraseSchema>;

interface OAuthPassphraseSetupProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OAuthPassphraseSetup({ isOpen, onComplete }: OAuthPassphraseSetupProps) {
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string>("");
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const { setPassphrase } = useEncryption();
  const { firebaseUser } = useAuth();

  const form = useForm<PassphraseFormValues>({
    resolver: zodResolver(passphraseSchema),
    defaultValues: {
      passphrase: "",
      confirmPassphrase: "",
    },
  });

  const onSubmit = async (values: PassphraseFormValues) => {
    if (!firebaseUser) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "No authenticated user found.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Store encrypted passphrase for recovery
      const generatedRecoveryKey = await storeEncryptedPassphrase(firebaseUser.uid, values.passphrase);
      
      // Set passphrase in session
      await setPassphrase(values.passphrase);
      
      setRecoveryKey(generatedRecoveryKey);
      setShowRecoveryKey(true);
      
      toast({
        title: "Passphrase Set Successfully",
        description: "Your security passphrase has been configured. Please save your recovery key.",
      });
      
    } catch (error) {
      console.error("Error setting up passphrase:", error);
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: "Failed to set up security passphrase. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoveryKeyClose = () => {
    setShowRecoveryKey(false);
    onComplete();
    router.push("/protocol");
  };

  const copyRecoveryKey = async () => {
    try {
      await copyToClipboard(recoveryKey);
      toast({
        title: "Recovery Key Copied",
        description: "Your recovery key has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy recovery key. Please select and copy manually.",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showRecoveryKey} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Set Security Passphrase
            </DialogTitle>
            <DialogDescription>
              To protect your data with zero-knowledge encryption, please create a security passphrase.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Passphrase</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassphrase ? "text" : "password"}
                          placeholder="Enter your security passphrase"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassphrase(!showPassphrase)}
                        >
                          {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Must contain uppercase, lowercase, number, and special character
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Passphrase</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassphrase ? "text" : "password"}
                          placeholder="Confirm your passphrase"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                        >
                          {showConfirmPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Set Passphrase"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecoveryKey} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your Recovery Key
            </DialogTitle>
            <DialogDescription>
              Save this recovery key securely. You'll need it to recover your passphrase if forgotten.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p 
                className="font-mono text-sm break-all select-all cursor-pointer" 
                onClick={(e) => {
                  const selection = window.getSelection();
                  const range = document.createRange();
                  range.selectNodeContents(e.currentTarget);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }}
              >
                {recoveryKey}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={copyRecoveryKey} variant="outline" className="flex-1">
                Copy Key
              </Button>
              <Button onClick={handleRecoveryKeyClose} className="flex-1">
                Continue
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              ⚠️ This key will not be shown again. Store it in a safe place.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
