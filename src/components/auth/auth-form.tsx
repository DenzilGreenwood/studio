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
  const { toast } = useToast();
  const { setPassphrase } = useEncryption();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);
  const [recoveryKeyDialog, setRecoveryKeyDialog] = useState<{ isOpen: boolean; recoveryKey: string; }>({ isOpen: false, recoveryKey: "" });
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveredPassphrase, setRecoveredPassphrase] = useState<string>("");

  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
      passphrase: "",
      ...(mode === "signup" && {
        pseudonym: "",
        confirmPassphrase: "",
      }),
      ...(mode === "login" && {
        recoveryKey: "",
      }),
    },
  });

  const copyRecoveryKey = async () => {
    try {
      // Use modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(recoveryKeyDialog.recoveryKey);
        toast({ title: "Recovery Key Copied", description: "Save this key securely!" });
        return;
      }
      
      // If Clipboard API is not available, show manual copy instructions
      throw new Error('Clipboard API not available');
    } catch {
      // Auto-select the text and show instructions for manual copying
      const element = document.getElementById('recovery-key-text');
      if (element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      toast({ 
        title: "Copy Manually", 
        description: "The text is now selected. Press Ctrl+C (or Cmd+C) to copy the recovery key.",
        duration: 5000 // Show longer to give user time to copy
      });
    }
  };

  const handleRecoveryKeySubmit = async (recoveryKey: string, email: string) => {
    try {
      // Step 1: Find user ID by email without requiring password
      const uidResult = await findUIDByEmail(email);
      if (!uidResult.uid || !uidResult.exists) {
        throw new Error(uidResult.error || "No account found with this email address.");
      }

      // Step 2: Check if recovery data exists for this user
      const hasRecovery = await hasRecoveryData(uidResult.uid);
      if (!hasRecovery) {
        throw new Error("No recovery data found for this account. This account may have been created before the recovery system was implemented.");
      }

      // Step 3: Zero-Knowledge Recovery - decrypt passphrase client-side
      const { passphrase: decryptedPassphrase, success, error } = await recoverPassphraseZeroKnowledge(uidResult.uid, recoveryKey);
      
      if (!success || !decryptedPassphrase) {
        throw new Error(error || "Invalid recovery key. Please check your recovery key and try again.");
      }

      // Step 4: Authenticate with Firebase using account password
      const password = form.getValues('password');
      if (!password) {
        throw new Error("Please enter your account password to complete recovery.");
      }

      await signInWithEmailAndPassword(auth, email, password);
      
      // Step 5: Set the recovered passphrase in encryption context
      await setPassphrase(decryptedPassphrase);
      setRecoveredPassphrase(decryptedPassphrase);
      
      // Step 6: Zero-Knowledge Success - passphrase shown in UI only (never emailed)
      toast({ 
        title: "🔐 Zero-Knowledge Recovery Successful", 
        description: "Your passphrase has been recovered and is displayed below. Save it securely - it will not be sent via email.",
      });
      
      // Navigate to protocol page after successful recovery
      router.push("/protocol");
    } catch (error) {
      let errorMessage = "Recovery failed. Please check your details and try again.";
      
      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.message.includes("No account found")) {
          errorMessage = "No account found with this email address.";
        } else if (error.message.includes("No recovery data")) {
          errorMessage = "No recovery data found. This account may have been created before the recovery system was implemented.";
        } else if (error.message.includes("Invalid recovery key")) {
          errorMessage = "Invalid recovery key. Please check your 64-character recovery key and try again.";
        } else if (error.message.includes("password")) {
          errorMessage = "Please enter your account password to complete recovery.";
        } else if (error.message.includes("auth/")) {
          // Firebase auth errors
          if (error.message.includes("auth/wrong-password")) {
            errorMessage = "Incorrect password. Please enter your account password.";
          } else if (error.message.includes("auth/user-not-found")) {
            errorMessage = "Account not found. Please check your email address.";
          } else if (error.message.includes("auth/too-many-requests")) {
            errorMessage = "Too many failed attempts. Please try again later.";
          }
        }
      }
      
      toast({ 
        variant: "destructive", 
        title: "Recovery Failed", 
        description: errorMessage
      });
    }
  };

  async function onSubmit(values: LoginFormValues | SignupFormValues) {
    form.clearErrors();
    try {
      if (mode === "login") {
        const loginValues = values as LoginFormValues;
        
        if (isRecoveryMode) {
          // Validate recovery mode requirements
          await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);

          if (!loginValues.recoveryKey || loginValues.recoveryKey.trim() === '') {

          
            toast({
              variant: "destructive",
              title: "Recovery Key Required",
              description: "Please enter your recovery key."
            });
            return;
          }
          
          // Handle recovery mode - this function will handle authentication
          await handleRecoveryKeySubmit(loginValues.recoveryKey, loginValues.email);
          return;
        }

        // Regular login flow - validate required fields
        if (!loginValues.passphrase) {
          toast({
            variant: "destructive",
            title: "Passphrase Required",
            description: "Please enter your passphrase to login."
          });
          return;
        }

        // Basic length validation only (for login) - don't block existing users with weaker passphrases
        if (loginValues.passphrase.length < 8) {
          toast({
            variant: "destructive",
            title: "Invalid Passphrase",
            description: "Passphrase must be at least 8 characters long."
          });
          return;
        }

        await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);
        
        // Use encryption context to set passphrase (triggers profile refresh)
        await setPassphrase(loginValues.passphrase);
        
        toast({ title: "Login Successful", description: "Redirecting..." });
        router.push("/protocol");

      } else { // mode === "signup"
        const signupValues = values as SignupFormValues;
        
        // Validate passphrase strength
        const passphraseValidation = validatePassphrase(signupValues.passphrase);
        if (!passphraseValidation.isValid) {
          toast({
            variant: "destructive",
            title: "Weak Passphrase",
            description: passphraseValidation.errors.join(", ")
          });
          return;
        }

        // Check user limit before creating account
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
        const userCredential = await createUserWithEmailAndPassword(auth, signupValues.email, signupValues.password);
        const recoveryKey = await storeEncryptedPassphrase(userCredential.user.uid, signupValues.passphrase);
        
        const pseudonymToUse = signupValues.pseudonym ? signupValues.pseudonym.trim() : "";

        if (pseudonymToUse) {
          await updateProfile(userCredential.user, { displayName: pseudonymToUse });
        }
        
        // Use encryption context to set passphrase (needed for encryption and triggers profile refresh)
        await setPassphrase(signupValues.passphrase);

        await createUserProfileDocument(userCredential.user, { 
          pseudonym: pseudonymToUse
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

        // Show recovery key dialog
        setRecoveryKeyDialog({ isOpen: true, recoveryKey });
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
