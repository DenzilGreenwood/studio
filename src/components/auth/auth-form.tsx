// src/components/auth/auth-form.tsx
"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Key, Shield, Copy, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AuthFormProps, LoginFormValues, SignupFormValues } from "@/lib/auth-schemas";
import { useAuthForm } from "@/hooks/useAuthForm";
import { useAuthSubmission } from "@/hooks/useAuthSubmission";
import { AuthFormHeader } from "./AuthFormHeader";
import { RecoveryModeAlert } from "./RecoveryModeAlert";
import { PassphraseRecoveryDisplay } from "./PassphraseRecoveryDisplay";
import { selectAllText, copyToClipboard } from "@/lib/clipboard-utils";
import { Alert, AlertDescription } from "../ui/alert";


export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const {
    form,
    isRecoveryMode,
    recoveredPassphrase,
    recoveryKeyDialog,
    setRecoveryKeyDialog,
    toggleRecoveryMode,
    setRecoveredPassphrase,
  } = useAuthForm({ mode });

  const { handleSubmit, handleAuthError } = useAuthSubmission();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);

  async function onSubmit(values: LoginFormValues | SignupFormValues) {
    form.clearErrors();
    try {
      const result = await handleSubmit(
        values,
        mode,
        isRecoveryMode,
        setRecoveryKeyDialog
      );
      
      if (mode === "login" && isRecoveryMode && typeof result === 'string') {
        setRecoveredPassphrase(result);
      }
    } catch (error) {
      handleAuthError(error, mode);
    }
  }

  const handleDialogClose = () => {
    setRecoveryKeyDialog({ isOpen: false, recoveryKey: "" });
    // After signup and seeing recovery key, redirect to profile
    if (mode === "signup") {
      router.push("/profile");
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
        <Card className="w-full max-w-md shadow-2xl">
          <AuthFormHeader mode={mode} />
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <RecoveryModeAlert isRecoveryMode={isRecoveryMode} />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isRecoveryMode && (
                  <FormField
                    control={form.control}
                    name="passphrase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Security Passphrase
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassphrase ? "text" : "password"}
                              placeholder="Enter your 8+ character passphrase"
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
                        <div className="text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <span className="text-xs block">This passphrase encrypts <strong>all your personal data</strong>:</span>
                            <ul className="text-xs list-disc list-inside ml-2 space-y-0">
                              <li>Session content & AI conversations</li>
                              <li>Journal entries & personal reflections</li>
                              <li>Goals, insights & feedback</li>
                              <li>Profile details (name, challenges, etc.)</li>
                            </ul>
                            <span className="text-xs mt-1 font-medium block">⚠️ Only you can decrypt this data.</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {mode === "login" && isRecoveryMode && (
                  <FormField
                    control={form.control}
                    name="recoveryKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Recovery Key
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your 64-character recovery key"
                            className="font-mono text-sm"
                            {...field}
                            onChange={(e) => {
                              const cleanedValue = e.target.value.replace(/\s/g, '').toLowerCase();
                              field.onChange(cleanedValue);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="space-y-1">
                          <span className="block">Enter the recovery key you saved during signup.</span>
                          <span className="block text-xs text-muted-foreground">
                            Format: 64-character hexadecimal string (0-9, a-f)
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {mode === "signup" && (
                  <>
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
                    <FormField
                      control={form.control}
                      name="pseudonym"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pseudonym (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your chosen pseudonym" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be your display name in the app.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <PassphraseRecoveryDisplay recoveredPassphrase={recoveredPassphrase} />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Processing..." : (
                    isRecoveryMode ? "Recover Passphrase" : (mode === "login" ? "Login" : "Sign Up")
                  )}
                </Button>

                {mode === "login" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={toggleRecoveryMode}
                  >
                    {isRecoveryMode ? "Back to Login" : "Forgot Passphrase? Zero-Knowledge Recovery"}
                  </Button>
                )}
              </form>
            </Form>
            <div className="mt-6 flex justify-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-primary hover:underline">
                  {mode === "login" ? "Sign up" : "Login"}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={recoveryKeyDialog.isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Critical: Save Your Recovery Key
            </DialogTitle>
            <DialogDescription>
              This key is the ONLY way to recover your passphrase. We cannot help you if you lose it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              className="p-4 bg-muted rounded-lg font-mono text-sm break-all select-all cursor-text"
              id="recovery-key-text"
              onClick={() => selectAllText('recovery-key-text')}
            >
              {recoveryKeyDialog.recoveryKey}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => copyToClipboard(recoveryKeyDialog.recoveryKey, 'recovery-key-text')} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </Button>
              <Button onClick={handleDialogClose} className="w-full flex-1" variant="outline">
                I've Saved It
              </Button>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Losing both your passphrase and this recovery key will result in permanent data loss.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
