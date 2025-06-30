"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface UserLimitStatus {
  allowed: boolean;
  currentCount: number;
  maxUsers: number;
  remainingSlots: number;
  message?: string;
}

export function SignupButton() {
  const [limitStatus, setLimitStatus] = useState<UserLimitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserLimit() {
      try {
        const response = await fetch('/api/user-limit');
        const data = await response.json();
        setLimitStatus(data);
      } catch (error) {
        console.error('Error checking user limit:', error);
        // Default to allowing signup if check fails
        setLimitStatus({ 
          allowed: true, 
          currentCount: 0, 
          maxUsers: 30, 
          remainingSlots: 30,
          message: 'Registration is open (user limit check unavailable)'
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkUserLimit();
  }, []);

  if (isLoading) {
    return (
      <Button size="lg" disabled className="bg-primary/50 text-primary-foreground shadow-lg">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!limitStatus?.allowed) {
    return (
      <div className="text-center">
        <Button size="lg" disabled className="bg-muted text-muted-foreground shadow-lg">
          Registration Closed
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          {limitStatus?.message || "Registration is currently unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
        <Link href="/signup">
          Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
      {limitStatus.remainingSlots <= 5 && (
        <p className="mt-2 text-sm text-amber-600">
          Only {limitStatus.remainingSlots} spots remaining in this beta
        </p>
      )}
    </div>
  );
}
