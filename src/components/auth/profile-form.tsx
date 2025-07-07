// src/components/auth/profile-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Play, BookOpen, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useAuth, updateUserProfileDocument } from "@/context/auth-context";
import React, { useEffect, useState } from "react";
// import { serverTimestamp } from "firebase/firestore"; // Not currently used
import type { UserProfile } from "@/types";
import { checkForActiveSession, getCompletedSessions, type ActiveSession } from "@/lib/session-utils";


const profileFormSchema = z.object({
  ageRange: z.string({ required_error: "Please select an age range." }).min(1, "Please select an age range."),
  challengeCategory: z.string({ required_error: "Please select a challenge category." }).min(1, "Please select a challenge category."),
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50, {message: "Display name cannot exceed 50 characters."}).trim().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ageRanges = ["<18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const challengeCategories = [
  "Career",
  "Personal Growth",
  "Relationships",
  "Life Transition",
  "Stress/Burnout",
  "Decision Making",
  "Other",
];

export function ProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, firebaseUser } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [checkingSession, setCheckingSession] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      ageRange: "",
      challengeCategory: "",
      displayName: "",
    },
  });

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    } else if (user && firebaseUser) { // Ensure both user (Firestore profile) and firebaseUser (Auth user) are available
      // Prioritize pseudonym from Firestore, then displayName from Firestore, then displayName from Auth user
      const nameToDisplay = user.pseudonym || user.displayName || firebaseUser.displayName || "";
      form.reset({
        ageRange: user.ageRange || "",
        challengeCategory: user.primaryChallenge || "",
        displayName: nameToDisplay,
      });
    } else if (!user && firebaseUser && !loading) {
      // Fallback if Firestore user profile is not yet available but auth user is
      form.reset({
        displayName: firebaseUser.displayName || ""
      })
    }
  }, [user, firebaseUser, loading, router, form]);

  // Check for active sessions and completed sessions
  useEffect(() => {
    const checkSessionData = async () => {
      if (!firebaseUser) return;
      
      setCheckingSession(true);
      try {
        const [activeSession, completedSessions] = await Promise.all([
          checkForActiveSession(firebaseUser.uid),
          getCompletedSessions(firebaseUser.uid)
        ]);
        
        setActiveSession(activeSession);
        setCompletedSessionsCount(completedSessions.length);
      } catch (error) {
        console.error("Error checking session data:", error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSessionData();
  }, [firebaseUser]);

  async function onSubmit(values: ProfileFormValues) {
    if (!firebaseUser) {
        toast({ variant: "destructive", title: "Error", description: "No user session found. Please login again."});
        router.push('/login');
        return;
    }
    try {
      const displayNameToSave = values.displayName ? values.displayName.trim() : "";
      const dataToUpdate: Partial<UserProfile> = {
        ageRange: values.ageRange,
        primaryChallenge: values.challengeCategory,
        displayName: displayNameToSave,
        // If pseudonym should also be updated here, it needs to be explicit
        // For now, ProfileForm only updates displayName directly.
        // If displayName and pseudonym are meant to be kept in sync from this form,
        // add: pseudonym: displayNameToSave
      };
      
      // Optionally update Firebase Auth display name as well
      if (firebaseUser.displayName !== displayNameToSave) {
        // Consider if this is desired - usually profile form updates DB, and Auth displayName is separate
        // await updateProfile(firebaseUser, { displayName: displayNameToSave });
      }

      await updateUserProfileDocument(firebaseUser.uid, dataToUpdate);
      
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
      
      // Refresh session data after profile update
      const [newActiveSession, newCompletedSessions] = await Promise.all([
        checkForActiveSession(firebaseUser.uid),
        getCompletedSessions(firebaseUser.uid)
      ]);
      
      setActiveSession(newActiveSession);
      setCompletedSessionsCount(newCompletedSessions.length);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Profile Update Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 text-primary">
        <Loader2 className="h-16 w-16 animate-spin" />
        <p className="mt-4 font-headline text-xl">Loading Profile...</p>
      </div>
    );
  }
   if (!firebaseUser && !loading) { 
    // This case should be handled by the useEffect redirect, but as a fallback.
    return null; 
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-10 w-10 text-primary" />
            <span className="font-headline text-3xl font-semibold text-primary">CognitiveInsight</span>
          </Link>
          <CardTitle className="font-headline text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Help us tailor your experience by providing a bit more information.
            Your display name can be updated here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name / Pseudonym</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ageRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Range</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={user?.ageRange || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your age range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ageRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="challengeCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Challenge Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={user?.primaryChallenge || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary challenge" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {challengeCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What area are you primarily seeking clarity on?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>

          {/* Session Navigation Section */}
          {!checkingSession && firebaseUser && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-lg mb-4 text-center">Session Management</h3>
              
              {activeSession ? (
                <div className="space-y-3">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-medium text-primary mb-2">Active Session Found</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You have an ongoing session: &quot;{activeSession.circumstance}&quot;
                      <br />
                      Progress: {activeSession.completedPhases}/6 phases completed
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/protocol">
                        <Play className="mr-2 h-4 w-4" />
                        Continue Current Session
                      </Link>
                    </Button>
                  </div>
                  
                  {completedSessionsCount > 0 && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/sessions">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Past Sessions ({completedSessionsCount})
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {completedSessionsCount > 0 ? (
                    <>
                      <Button asChild className="w-full">
                        <Link href="/protocol">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Start New Session
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/sessions">
                          <BookOpen className="mr-2 h-4 w-4" />
                          View Past Sessions ({completedSessionsCount})
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Ready to start your journey to clarity?
                      </p>
                      <Button asChild className="w-full">
                        <Link href="/protocol">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Start Your First Session
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {checkingSession && (
            <div className="mt-6 pt-6 border-t text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Checking for active sessions...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
