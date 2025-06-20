
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, MessageCircle, Sparkles, Mail } from "lucide-react";
import Link from "next/link";

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
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-16 text-center md:py-24 lg:py-32">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Unlock Your <span className="text-primary">Cognitive Edge</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Navigate life's challenges with enhanced clarity and insight. CognitiveInsight guides you through the Cognitive Edge Protocol™ using a supportive conversational AI experience.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
              <Link href="/signup">
                Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="shadow-lg transition-transform hover:scale-105">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>
        
        <section id="features" className="bg-background/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-3xl font-bold text-center text-foreground mb-12 sm:text-4xl">
              How CognitiveInsight Empowers You
            </h2>
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
                        <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                            <Link href="/signup">
                                Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4">
            <Card className="p-6 mb-12 shadow-lg bg-amber-50 border-amber-300">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-amber-700 font-headline text-2xl">Important Disclaimer – Please Read</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-amber-800">
                 <p>
                    This is a test version of the Cognitive Insight platform. Your participation is voluntary, and by continuing, you consent to your responses being used (in anonymized form) as part of a case study evaluating the Cognitive Edge Protocol.
                    <br /><br />
                    You own your data and may delete it at any time from your account settings.
                    <br /><br />
                    This tool is not intended to diagnose, treat, or replace medical or psychological services.
                    <br /><br />
                    All responses are generated by Gemini AI. Please reflect critically and use your own judgment.
                    <br /><br />
                    Thank you for contributing to this study — your insights are shaping the future of reflective AI experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="text-center p-6 sm:p-8 md:p-10">
                <CardTitle className="font-headline text-primary text-3xl sm:text-4xl">
                  The Cognitive Edge Protocol™
                </CardTitle>
                <CardDescription className="!text-lg !text-muted-foreground mt-2 max-w-3xl mx-auto">
                  Moving from Situational Crisis to Identity-Driven Action Through Conversational AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  The full case study and details about the protocol are available within the app after signing up.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 bg-background/95 py-8 text-center">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 CognitiveInsight. Powered by CognitiveInsight.ai.
          </p>
          <Button variant="outline" asChild size="sm">
            <a href="mailto:founder@cognitiveinsight.ai">
              <Mail className="mr-2 h-4 w-4" />
              Contact the Founder
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
