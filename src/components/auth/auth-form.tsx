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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription as UiCardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfileDocument } from "@/context/auth-context";
import { ADMIN_USER_IDS } from "@/hooks/use-is-admin";
import { canCreateNewUser } from "@/lib/user-limit";

interface AuthFormProps {
  mode: "login" | "signup";
}

const formSchemaBase = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = formSchemaBase.extend({
  pseudonym: z.string().min(2, { message: "Pseudonym must be at least 2 characters." }).max(50, {message: "Pseudonym cannot exceed 50 characters."}).trim().optional().or(z.literal('')), // Allow empty string after trim
  consentAgreed: z.boolean().refine(value => value === true, {
    message: "You must agree to the terms to sign up.",
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Always use the signup schema which is a superset
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(mode === "signup" ? signupSchema : formSchemaBase),
    defaultValues: {
      email: "",
      password: "",
      pseudonym: "",
      consentAgreed: false,
    },
  });

  async function onSubmit(values: SignupFormValues) {
    form.clearErrors(); 
    try {
      if (mode === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: "Login Successful", description: "Redirecting..." });
        
        const isAdmin = ADMIN_USER_IDS.includes(userCredential.user.uid);
        if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/protocol"); 
        }

      } else { // mode === "signup"
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

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        
        const pseudonymToUse = values.pseudonym ? values.pseudonym.trim() : "";

        if (pseudonymToUse) {
          await updateProfile(userCredential.user, { displayName: pseudonymToUse });
        }
        // No need for an else to set displayName to null for Firebase Auth user,
        // as userCredential.user.displayName will be null by default for new users.
        
        await createUserProfileDocument(userCredential.user, { 
          pseudonym: pseudonymToUse, 
          hasConsentedToDataUse: values.consentAgreed 
        });

        toast({ title: "Signup Successful", description: "Redirecting to profile setup..." });
        router.push("/profile");
      }
    } catch (error: unknown) {
      const authError = error as AuthError;
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (authError.code) {
        switch (authError.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "Invalid email or password.";
            break;
          case "auth/email-already-in-use":
            errorMessage = "This email is already registered. Please login or use a different email.";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak. It should be at least 6 characters.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          default:
            errorMessage = authError.message || "Authentication failed.";
        }
      }
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: errorMessage,
      });
    }
  }

  return (
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
              ? "Enter your credentials to access your account."
              : "Fill in the details below to get started."}
          </UiCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {mode === "signup" && (
                <>
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
                  <FormField
                    control={form.control}
                    name="consentAgreed" 
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow bg-card">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="consentAgreed"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel htmlFor="consentAgreed" className="cursor-pointer">
                            Consent to Data Use & AI Interaction
                          </FormLabel>
                          <FormDescription className="cursor-pointer">
                            I agree to allow the use of my data for the Cognitive Edge Protocol case study and understand that Gemini AI will be used in this application.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Processing..." : (mode === "login" ? "Login" : "Sign Up")}
              </Button>
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
  );
}
