'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Users, 
  Shield, 
  LineChart, 
  MessageCircle,
  FileText,
  Network,
  Sparkles,
  Target,
  Zap,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
}

function ProcessStep({ step, title, description, icon, features, color }: ProcessStepProps) {
  return (
    <div className="relative">
      <div className="flex items-start gap-6">
        <div className={`flex-shrink-0 w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-lg`}>
          <div className="text-white font-bold text-xl">{step}</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {icon}
            <h3 className="text-2xl font-headline font-semibold">{title}</h3>
          </div>
          <p className="text-muted-foreground text-lg mb-4">{description}</p>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {step < 5 && (
        <div className="absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-muted-foreground/50 to-transparent"></div>
      )}
    </div>
  );
}

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
}

function ToolCard({ icon, title, description, features, color }: ToolCardProps) {
  return (
    <Card className="transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-headline">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ProtocolOverviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-semibold text-primary">CognitiveInsight</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button size="lg" asChild className="shadow-lg">
              <Link href="/signup">
                Start Your Journey <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                Cognitive Edge Protocol™
              </Badge>
              <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                How It Works
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                A comprehensive system designed to enhance cognitive clarity, emotional intelligence, and personal growth through structured protocols and AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="shadow-lg">
                  <Link href="#process">View Process</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="shadow-lg">
                  <Link href="#tools">Explore Tools</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Scientific Foundation */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-8">
                Built on Scientific Principles
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-center">
                  <CardHeader>
                    <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-xl">Cognitive Psychology</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Based on proven cognitive behavioral techniques and neuroplasticity research.
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <LineChart className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-xl">Data-Driven</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Continuous measurement and analysis of progress through validated metrics.
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-xl">Privacy-First</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Zero-knowledge encryption ensures your data remains completely private.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Process Overview */}
        <section id="process" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
                The 5-Stage Process
              </h2>
              <div className="space-y-12">
                <ProcessStep
                  step={1}
                  title="Initial Assessment"
                  description="Begin with a comprehensive evaluation of your current cognitive patterns, emotional state, and personal goals."
                  icon={<Target className="h-6 w-6 text-primary" />}
                  features={["Baseline measurement", "Goal setting", "Personalized protocol", "Privacy setup"]}
                  color="bg-gradient-to-r from-blue-500 to-blue-600"
                />
                <ProcessStep
                  step={2}
                  title="Guided Sessions"
                  description="Engage in structured conversations with our AI companion that adapts to your unique needs and learning style."
                  icon={<MessageCircle className="h-6 w-6 text-primary" />}
                  features={["AI-guided conversations", "Adaptive questioning", "Real-time feedback", "Progress tracking"]}
                  color="bg-gradient-to-r from-green-500 to-green-600"
                />
                <ProcessStep
                  step={3}
                  title="Clarity Mapping"
                  description="Visualize your thoughts and insights using our proprietary Clarity Map™ tool to identify patterns and connections."
                  icon={<Network className="h-6 w-6 text-primary" />}
                  features={["Visual mind mapping", "Pattern recognition", "Insight connections", "Export capabilities"]}
                  color="bg-gradient-to-r from-purple-500 to-purple-600"
                />
                <ProcessStep
                  step={4}
                  title="Insight Generation"
                  description="Generate comprehensive reports using our Insight Report™ system powered by advanced AI analysis."
                  icon={<FileText className="h-6 w-6 text-primary" />}
                  features={["AI-powered analysis", "Personalized reports", "Growth recommendations", "PDF export"]}
                  color="bg-gradient-to-r from-orange-500 to-orange-600"
                />
                <ProcessStep
                  step={5}
                  title="Continuous Growth"
                  description="Track your progress over time and adapt your approach based on measurable improvements and new insights."
                  icon={<Sparkles className="h-6 w-6 text-primary" />}
                  features={["Progress analytics", "Adaptive protocols", "Long-term tracking", "Goal refinement"]}
                  color="bg-gradient-to-r from-red-500 to-red-600"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tools & Technology */}
        <section id="tools" className="py-16 bg-gradient-to-br from-secondary/10 to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
                Powerful Tools & Technology
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ToolCard
                  icon={<MessageCircle className="h-6 w-6 text-white" />}
                  title="AI Companion"
                  description="Your personal guide through the cognitive development process"
                  features={[
                    "Natural conversation flow",
                    "Adaptive questioning",
                    "Real-time insights",
                    "24/7 availability"
                  ]}
                  color="bg-gradient-to-r from-blue-500 to-blue-600"
                />
                <ToolCard
                  icon={<Network className="h-6 w-6 text-white" />}
                  title="Clarity Map™"
                  description="Visual mind mapping tool for organizing thoughts and insights"
                  features={[
                    "Drag-and-drop interface",
                    "Connection mapping",
                    "Auto-layout algorithms",
                    "Export as images"
                  ]}
                  color="bg-gradient-to-r from-purple-500 to-purple-600"
                />
                <ToolCard
                  icon={<FileText className="h-6 w-6 text-white" />}
                  title="Insight Report™"
                  description="AI-generated comprehensive analysis and recommendations"
                  features={[
                    "Rich text editor",
                    "AI content generation",
                    "Timeline views",
                    "PDF export"
                  ]}
                  color="bg-gradient-to-r from-orange-500 to-orange-600"
                />
                <ToolCard
                  icon={<LineChart className="h-6 w-6 text-white" />}
                  title="Progress Analytics"
                  description="Track your growth with detailed metrics and visualizations"
                  features={[
                    "Growth tracking",
                    "Trend analysis",
                    "Performance metrics",
                    "Goal achievement"
                  ]}
                  color="bg-gradient-to-r from-green-500 to-green-600"
                />
                <ToolCard
                  icon={<Shield className="h-6 w-6 text-white" />}
                  title="Privacy Protection"
                  description="Zero-knowledge encryption keeps your data completely private"
                  features={[
                    "Client-side encryption",
                    "Zero-knowledge architecture",
                    "Secure data storage",
                    "Privacy by design"
                  ]}
                  color="bg-gradient-to-r from-red-500 to-red-600"
                />
                <ToolCard
                  icon={<Zap className="h-6 w-6 text-white" />}
                  title="Integration Hub"
                  description="Seamlessly connect all aspects of your cognitive development"
                  features={[
                    "Unified dashboard",
                    "Cross-tool insights",
                    "Data synchronization",
                    "Workflow automation"
                  ]}
                  color="bg-gradient-to-r from-indigo-500 to-indigo-600"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Session Structure */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
                What to Expect in a Session
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <Clock className="h-8 w-8 text-primary mb-4" />
                    <CardTitle className="text-xl">Session Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Sessions typically last 30-60 minutes, allowing for deep exploration without overwhelming cognitive load.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Flexible scheduling
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Self-paced progression
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Pause and resume anytime
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Users className="h-8 w-8 text-primary mb-4" />
                    <CardTitle className="text-xl">Personalized Approach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Every session adapts to your unique cognitive style, emotional state, and personal goals.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Adaptive questioning
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Custom protocols
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Individual pacing
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
                Ready to Begin Your Journey?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands who have already discovered the power of structured cognitive development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="shadow-lg">
                  <Link href="/signup">
                    Start Your Journey <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="shadow-lg">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
