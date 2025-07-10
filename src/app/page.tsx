
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Lock, Shield, Sparkles, User, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30 text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-semibold text-primary">CognitiveInsight</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="#contact">Contact</a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-16 text-center md:py-24 lg:py-32">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            Coming Soon
          </Badge>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Turn Confusion Into <span className="text-primary">Clarity</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
            CognitiveInsight is a new kind of thought partner. Using a structured AI conversation based on the Cognitive Edge Protocol™, we help you navigate challenges, reframe beliefs, and build your legacy. All with absolute, zero-knowledge privacy.
          </p>
          <Card className="mt-10 w-full max-w-md p-6 bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Be the First to Know</CardTitle>
              <CardDescription>Enter your email to get notified when we launch.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form className="flex flex-col sm:flex-row gap-2">
                <Input type="email" placeholder="you@example.com" className="flex-1" />
                <Button type="submit" className="w-full sm:w-auto">Notify Me</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section id="features" className="py-16 bg-background/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Sparkles className="h-8 w-8 text-primary" />}
                title="AI-Powered Protocol"
                description="Engage in a guided conversation that helps you articulate challenges, discover core insights, and define your path forward."
              />
              <FeatureCard
                icon={<Lock className="h-8 w-8 text-primary" />}
                title="Zero-Knowledge Encryption"
                description="Your data is yours alone. All sessions are encrypted on your device. We can't see them, and no one else can either."
              />
              <FeatureCard
                icon={<User className="h-8 w-8 text-primary" />}
                title="Human-Centered Design"
                description="Created by a strategic consultant for real-world clarity. This isn't just an AI; it's a framework for human growth."
              />
            </div>
          </div>
        </section>
        
        <section id="1on1" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto shadow-xl border-primary/20 overflow-hidden">
                <div className="grid md:grid-cols-2">
                    <div className="p-8 flex flex-col justify-center">
                        <div className="rounded-full bg-primary/10 p-3 w-16 h-16 mb-4 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-3xl font-bold text-foreground">
                          Prefer a Human Thought Partner?
                        </CardTitle>
                        <CardDescription className="text-lg mt-4">
                          Work directly with me, <strong>James Greenwood</strong>, creator of the Cognitive Edge Protocol™, in a private 1-on-1 session.
                        </CardDescription>
                         <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                            <a href="mailto:founder@cognitiveinsight.ai" id="discovery">
                              Book a Discovery Call
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                    <div className="hidden md:block">
                        <img src="https://placehold.co/600x600.png" alt="James Greenwood" data-ai-hint="professional portrait" className="object-cover w-full h-full" />
                    </div>
                </div>
            </Card>
          </div>
        </section>

        <section className="py-16 md:py-24 text-center">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
                    <h2 className="font-headline text-3xl font-bold text-foreground sm:text-4xl">
                        Privacy Isn't a Feature. It's the Foundation.
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        CognitiveInsight is built on the MyImaginaryFriends.ai Zero-Knowledge Encryption Framework. Your passphrase is your key. Without it, no one—not even us—can access your data. If you lose your passphrase and recovery key, your data is irretrievable. That's our promise of true privacy.
                    </p>
                </div>
            </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-primary/10 p-4">
          {icon}
        </div>
      </div>
      <h3 className="font-headline text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
