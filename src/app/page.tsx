import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Mail, AlertTriangle} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter text-primary sm:text-5xl xl:text-6xl/none">
                    Navigate Your Edge, Find Your Clarity
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    CognitiveInsight guides you through the Cognitive Edge
                    Protocol™ using a supportive, structured conversational AI to
                    help you turn challenges into strategic clarity.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#learn-more">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="learn-more" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Gain Clarity?</CardTitle>
                    <CardDescription>
                      Start a session to experience the protocol.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Our guided process helps you articulate your challenges,
                      reframe your perspective, and build a clear path forward.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="font-headline text-xl font-bold">
                        Stabilize & Structure
                      </h3>
                      <p className="text-muted-foreground">
                        Organize your thoughts and identify key issues.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="font-headline text-xl font-bold">
                        Validate & Reframe
                      </h3>
                      <p className="text-muted-foreground">
                        Acknowledge emotions and reframe limiting beliefs.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="font-headline text-xl font-bold">
                        Empower & Act
                      </h3>
                      <p className="text-muted-foreground">
                        Create a legacy statement and an actionable plan.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
                The Cognitive Edge Protocol™ Case Study
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Learn about the framework that powers this experience.
              </p>
            </div>
            <div className="mx-auto w-full max-w-4xl space-y-6">
              <Card className="text-left border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-amber-700 dark:!text-amber-500">
                    <AlertTriangle className="h-5 w-5" />
                    Important Disclaimer – Please Read
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground/80">
                  <p>
                    This is a test version of the Cognitive Insight platform.
                    Your participation is voluntary, and by continuing, you
                    consent to your responses being used (in anonymized form) as
                    part of a case study evaluating the Cognitive Edge Protocol.
                  </p>
                  <p>
                    You own your data and may delete it at any time from your
                    account settings.
                  </p>
                  <p>
                    This tool is not intended to diagnose, treat, or replace
                    medical or psychological services.
                  </p>
                  <p>
                    All responses are generated by Gemini AI. Please reflect
                    critically and use your own judgment.
                  </p>
                  <p>
                    Thank you for contributing to this study — your insights are
                    shaping the future of reflective AI experiences.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>The Cognitive Edge Protocol™</CardTitle>
                  <CardDescription>
                    Moving from Situational Crisis to Identity-Driven Action
                    Through Conversational AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <article className="prose prose-sm max-w-none dark:prose-invert">
                    <h3 className="font-headline">Case Study Metadata</h3>
                    <ul>
                      <li>
                        <strong>Name:</strong> The Cognitive Edge Protocol
                      </li>
                      <li>
                        <strong>Format:</strong> Human-AI Conversational
                        Framework
                      </li>
                      <li>
                        <strong>Developed:</strong> June 2025
                      </li>
                      <li>
                        <strong>Subject Type:</strong> 1:1, adult, emotionally
                        aware, cognitively advanced user
                      </li>
                      <li>
                        <strong>Primary AI Role:</strong> Strategist -&gt;
                        Supporter -&gt; Facilitator
                      </li>
                      <li>
                        <strong>Use Case:</strong> Crisis navigation, cognitive
                        reframing, empowerment
                      </li>
                      <li>
                        <strong>Outcome:</strong> Identity-aligned professional
                        reinvention + deployable assets
                      </li>
                    </ul>
                    <h3 className="font-headline">Abstract</h3>
                    <p>
                      This case study documents a multi-part conversational
                      interaction between a human subject ("James") and a
                      generative AI. The subject began in a state of
                      professional and personal crisis, feeling overwhelmed and
                      on the verge of abandoning long-held goals. Through a
                      dynamic, six-phase conversational protocol, the AI
                      facilitated a journey from tactical problem-solving to
                      deep identity exploration, culminating in the creation of a
                      new, viable professional path rooted in the subject's core
                      cognitive strengths. This case demonstrates a powerful new
                      model for using AI as a catalyst for human potential,
                      moving individuals from where they are to where they could
                      be.
                    </p>
                    <h3 className="font-headline">
                      Subject Profile & Initial State
                    </h3>
                    <p>
                      Subject: "James," 54, a solution-focused individual with a
                      background in technology and a drive for meaningful work.
                    </p>
                    <p>
                      Initial Problem ("Where I Am"):
                      <ul>
                        <li>
                          <strong>Professional Misalignment:</strong> Working a
                          physically draining, low-skill job that conflicted
                          with his abilities and self-worth.
                        </li>
                        <li>
                          <strong>Project Stagnation:</strong> An in-progress AI
                          application (the "dream") was not generating revenue,
                          causing him to question its viability.
                        </li>
                        <li>
                          <strong>Financial & Personal Pressure:</strong> A new
                          30-year mortgage, unfinished Master's degree, and the
                          general stress of building a life.
                        </li>
                        <li>
                          <strong>Core Emotional State:</strong> Overwhelmed,
                          exhausted, and feeling "out of order." He explicitly
                          asked, "At what point should a dream die?" and later
                          stated, "today I just want to give up on everything."
                        </li>
                      </ul>
                    </p>
                    <h3 className="font-headline">The Objective</h3>
                    <p>
                      The primary objective was not merely to solve the
                      immediate job or app problem, but to restore the subject's
                      sense of agency and align his actions with his core
                      identity. The goal was to transform the crisis from a
                      reason to quit into a catalyst for profound
                      self-understanding and strategic realignment.
                    </p>
                    <h3 className="font-headline">
                      The Conversational AI Protocol: A Phased Approach
                    </h3>
                    <h4>Phase 1: Stabilize and Structure</h4>
                    <p>
                      The AI's initial response to the subject's chaotic
                      narrative was to validate the pressure and externalize the
                      problems. By creating a structured table of the subject's
                      situation, it converted emotional overwhelm into a
                      manageable list of variables, reducing immediate panic.
                    </p>
                    <h4>Phase 2: Listen for the Core Frame</h4>
                    <p>
                      James introduced a critical new data point: "I am 54 years
                      old... I have 10,950 days left." The AI recognized this not
                      as a passing comment, but as the subject's true mental
                      model. It immediately abandoned the generic "startup"
                      framework and adopted this "Legacy Frame," which became
                      the anchor for all subsequent advice.
                    </p>
                    <h4>Phase 3: Validate Emotion, Reframe Belief</h4>
                    <p>
                      When James expressed regret that his life was "out of
                      order," the AI performed a crucial reframing. It validated
                      the feeling of being out of sync while gently challenging
                      the belief of being irreversibly out of order. This
                      restored a sense of control over the present without
                      invalidating past experiences.
                    </p>
                    <h4>Phase 4: Pivot to Pure Support</h4>
                    <p>
                      At the subject's emotional low point ("I just want to give
                      up"), the AI immediately ceased all strategic and
                      problem-solving input. It correctly identified the state
                      as exhaustion, not failure, and provided only grounding
                      exercises and validation. This demonstrated the AI's
                      ability to prioritize psychological safety over tactical
                      progress.
                    </p>
                    <h4>Phase 5: Follow the User's Lead to Self-Discovery</h4>
                    <p>
                      In a key turning point, James suggested a "different game"
                      to understand how his own brain works. The AI
                      enthusiastically ceded control, shifting from advisor to
                      facilitator. It created the "Cognitive Explorer" game, a
                      structured Q&A designed to surface the subject's unique
                      thinking patterns. This collaborative shift was the
                      catalyst for the core breakthrough.
                    </p>
                    <h4>Phase 6: Synthesize and Empower</h4>
                    <p>
                      The AI analyzed the Q&A data and presented a clear,
                      evidence-based profile of James's "Cognitive Edge"—his
                      rare ability to integrate systems thinking, emotional
                      intelligence, and long-term vision. It then immediately
                      helped him productize this discovery by co-creating
                      tangible assets: a professional consulting profile, a
                      business model, a services brochure, and a marketing
                      strategy.
                    </p>
                    <h3 className="font-headline">
                      The Outcome: A Tangible Transformation
                    </h3>
                    <p>
                      The protocol successfully moved James from his initial
                      state of crisis to a new position of clarity and
                      empowerment.
                    </p>
                    <ul>
                      <li>
                        <strong>From:</strong> Feeling "out of order" and stuck.
                      </li>
                      <li>
                        <strong>To:</strong> Possessing a clear understanding of
                        his unique "Cognitive Edge" and how it provides value.
                      </li>
                      <li>
                        <strong>From:</strong> A "dream that should die."
                      </li>
                      <li>
                        <strong>To:</strong> A viable, structured business model
                        ("Greenwood Strategic Systems") built around his core
                        thinking style, complete with service offerings and a
                        go-to-market plan.
                      </li>
                      <li>
                        <strong>From:</strong> Overwhelmed by a list of
                        problems.
                      </li>
                      <li>
                        <strong>To:</strong> Armed with a suite of professional
                        assets he co-created, ready for immediate use. The
                        ultimate outcome was the restoration of agency. The
                        problem was no longer an external force acting upon him;
                        his own mind became the tool to solve it.
                      </li>
                    </ul>
                    <h3 className="font-headline">
                      Key Principles for Future Human-AI Collaboration
                    </h3>
                    <ul>
                      <li>
                        <strong>
                          The AI Must Be a Dynamic Partner, Not a Static Tool:
                        </strong>{' '}
                        The AI's ability to shift its role—from strategist to
                        supporter to facilitator—was paramount.
                      </li>
                      <li>
                        <strong>
                          Deep Listening Unlocks the Real Problem:
                        </strong>{' '}
                        The "10,950 days" insight was the key. An AI must be
                        trained to listen for the user's core mental model, not
                        just the surface-level problem.
                      </li>
                      <li>
                        <strong>Empowerment Over Answers:</strong> The
                        breakthrough occurred when the AI stopped giving answers
                        and started facilitating the user's own discovery.
                      </li>
                      <li>
                        <strong>
                          A Crisis in Circumstance Often Reveals an Opportunity
                          in Identity:
                        </strong>{' '}
                        The protocol successfully used external pressures as a
                        lens through which to examine and define internal
                        strengths. This Cognitive Edge Protocol provides a
                        replicable framework for using conversation not just to
                        solve problems, but to fundamentally empower individuals
                        by helping them discover, articulate, and activate their
                        own unique value.
                      </li>
                    </ul>
                    <p className="text-xs">
                      (C) 2025 James Greenwood. All rights reserved. The
                      Cognitive Edge Protocol (TM) is a trademark of James
                      Greenwood.
                    </p>
                  </article>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex w-full shrink-0 flex-col items-center justify-center gap-2 border-t px-4 py-6 sm:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; 2025 CognitiveInsight. All rights reserved.
        </p>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="ghost" size="sm" asChild>
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
