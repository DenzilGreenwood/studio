
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
import { storeEncryptedPassphrase, recoverPassphraseZeroKnowledge, findUserByEmail, hasRecoveryData } from "@/services/recoveryService";
import { useEncryption } from "@/lib/encryption-context";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthFormProps {
  mode: "login" | "signup";
}

const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
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
      const userId = await findUserByEmail(email);
      if (!userId) {
        throw new Error("No account found with this email address.");
      }

      // Step 2: Check if recovery data exists for this user
      const hasRecovery = await hasRecoveryData(userId);
      if (!hasRecovery) {
        throw new Error("No recovery data found for this account. This account may have been created before the recovery system was implemented.");
      }

      // Step 3: Zero-Knowledge Recovery - decrypt passphrase client-side
      const { passphrase: decryptedPassphrase, success, error } = await recoverPassphraseZeroKnowledge(userId, recoveryKey);
      
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
      let errorMessage = "An unexpected error occurred. Please try again later.";
      
      if (error instanceof Error) {
        // Check if it's a Firebase AuthError by looking for a 'code' property
        if ('code' in error && typeof (error as AuthError).code === 'string') {
          const authError = error as AuthError;
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
              errorMessage = "The email address is not valid.";
              break;
            case 'auth/too-many-requests':
              errorMessage = "Too many failed login attempts. Please try again later.";
              break;
            default:
              errorMessage = authError.message; // Fallback to the specific Firebase error message
              break;
          }
        } else {
          // It's a generic Error (like from our recovery flow), use its message
          errorMessage = error.message;
        }
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
                  <span className="space-y-2 text-left block">
                    <span className="block">Enter your credentials and security passphrase.</span>
                    <span className="text-xs text-muted-foreground block">
                      <strong>🔒 Zero-Knowledge Architecture:</strong> Following MyImaginaryFriends.ai standards - 
                      your data is encrypted client-side and never accessible by CognitiveInsight staff, even during recovery.
                    </span>
                  </span>
                )
                : (
                  <span className="space-y-2 text-left block">
                    <span className="block">Create your account with client-side zero-knowledge encryption.</span>
                    <span className="text-xs text-muted-foreground block">
                      <strong>🔒 True Privacy:</strong> Your passphrase encrypts all data in your browser before storage. 
                      We never see your passphrase - even recovery happens client-side with zero server knowledge.
                    </span>
                  </span>
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
                      <strong>Zero-Knowledge Recovery Mode:</strong> You&apos;ll need your recovery key AND account password. 
                      Your passphrase will be decrypted in your browser and displayed to you - never emailed or logged.
                      <br />
                      <small className="text-xs mt-1 block text-muted-foreground">
                        Following MyImaginaryFriends.ai zero-knowledge architecture.
                      </small>
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
                          <span className="block">Enter the recovery key you saved during signup. This will decrypt your passphrase locally in your browser.</span>
                          <span className="block text-xs text-muted-foreground">
                            Format: 64-character hexadecimal string (0-9, a-f)
                            <br />
                            <strong>Zero-Knowledge:</strong> Decryption happens client-side only.
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

                {/* Zero-Knowledge Recovery: Show passphrase in browser only */}
                {recoveredPassphrase && (
                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <span className="space-y-3 block">
                        <span className="block">
                          <strong className="text-green-800">🔐 Zero-Knowledge Recovery Complete</strong>
                          <span className="text-sm text-green-700 mt-1 block">
                            Your passphrase has been decrypted locally in your browser. Save it securely:
                          </span>
                        </span>
                        <span className="bg-white border border-green-300 rounded-md p-3 block">
                          <span className="flex items-center justify-between">
                            <code className="text-lg font-mono text-gray-900 select-all break-all" data-passphrase>
                              {recoveredPassphrase}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (navigator.clipboard && window.isSecureContext) {
                                    await navigator.clipboard.writeText(recoveredPassphrase);
                                    toast({ title: "Copied", description: "Passphrase copied to clipboard" });
                                  } else {
                                    // Auto-select the passphrase text for manual copying
                                    const codeElement = document.querySelector('code[data-passphrase]') as HTMLElement;
                                    if (codeElement) {
                                      const range = document.createRange();
                                      range.selectNodeContents(codeElement);
                                      const selection = window.getSelection();
                                      selection?.removeAllRanges();
                                      selection?.addRange(range);
                                    }
                                    toast({ 
                                      title: "Copy Manually", 
                                      description: "Text selected. Press Ctrl+C (or Cmd+C) to copy.",
                                      duration: 3000
                                    });
                                  }
                                } catch {
                                  toast({ 
                                    variant: "destructive",
                                    title: "Copy Failed", 
                                    description: "Please select and copy the passphrase manually." 
                                  });
                                }
                              }}
                              className="ml-2 flex-shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </span>
                        </span>
                        <span className="text-xs text-green-600 space-y-1 block">
                          <span className="block">✅ <strong>Zero-Knowledge:</strong> This passphrase was never sent via email or stored in logs</span>
                          <span className="block">✅ <strong>Client-Side:</strong> Decryption happened entirely in your browser</span>
                          <span className="block">✅ <strong>Private:</strong> Only you can see this passphrase</span>
                        </span>
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="button" 
                  onClick={form.handleSubmit(onSubmit)} 
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
                    onClick={() => {
                      setIsRecoveryMode(!isRecoveryMode);
                      setRecoveredPassphrase("");
                      form.reset();
                    }}
                  >
                    {isRecoveryMode ? "Back to Login" : "Forgot Passphrase? Zero-Knowledge Recovery"}
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
              Critical: Save Your Zero-Knowledge Recovery Key
            </DialogTitle>
            <DialogDescription>
              This recovery key enables client-side decryption of your passphrase if forgotten. Following MyImaginaryFriends.ai 
              zero-knowledge architecture - this key will never be shown again and enables local browser-only recovery.
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
                <strong>⚠️ Zero-Knowledge Warning:</strong> Without this recovery key, your passphrase cannot be recovered by anyone. 
                Your data remains encrypted and inaccessible forever - this ensures true zero-knowledge privacy but makes this key your responsibility.
                <br />
                <small className="text-xs mt-1 block text-muted-foreground">
                  MyImaginaryFriends.ai Architecture: Even during recovery, decryption happens in your browser only.
                </small>
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
