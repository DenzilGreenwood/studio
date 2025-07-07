// src/components/auth/auth-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Card, CardContent, CardDescription as UiCardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Eye, EyeOff, Copy, Key, Shield, AlertCircle } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfileDocument } from "@/context/auth-context";
import { canCreateNewUser, incrementUserCount } from "@/lib/user-limit";
import { 
  validatePassphrase
} from "@/lib/cryptoUtils";
import { storeEncryptedPassphrase, recoverPassphrase, findUserByEmail, hasRecoveryData } from "@/services/recoveryService";
import { useEncryption } from "@/lib/encryption-context";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthFormProps {
  mode: "login" | "signup";
}

const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const loginSchema = baseSchema.extend({
  passphrase: z.string().min(8, { message: "Passphrase must be at least 8 characters." }).optional(),
  recoveryKey: z.string()
    .min(64, { message: "Recovery key must be 64 characters long." })
    .max(64, { message: "Recovery key must be 64 characters long." })
    .regex(/^[a-f0-9]+$/i, { message: "Recovery key must contain only hexadecimal characters (0-9, a-f)." })
    .optional(),
});

const signupSchema = baseSchema.extend({
  pseudonym: z.string().min(2, { message: "Pseudonym must be at least 2 characters." }).max(50, {message: "Pseudonym cannot exceed 50 characters."}).trim().optional().or(z.literal('')),
  passphrase: z.string().min(8, { message: "Passphrase must be at least 8 characters." }),
  confirmPassphrase: z.string(),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases don't match",
  path: ["confirmPassphrase"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

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
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(recoveryKeyDialog.recoveryKey);
        toast({ title: "Recovery Key Copied", description: "Save this key securely!" });
        return;
      }
      
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = recoveryKeyDialog.recoveryKey;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast({ title: "Recovery Key Copied", description: "Save this key securely!" });
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      // Optionally log error to an external service here if needed
      toast({ 
        variant: "destructive", 
        title: "Failed to copy", 
        description: `Please select and copy the key manually (Ctrl+C or Cmd+C). ${error instanceof Error ? error.message : "Unknown error occurred."}`
      });
    }
  };

  const handleRecoveryKeySubmit = async (recoveryKey: string, email: string) => {
    try {
      // Step 1: Find user ID by email without requiring password
      const userId = await findUserByEmail(email);
      if (!userId) {
        throw new Error("No account found with this email address.");
      }

      // Step 2: Check if recovery data exists for this user
      const hasRecovery = await hasRecoveryData(userId);
      if (!hasRecovery) {
        throw new Error("No recovery data found for this account. This account may have been created before the recovery system was implemented.");
      }

      // Step 3: Attempt to recover passphrase using the provided recovery key
      const decryptedPassphrase = await recoverPassphrase(userId, recoveryKey);
      if (!decryptedPassphrase) {
        throw new Error("Invalid recovery key. Please check your recovery key and try again.");
      }

      // Step 4: Now authenticate with Firebase using the recovered credentials
      // We still need the Firebase password for authentication
      const password = form.getValues('password');
      if (!password) {
        throw new Error("Please enter your account password to complete recovery.");
      }

      await signInWithEmailAndPassword(auth, email, password);
      
      // Step 5: Set the recovered passphrase in encryption context
      setPassphrase(decryptedPassphrase);
      setRecoveredPassphrase(decryptedPassphrase);
      
      toast({ 
        title: "Recovery Successful", 
        description: "Your passphrase has been recovered and you are now logged in. Redirecting...",
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

        // Validate passphrase strength
        const passphraseValidation = validatePassphrase(loginValues.passphrase);
        if (!passphraseValidation.isValid) {
          toast({
            variant: "destructive",
            title: "Invalid Passphrase",
            description: passphraseValidation.errors[0]
          });
          return;
        }

        await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);
        
        // Use encryption context to set passphrase (triggers profile refresh)
        setPassphrase(loginValues.passphrase);
        
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
        setPassphrase(signupValues.passphrase);

        await createUserProfileDocument(userCredential.user, { 
          pseudonym: pseudonymToUse
        });

        // Increment user count after successful account creation
        try {
          await incrementUserCount();
        } catch (countError) {
          // eslint-disable-next-line no-console
          console.error("Error incrementing user count:", countError);
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
      // Handle errors during authentication
      // console.error("Auth error:", error);
      // Show generic error toast
      toast({
        variant: "destructive",
        title: mode === "login" ? "Login Failed" : "Signup Failed",
        description: "An unexpected error occurred. Please try again later.",
      });
      // Handle specific Firebase Auth errors
      if (error instanceof Error && (error as AuthError).code) {
        // Cast to AuthError to access code property
        // This is a more specific error handling for Firebase Auth errors
      }
      const authError = error as AuthError;
      let errorMessage = "An error occurred. Please try again.";
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
      }
      
      toast({
        variant: "destructive",
        title: mode === "login" ? "Login Failed" : "Signup Failed",
        description: errorMessage,
      });
    }
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-10 w-10 text-primary" />
              <span className="font-headline text-3xl font-semibold text-primary">CognitiveInsight</span>
            </Link>
            <CardTitle className="font-headline text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <UiCardDescription>
              {mode === "login"
                ? (
                  <div className="space-y-2 text-left">
                    <span className="block">Enter your credentials and security passphrase.</span>
                    <span className="text-xs text-muted-foreground block">
                      <strong>🔒 Your privacy is protected:</strong> This system ensures that all user data remains private — 
                      not even CognitiveInsight staff can decrypt it without your passphrase or recovery key.
                    </span>
                  </div>
                )
                : (
                  <div className="space-y-2 text-left">
                    <span className="block">Create your account with end-to-end encryption.</span>
                    <span className="text-xs text-muted-foreground block">
                      <strong>🔒 Complete Privacy:</strong> Your passphrase encrypts all data (sessions, journals, conversations) before storage. 
                      Only you can decrypt it — we cannot access your private information even if we wanted to.
                    </span>
                  </div>
                )}
            </UiCardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Recovery Mode Information */}
                {mode === "login" && isRecoveryMode && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recovery Mode:</strong> You&apos;ll need your recovery key AND your account password to recover your passphrase. 
                      If you don&apos;t have your recovery key, you won&apos;t be able to access your encrypted data.
                    </AlertDescription>
                  </Alert>
                )}

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

                {/* Passphrase Field */}
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
                            <span className="text-xs mt-1 font-medium block">⚠️ Only you can decrypt this data - we cannot recover it without your passphrase.</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Recovery Mode */}
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
                              // Remove any spaces and convert to lowercase for consistency
                              const cleanedValue = e.target.value.replace(/\s/g, '').toLowerCase();
                              field.onChange(cleanedValue);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="space-y-1">
                          <div>Enter the recovery key you saved during signup. This is the ONLY way to recover your passphrase if forgotten.</div>
                          <div className="text-xs text-muted-foreground">
                            Format: 64-character hexadecimal string (0-9, a-f)
                          </div>
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

                {/* Show recovered passphrase */}
                {recoveredPassphrase && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recovered Passphrase:</strong> {recoveredPassphrase}
                      <br />
                      <small>Please save this securely and use it to log in.</small>
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Processing..." : (
                    isRecoveryMode ? "Recover Passphrase" : (mode === "login" ? "Login" : "Sign Up")
                  )}
                </Button>

                {mode === "login" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setIsRecoveryMode(!isRecoveryMode);
                      setRecoveredPassphrase("");
                      form.reset();
                    }}
                  >
                    {isRecoveryMode ? "Back to Login" : "Forgot Passphrase? Use Recovery Key"}
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-primary hover:underline">
                {mode === "login" ? "Sign up" : "Login"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Recovery Key Dialog */}
      <Dialog open={recoveryKeyDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setRecoveryKeyDialog({ isOpen: false, recoveryKey: "" });
          router.push("/profile");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Important: Save Your Recovery Key
            </DialogTitle>
            <DialogDescription>
              This recovery key can restore your passphrase if you forget it. Store it securely - you won&apos;t see it again! Without both your passphrase AND this recovery key, your encrypted data cannot be recovered by anyone, including CognitiveInsight staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <code 
                className="text-sm font-mono break-all select-all cursor-text"
                id="recovery-key-text"
                onClick={(e) => {
                  // Select all text when clicked
                  const range = document.createRange();
                  range.selectNodeContents(e.currentTarget);
                  const selection = window.getSelection();
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }}
              >
                {recoveryKeyDialog.recoveryKey}
              </code>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyRecoveryKey} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Select all text for manual copying
                  const element = document.getElementById('recovery-key-text');
                  if (element) {
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                    toast({ 
                      title: "Text Selected", 
                      description: "Press Ctrl+C (or Cmd+C) to copy the key" 
                    });
                  }
                }}
                className="flex-1"
              >
                Select All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setRecoveryKeyDialog({ isOpen: false, recoveryKey: "" });
                  router.push("/profile");
                }}
                className="w-full"
              >
                I&apos;ve Saved It
              </Button>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Critical Warning:</strong> Without this recovery key, you cannot recover your passphrase if forgotten. Your encrypted data will be permanently inaccessible to everyone, including CognitiveInsight staff. This ensures your complete privacy, but makes the recovery key your responsibility.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
