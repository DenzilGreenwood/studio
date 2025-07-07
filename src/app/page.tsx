
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {  Brain, MessageCircle, Sparkles, User, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignupButton } from "@/components/ui/signup-button";
import { Footer } from "@/components/layout/footer";
import { CaseStudyCard } from "@/components/case-study/case-study-card";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="items-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          {icon}
        </div>
        <CardTitle className="font-headline text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-semibold text-primary">CognitiveInsight</span>
          </Link>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="#ai">AI Companion</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#1on1">1:1 Guidance</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#case-study">Case Study</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#contact">Contact</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-16 text-center md:py-24 lg:py-32">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Unlock Your <span className="text-primary">Cognitive Edge</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Navigate life&apos;s challenges with enhanced clarity and insight. CognitiveInsight guides you through the Cognitive Edge Protocol™ using a supportive conversational AI experience.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <SignupButton />
            <Button variant="outline" size="lg" asChild className="shadow-lg transition-transform hover:scale-105">
              <Link href="/protocol-overview">Learn More</Link>
            </Button>
          </div>
        </section>
        
        {/* Work with Me Directly Section */}
        <section id="1on1" className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/10">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto shadow-xl border-primary/20">
              <CardHeader className="text-center pb-6">
                <div className="rounded-full bg-primary/10 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-3xl font-bold text-foreground">
                  👤 Prefer to Work with a Human?
                </CardTitle>
                <CardDescription className="text-lg mt-4 max-w-2xl mx-auto">
                  The AI experience is powerful — but sometimes what you need is a <strong>strategic thought partner</strong> who can listen deeply, reflect back your strengths, and help you reframe what matters most.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="text-center">
                  <p className="text-muted-foreground mb-6">
                    You can work directly with me, <strong className="text-foreground">James Greenwood</strong>, creator of the Cognitive Edge Protocol™.
                  </p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-6 border border-border/50">
                  <h3 className="font-headline text-xl font-semibold text-foreground mb-3 flex items-center">
                    ✅ Cognitive Clarity Session
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    90-minute deep-dive using the same protocol that powers the app.<br />
                    Includes your Clarity Map™ + Insight Report™ to help you move forward with confidence.
                  </p>
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="#discovery">
                      Book a Discovery Call
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                
                <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/40">
                  <p className="text-sm text-muted-foreground italic">
                    <strong>Note:</strong> Group and team offerings are not currently available. As CognitiveInsight grows, I plan to introduce collaborative experiences led by trained facilitators. For now, all sessions are one-on-one and personally guided by me.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section id="ai" className="bg-background/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-3xl font-bold text-center text-foreground mb-12 sm:text-4xl">
              Your Journey to Clarity
            </h2>
            
            {/* Journey Graphic */}
            <div className="mb-16 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/20">
                <div className="flex items-center gap-2 text-center">
                  <div className="rounded-full bg-primary text-primary-foreground p-2 flex items-center justify-center w-10 h-10">
                    <Brain className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Start Chat</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 md:rotate-0" />
                <div className="flex items-center gap-2 text-center">
                  <div className="rounded-full bg-primary text-primary-foreground p-2 flex items-center justify-center w-10 h-10">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Insight Summary</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 md:rotate-0" />
                <div className="flex items-center gap-2 text-center">
                  <div className="rounded-full bg-primary text-primary-foreground p-2 flex items-center justify-center w-10 h-10">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Legacy Statement</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 md:rotate-0" />
                <div className="flex items-center gap-2 text-center">
                  <div className="rounded-full bg-secondary text-secondary-foreground p-2 flex items-center justify-center w-10 h-10">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="font-medium">1:1 Session</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<MessageCircle className="h-10 w-10 text-primary" />}
                title="Guided AI Conversation"
                description="Engage in a structured dialogue based on the Cognitive Edge Protocol™ to explore your challenges deeply."
              />
              <FeatureCard
                icon={<Sparkles className="h-10 w-10 text-primary" />}
                title="Personalized Insights"
                description="Receive an 'Insight Summary' with your reframed beliefs and legacy statement to solidify your progress."
              />
              <FeatureCard
                icon={<Brain className="h-10 w-10 text-primary" />}
                title="Reflective Growth"
                description="Track your clarity evolution with gentle check-in reminders designed to foster continuous self-awareness."
              />
            </div>
            
            {/* Privacy Note */}
            <div className="mt-12 max-w-2xl mx-auto">
              <Card className="bg-green-50 border-green-200 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800 font-headline text-lg flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    🔐 Your Privacy Matters
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-green-700 text-sm">
                  <p>
                    All AI conversations and sessions are fully encrypted. Only you can decrypt your data with your secure passphrase.<br />
                    <strong>No tracking. No third parties. No exceptions.</strong>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
             <Card className="overflow-hidden shadow-xl">
                <div className="p-8 md:p-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="font-headline text-3xl font-bold text-foreground sm:text-4xl">
                            Ready to Gain Clarity?
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Join CognitiveInsight today and start transforming your perspective. Our scientifically-backed protocol and supportive AI are here to help you find your path.
                        </p>
                        <div className="mt-8">
                          <SignupButton />
                        </div>
                    </div>
                </div>
            </Card>
          </div>
        </section>

        <section id="case-study" className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4">
            <CaseStudyCard />
          </div>
        </section>

        {/* Looking Ahead Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-green-50 to-blue-50 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-green-800 flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  🌱 Looking Ahead
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 text-green-700 space-y-4">
                <p>
                  CognitiveInsight is currently a <strong>solo-led platform</strong> — designed, delivered, and supported by me, James Greenwood.
                </p>
                <p>
                  As interest grows, I plan to <strong>build AI resources that are designed</strong> to help bring this protocol to larger communities, organizations, and leadership teams.
                </p>
                <p>
                  For now, all consulting is <strong>one-on-one</strong>, and handcrafted to serve your individual clarity journey.
                </p>
                <p className="text-sm italic border-t border-green-300 pt-4">
                  CognitiveInsight is part of the <strong>MyImaginaryFriends.ai</strong> vision — creating AI tools with soul, built for human growth and authentic connection.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
