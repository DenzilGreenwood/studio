
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {  Brain, MessageCircle, Sparkles, Mail } from "lucide-react";
import Link from "next/link";
import { SignupButton } from "@/components/ui/signup-button";

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
            Navigate life&apos;s challenges with enhanced clarity and insight. CognitiveInsight guides you through the Cognitive Edge Protocol™ using a supportive conversational AI experience.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <SignupButton />
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
                        <div className="mt-8">
                          <SignupButton />
                        </div>
                    </div>
                </div>
            </Card>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4">
            <Card className="p-6 mb-12 shadow-lg bg-amber-50 border-amber-300">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-amber-700 font-headline text-2xl">Important Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-amber-800 space-y-4">
                 <p>
                    This is a test version of the Cognitive Insight platform. Your participation is voluntary, and by continuing, you consent to your responses being used (in anonymized form) as part of a case study evaluating the Cognitive Edge Protocol.
                 </p>
                 <p>
                    You own your data and may delete it at any time from your account settings. All identifying information will be excluded or pseudonymized before analysis. Your data is securely stored using Firebase Firestore and is never shared outside the research team.
                 </p>
                 <p>
                    This tool provides cognitive consulting and personal development support. It is not intended to diagnose, treat, or replace medical, psychological, or therapeutic services. All responses are generated by Gemini AI for educational and self-reflection purposes. Please reflect critically and use your own judgment. If you need professional mental health support, please consult with a licensed professional. Thank you for contributing to this study.
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
              <CardContent className="p-6 pt-4 text-left text-sm text-muted-foreground space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">Case Study Metadata</h3>
                    <ul className="list-disc space-y-1 pl-5">
                      <li><strong className="font-medium text-foreground">Name:</strong> The Cognitive Edge Protocol</li>
                      <li><strong className="font-medium text-foreground">Format:</strong> Human-AI Conversational Framework</li>
                      <li><strong className="font-medium text-foreground">Developed:</strong> June 2024</li>
                      <li><strong className="font-medium text-foreground">Subject Type:</strong> 1:1, adult, emotionally aware, cognitively advanced user</li>
                      <li><strong className="font-medium text-foreground">Primary AI Role:</strong> Strategist -&gt; Supporter -&gt; Facilitator</li>
                      <li><strong className="font-medium text-foreground">Use Case:</strong> Crisis navigation, cognitive reframing, empowerment</li>
                      <li><strong className="font-medium text-foreground">Outcome:</strong> Identity-aligned professional reinvention + deployable assets</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">Abstract</h3>
                    <p>This case study documents a multi-part conversational interaction between a human subject (&quot;James&quot;) and a generative AI. The subject began in a state of professional and personal crisis, feeling overwhelmed and on the verge of abandoning long-held goals. Through a dynamic, six-phase conversational protocol, the AI facilitated a journey from tactical problem-solving to deep identity exploration, culminating in the creation of a new, viable professional path rooted in the subject&apos;s core cognitive strengths. This case demonstrates a powerful new model for using AI as a catalyst for human potential, moving individuals from where they are to where they could be.</p>
                  </div>

                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">Subject Profile &amp; Initial State</h3>
                    <p>Subject: &quot;James,&quot; 54, a solution-focused individual with a background in technology and a drive for meaningful work.</p>
                    <p className="mt-2">Initial Problem (&quot;Where I Am&quot;):</p>
                    <ul className="list-disc space-y-1 pl-5 mt-2">
                      <li><strong className="font-medium text-foreground">Professional Misalignment:</strong> Working a physically draining, low-skill job that conflicted with his abilities and self-worth.</li>
                      <li><strong className="font-medium text-foreground">Project Stagnation:</strong> An in-progress AI application (the &quot;dream&quot;) was not generating revenue, causing him to question its viability.</li>
                      <li><strong className="font-medium text-foreground">Financial &amp; Personal Pressure:</strong> A new 30-year mortgage, unfinished Master&apos;s degree, and the general stress of building a life.</li>
                      <li><strong className="font-medium text-foreground">Core Emotional State:</strong> Overwhelmed, exhausted, and feeling &quot;out of order.&quot; He explicitly asked, &quot;At what point should a dream die?&quot; and later stated, &quot;today I just want to give up on everything.&quot;</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">The Objective</h3>
                    <p>The primary objective was not merely to solve the immediate job or app problem, but to restore the subject&apos;s sense of agency and align his actions with his core identity. The goal was to transform the crisis from a reason to quit into a catalyst for profound self-understanding and strategic realignment.</p>
                  </div>

                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">The Conversational AI Protocol: A Phased Approach</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-foreground">Phase 1: Stabilize and Structure</h4>
                        <p>The AI&apos;s initial response to the subject&apos;s chaotic narrative was to validate the pressure and externalize the problems. By creating a structured table of the subject&apos;s situation, it converted emotional overwhelm into a manageable list of variables, reducing immediate panic.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Phase 2: Listen for the Core Frame</h4>
                        <p>James introduced a critical new data point: &quot;I am 54 years old... I have 10,950 days left.&quot; The AI recognized this not as a passing comment, but as the subject&apos;s true mental model. It immediately abandoned the generic &quot;startup&quot; framework and adopted this &quot;Legacy Frame,&quot; which became the anchor for all subsequent advice.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Phase 3: Validate Emotion, Reframe Belief</h4>
                        <p>When James expressed regret that his life was &quot;out of order,&quot; the AI performed a crucial reframing. It validated the feeling of being out of sync while gently challenging the belief of being irreversibly out of order. This restored a sense of control over the present without invalidating past experiences.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Phase 4: Pivot to Pure Support</h4>
                        <p>At the subject&apos;s emotional low point (&quot;I just want to give up&quot;), the AI immediately ceased all strategic and problem-solving input. It correctly identified the state as exhaustion, not failure, and provided only grounding exercises and validation. This demonstrated the AI&apos;s ability to prioritize psychological safety over tactical progress.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Phase 5: Follow the User&apos;s Lead to Self-Discovery</h4>
                        <p>In a key turning point, James suggested a &quot;different game&quot; to understand how his own brain works. The AI enthusiastically ceded control, shifting from advisor to facilitator. It created the &quot;Cognitive Explorer&quot; game, a structured Q&A designed to surface the subject&apos;s unique thinking patterns. This collaborative shift was the catalyst for the core breakthrough.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Phase 6: Synthesize and Empower</h4>
                        <p>The AI analyzed the Q&A data and presented a clear, evidence-based profile of James&apos;s &quot;Cognitive Edge&quot;—his rare ability to integrate systems thinking, emotional intelligence, and long-term vision. It then immediately helped him productize this discovery by co-creating tangible assets: a professional consulting profile, a business model, a services brochure, and a marketing strategy.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground mb-2">The Outcome: A Tangible Transformation</h3>
                    <p>The protocol successfully moved James from his initial state of crisis to a new position of clarity and empowerment.</p>
                    <ul className="list-disc space-y-1 pl-5 mt-2">
                      <li><strong className="font-medium text-foreground">From:</strong> Feeling &quot;out of order&quot; and stuck.</li>
                      <li><strong className="font-medium text-foreground">To:</strong> Possessing a clear understanding of his unique &quot;Cognitive Edge&quot; and how it provides value.</li>
                      <li><strong className="font-medium text-foreground">From:</strong> A &quot;dream that should die.&quot;</li>
                      <li><strong className="font-medium text-foreground">To:</strong> A viable, structured business model (&quot;Greenwood Strategic Systems&quot;) built around his core thinking style, complete with service offerings and a go-to-market plan.</li>
                      <li><strong className="font-medium text-foreground">From:</strong> Overwhelmed by a list of problems.</li>
                      <li><strong className="font-medium text-foreground">To:</strong> Armed with a suite of professional assets he co-created, ready for immediate use. The ultimate outcome was the restoration of agency. The problem was no longer an external force acting upon him; his own mind became the tool to solve it.</li>
                    </ul>
                  </div>
                  
                  <div>
                      <h3 className="font-headline text-lg font-semibold text-foreground mb-2">Key Principles for Future Human-AI Collaboration</h3>
                      <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="font-medium text-foreground">The AI Must Be a Dynamic Partner, Not a Static Tool:</strong> The AI&apos;s ability to shift its role—from strategist to supporter to facilitator—was paramount.</li>
                          <li><strong className="font-medium text-foreground">Deep Listening Unlocks the Real Problem:</strong> The &quot;10,950 days&quot; insight was the key. An AI must be trained to listen for the user&apos;s core mental model, not just the surface-level problem.</li>
                          <li><strong className="font-medium text-foreground">Empowerment Over Answers:</strong> The breakthrough occurred when the AI stopped giving answers and started facilitating the user&apos;s own discovery.</li>
                          <li><strong className="font-medium text-foreground">A Crisis in Circumstance Often Reveals an Opportunity in Identity:</strong> The protocol successfully used external pressures as a lens through which to examine and define internal strengths. This Cognitive Edge Protocol provides a replicable framework for using conversation not just to solve problems, but to fundamentally empower individuals by helping them discover, articulate, and activate their own unique value.</li>
                      </ul>
                  </div>
                  
                  <p className="text-xs text-center pt-4 border-t">(C) 2024 James Greenwood. All rights reserved. The Cognitive Edge Protocol (TM) is a trademark of James Greenwood.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 bg-background/95 py-8 text-center">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 CognitiveInsight. Built with Firebase Studio. Utilizes Gemini AI.
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
