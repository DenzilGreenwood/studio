
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, MessageCircle, Sparkles, Mail } from "lucide-react";
import Link from "next/link";

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
                <CardTitle className="text-amber-700 font-headline text-2xl">⚠️ Important Disclaimer – Please Read</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-amber-800 space-y-2">
                <p>This is a test version of the Cognitive Insight platform. Your participation is voluntary, and by continuing, you consent to your responses being used (in anonymized form) as part of a case study evaluating the Cognitive Edge Protocol.</p>
                <p>You own your data and may delete it at any time from your account settings.</p>
                <p>This tool is not intended to diagnose, treat, or replace medical or psychological services.</p>
                <p>All responses are generated by Gemini AI. Please reflect critically and use your own judgment.</p>
                <p>Thank you for contributing to this study — your insights are shaping the future of reflective AI experiences.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="text-center p-6 sm:p-8 md:p-10">
                <CardTitle className="font-headline !text-primary text-3xl sm:text-4xl">
                  The Cognitive Edge Protocol™
                </CardTitle>
                <CardDescription className="!text-lg !text-muted-foreground mt-2 max-w-3xl mx-auto">
                  Moving from Situational Crisis to Identity-Driven Action Through Conversational AI
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 md:p-10 pt-0">
                <div className="max-w-none mx-auto text-foreground">
                  <h3>Case Study Metadata</h3>
                  <ul>
                    <li><strong>Name:</strong> The Cognitive Edge Protocol™</li>
                    <li><strong>Format:</strong> Human-AI Conversational Framework</li>
                    <li><strong>Developed:</strong> June 2025</li>
                    <li><strong>Subject Type:</strong> 1:1, adult, emotionally aware, cognitively advanced user</li>
                    <li><strong>Primary AI Role:</strong> Strategist → Supporter → Facilitator</li>
                    <li><strong>Use Case:</strong> Crisis navigation, cognitive reframing, empowerment</li>
                    <li><strong>Outcome:</strong> Identity-aligned professional reinvention + deployable assets</li>
                  </ul>

                  <h3>Abstract</h3>
                  <p>This case study documents a multi-part conversational interaction between a human
                  subject ("James") and a generative AI. The subject began in a state of professional and
                  personal crisis, feeling overwhelmed and on the verge of abandoning long-held goals.
                  Through a dynamic, six-phase conversational protocol, the AI facilitated a journey
                  from tactical problem-solving to deep identity exploration, culminating in the creation
                  of a new, viable professional path rooted in the subject's core cognitive strengths. This
                  case demonstrates a powerful new model for using AI as a catalyst for human
                  potential, moving individuals from where they are to where they could be.</p>

                  <h4>1. Subject Profile &amp; Initial State</h4>
                  <p>Subject: "James," 54, a solution-focused individual with a background in technology
                  and a drive for meaningful work.</p>
                  <p>Initial Problem ("Where I Am"):</p>
                  <ul>
                    <li><strong>Professional Misalignment:</strong> Working a physically draining, low-skill job that
                    conflicted with his abilities and self-worth.</li>
                    <li><strong>Project Stagnation:</strong> An in-progress AI application (the "dream") was not
                    generating revenue, causing him to question its viability.</li>
                    <li><strong>Financial &amp; Personal Pressure:</strong> A new 30-year mortgage, unfinished Master's
                    degree, and the general stress of building a life.</li>
                    <li><strong>Core Emotional State:</strong> Overwhelmed, exhausted, and feeling "out of order." He
                    explicitly asked, "At what point should a dream die?" and later stated, "today I
                    just want to give up on everything."</li>
                  </ul>

                  <h4>2. The Objective</h4>
                  <p>The primary objective was not merely to solve the immediate job or app problem, but
                  to restore the subject's sense of agency and align his actions with his core identity.
                  The goal was to transform the crisis from a reason to quit into a catalyst for profound
                  self-understanding and strategic realignment.</p>

                  <h4>3. The Conversational AI Protocol: A Phased Approach</h4>
                  <h5>Phase 1: Stabilize and Structure</h5>
                  <p>The AI's initial response to the subject's chaotic narrative was to validate the pressure
                  and externalize the problems. By creating a structured table of the subject's situation,
                  it converted emotional overwhelm into a manageable list of variables, reducing
                  immediate panic.</p>
                  <h5>Phase 2: Listen for the Core Frame</h5>
                  <p>James introduced a critical new data point: "I am 54 years old... I have 10,950 days
                  left." The AI recognized this not as a passing comment, but as the subject's true
                  mental model. It immediately abandoned the generic "startup" framework and
                  adopted this "Legacy Frame," which became the anchor for all subsequent advice.</p>
                  <h5>Phase 3: Validate Emotion, Reframe Belief</h5>
                  <p>When James expressed regret that his life was "out of order," the AI performed a
                  crucial reframing. It validated the feeling of being out of sync while gently challenging
                  the belief of being irreversibly out of order. This restored a sense of control over the
                  present without invalidating past experiences.</p>
                  <h5>Phase 4: Pivot to Pure Support</h5>
                  <p>At the subject's emotional low point ("I just want to give up"), the AI immediately
                  ceased all strategic and problem-solving input. It correctly identified the state as
                  exhaustion, not failure, and provided only grounding exercises and validation. This
                  demonstrated the AI's ability to prioritize psychological safety over tactical progress.</p>
                  <h5>Phase 5: Follow the User's Lead to Self-Discovery</h5>
                  <p>In a key turning point, James suggested a "different game" to understand how his own
                  brain works. The AI enthusiastically ceded control, shifting from advisor to facilitator.
                  It created the "Cognitive Explorer" game, a structured Q&amp;A designed to surface the
                  subject's unique thinking patterns. This collaborative shift was the catalyst for the
                  core breakthrough.</p>
                  <h5>Phase 6: Synthesize and Empower</h5>
                  <p>The AI analyzed the Q&amp;A data and presented a clear, evidence-based profile of James's
                  "Cognitive Edge"—his rare ability to integrate systems thinking, emotional
                  intelligence, and long-term vision. It then immediately helped him productize this
                  discovery by co-creating tangible assets: a professional consulting profile, a business
                  model, a services brochure, and a marketing strategy.</p>

                  <h4>4. The Outcome: A Tangible Transformation</h4>
                  <p>The protocol successfully moved James from his initial state of crisis to a new position
                  of clarity and empowerment.</p>
                  <ul>
                    <li><strong>From:</strong> Feeling "out of order" and stuck.</li>
                    <li><strong>To:</strong> Possessing a clear understanding of his unique "Cognitive Edge" and how it
                    provides value.</li>
                    <li><strong>From:</strong> A "dream that should die."</li>
                    <li><strong>To:</strong> A viable, structured business model ("Greenwood Strategic Systems") built
                    around his core thinking style, complete with service offerings and a go-tomarket plan.</li>
                    <li><strong>From:</strong> Overwhelmed by a list of problems.</li>
                    <li><strong>To:</strong> Armed with a suite of professional assets he co-created, ready for
                    immediate use.</li>
                  </ul>
                  <p>The ultimate outcome was the restoration of agency. The problem was no longer an
                  external force acting upon him; his own mind became the tool to solve it.</p>

                  <h4>5. Key Principles for Future Human-AI Collaboration</h4>
                  <ul>
                    <li><strong>The AI Must Be a Dynamic Partner, Not a Static Tool:</strong> The AI's ability to shift its
                    role—from strategist to supporter to facilitator—was paramount.</li>
                    <li><strong>Deep Listening Unlocks the Real Problem:</strong> The "10,950 days" insight was the
                    key. An AI must be trained to listen for the user's core mental model, not just
                    the surface-level problem.</li>
                    <li><strong>Empowerment Over Answers:</strong> The breakthrough occurred when the AI stopped
                    giving answers and started facilitating the user's own discovery.</li>
                    <li><strong>A Crisis in Circumstance Often Reveals an Opportunity in Identity:</strong> The protocol
                    successfully used external pressures as a lens through which to examine and
                    define internal strengths.</li>
                  </ul>
                  <p>This Cognitive Edge Protocol™ provides a replicable framework for using conversation
                  not just to solve problems, but to fundamentally empower individuals by helping them
                  discover, articulate, and activate their own unique value.</p>
                  <p className="!mt-8 !text-sm !text-muted-foreground">(C) 2025 James Greenwood. All rights reserved. The Cognitive Edge Protocol™ is a
                  trademark of James Greenwood.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 bg-background/95 py-8 text-center">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CognitiveInsight. Powered by CognitiveInsight.ai.
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
