// src/app/not-found.tsx
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 text-center p-4">
      <div className="mb-8">
        <Brain className="h-24 w-24 text-primary animate-pulse md:h-32 md:w-32" />
      </div>
      <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
        Oops! Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground md:text-xl">
        The page you're looking for doesn't seem to exist. Maybe it was moved, or you typed something wrong.
      </p>
      <Button asChild size="lg" className="mt-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
        <Link href="/">
          Go Back to Homepage
        </Link>
      </Button>
      <footer className="absolute bottom-0 py-6 text-center text-sm text-muted-foreground">
         &copy; {new Date().getFullYear()} <Link href="/" className="hover:underline text-primary">CognitiveInsight</Link>. All rights reserved.
      </footer>
    </div>
  );
}
