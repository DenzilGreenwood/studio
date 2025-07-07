// src/components/protocol/clarity-summary.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Lightbulb, Milestone, Bot, User, Eye } from "lucide-react"; 
import type { ClaritySummaryOutput } from "@/types"; 

interface KeyInteraction {
  aiQuestion: string;
  userResponse: string;
}

interface ClaritySummaryProps {
  summaryData: ClaritySummaryOutput & {
    actualReframedBelief: string;
    reframedBeliefInteraction?: KeyInteraction | null; 
    actualLegacyStatement: string;
    legacyStatementInteraction?: KeyInteraction | null; 
    topEmotions: string; 
  };
  sessionId: string;
}

export function ClaritySummary({ summaryData, sessionId }: ClaritySummaryProps) {
  if (!summaryData) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-headline">Generating Summary...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your insights are being compiled. Please wait a moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-2xl text-primary">Your Insight Summary</CardTitle>
            <CardDescription>A snapshot of your journey through the Cognitive Edge Protocol.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-headline text-lg font-semibold text-foreground mb-2 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-accent" />
            Reframed Belief
          </h3>
          {summaryData.reframedBeliefInteraction && (
            <div className="mt-1 mb-3 p-3 bg-muted/30 rounded-md border border-dashed border-border">
              <p className="text-xs text-foreground/90 mb-1 font-medium flex items-center">
                <Bot className="h-4 w-4 mr-2 text-accent" />
                AI&#39;s Question:
              </p>
              <p className="text-sm text-muted-foreground italic">&ldquo;{summaryData.reframedBeliefInteraction.aiQuestion}&rdquo;</p>
              <p className="text-xs text-foreground/90 mt-3 mb-1 font-medium flex items-center">
                <User className="h-4 w-4 mr-2 text-primary" />
                Your Answer:
              </p>
              <p className="text-sm text-muted-foreground italic">&ldquo;{summaryData.reframedBeliefInteraction.userResponse}&rdquo;</p>
            </div>
          )}
          <p className="text-muted-foreground bg-background p-3 rounded-md border"><strong className="text-primary">Final Belief:</strong> {summaryData.actualReframedBelief}</p>
        </div>

        <div>
          <h3 className="font-headline text-lg font-semibold text-foreground mb-2 flex items-center">
            <Milestone className="h-5 w-5 mr-2 text-accent" />
            Legacy Statement
          </h3>
           {summaryData.legacyStatementInteraction && (
            <div className="mt-1 mb-3 p-3 bg-muted/30 rounded-md border border-dashed border-border">
              <p className="text-xs text-foreground/90 mb-1 font-medium flex items-center">
                <Bot className="h-4 w-4 mr-2 text-accent" />
                AI&apos;s Question:
              </p>
              <p className="text-sm text-muted-foreground italic">&ldquo;{summaryData.legacyStatementInteraction.aiQuestion}&rdquo;</p>
              <p className="text-xs text-foreground/90 mt-3 mb-1 font-medium flex items-center">
                <User className="h-4 w-4 mr-2 text-primary" />
                Your Answer:
              </p>
              <p className="text-sm text-muted-foreground italic">&ldquo;{summaryData.legacyStatementInteraction.userResponse}&rdquo;</p>
            </div>
          )}
          <p className="text-muted-foreground bg-background p-3 rounded-md border"><strong className="text-primary">Final Statement:</strong> {summaryData.actualLegacyStatement}</p>
        </div>
        
        {summaryData.topEmotions && (
             <div>
                <h3 className="font-headline text-lg font-semibold text-foreground mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                    Top Emotions
                </h3>
                <p className="text-muted-foreground bg-background p-3 rounded-md border">{summaryData.topEmotions}</p>
            </div>
        )}

        {summaryData.insightSummary && (
            <div className="pt-4 border-t">
                <h3 className="font-headline text-lg font-semibold text-foreground mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 0-1.5-.67-1.5-1.5V8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5z"/></svg>
                    AI Generated Summary
                </h3>
                <p className="text-muted-foreground bg-background p-3 rounded-md border whitespace-pre-line">
                    {summaryData.insightSummary}
                </p>
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={`/session-report/${sessionId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Full Report
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
