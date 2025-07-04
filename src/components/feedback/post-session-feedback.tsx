// src/components/feedback/post-session-feedback.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db, addDoc, collection, serverTimestamp, doc, updateDoc } from '@/lib/firebase';
import type { SessionFeedback } from '@/types';
import { Loader2, MessageSquare, Send, ArrowLeft, AlertCircle } from 'lucide-react';
import { encryptFeedback, getPassphraseSafely } from '@/lib/data-encryption';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PostSessionFeedbackProps {
  sessionId: string;
  userId: string;
  circumstance: string;
  onFeedbackSubmitted?: (feedbackId: string) => void;
  onReturnToStart?: () => void;
}

type HelpfulRatingValue = "Not helpful" | "Somewhat helpful" | "Very helpful" | "";

export function PostSessionFeedback({ sessionId, userId, circumstance, onFeedbackSubmitted, onReturnToStart }: PostSessionFeedbackProps) {
  const [helpfulRating, setHelpfulRating] = useState<HelpfulRatingValue>("");
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Check if passphrase is available for encryption
  const hasPassphrase = getPassphraseSafely() !== null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!helpfulRating) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select how helpful the session was.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData: Omit<SessionFeedback, 'feedbackId'> = {
        sessionId,
        userId,
        circumstance,
        helpfulRating,
        improvementSuggestion: improvementSuggestion.trim() === '' ? undefined : improvementSuggestion.trim(),
        email: email.trim() === '' ? undefined : email.trim(),
        timestamp: serverTimestamp() as unknown as Date,
      };

      // Encrypt feedback before storing (gracefully handles missing passphrase)
      const encryptedFeedback = await encryptFeedback(feedbackData);

      const feedbackRef = await addDoc(collection(db, 'feedback'), encryptedFeedback);
      
      const sessionDocRef = doc(db, `users/${userId}/sessions/${sessionId}`);
      await updateDoc(sessionDocRef, {
        feedbackId: feedbackRef.id,
        feedbackSubmittedAt: serverTimestamp(),
      });
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackRef.id);
      } else {
        // If no handler is passed, we are likely on the protocol page, so show the toast here.
        // The report page will show its own toast.
        toast({ title: "Feedback Submitted", description: "Thank you for your valuable input!" });
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your feedback. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-lg mx-auto my-auto shadow-none border-none">
        <CardHeader className="items-center text-center">
          <MessageSquare className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-2xl text-primary">Thank You!</CardTitle>
          <CardDescription className="text-lg">
            Your input has been received. We’re grateful for your insight.
          </CardDescription>
        </CardHeader>
        {onReturnToStart && (
          <CardFooter className="flex justify-center mt-4">
            <Button onClick={onReturnToStart} size="lg">
              <ArrowLeft className="mr-2 h-5 w-5" /> Return to Start
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto my-8 shadow-lg sm:shadow-none sm:border-none sm:my-0">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <MessageSquare className="mr-3 h-7 w-7" /> Share Your Thoughts
        </CardTitle>
        <CardDescription>
          Your feedback helps us improve the experience. 
          This is anonymous unless you provide your email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show encryption status warning if passphrase is not available */}
        {!hasPassphrase && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Your session passphrase is not available, so this feedback will be stored unencrypted. Your feedback is still anonymous unless you provide your email.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="helpfulRating" className="font-semibold text-foreground">How helpful was this session? *</Label>
            <Select
              value={helpfulRating}
              onValueChange={(value) => setHelpfulRating(value as HelpfulRatingValue)}
              required
            >
              <SelectTrigger id="helpfulRating" className="mt-1">
                <SelectValue placeholder="Select a rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not helpful">Not helpful</SelectItem>
                <SelectItem value="Somewhat helpful">Somewhat helpful</SelectItem>
                <SelectItem value="Very helpful">Very helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="improvementSuggestion" className="font-semibold text-foreground">Any suggestions for improvement? (Optional)</Label>
            <Textarea
              id="improvementSuggestion"
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value)}
              placeholder="What could we do better?"
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="email" className="font-semibold text-foreground">Want a summary of your insights later? (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
