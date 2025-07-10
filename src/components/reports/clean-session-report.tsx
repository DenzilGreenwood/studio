// src/components/reports/clean-session-report.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { CleanSessionReport } from '@/types/clean-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, RefreshCw, Lightbulb, Target, Heart, TrendingUp, CheckCircle, Star, ArrowRight, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCleanReport, generateCleanReport, generateCleanPdf } from '@/lib/firebase-functions-client';

interface CleanSessionReportProps {
  sessionId: string;
  userId?: string;
}

export function CleanSessionReportComponent({ sessionId, userId }: CleanSessionReportProps) {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  
  const [report, setReport] = useState<CleanSessionReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const targetUserId = userId || firebaseUser?.uid;

  useEffect(() => {
    fetchCleanReport();
  }, [sessionId, targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCleanReport = async () => {
    if (!firebaseUser || !targetUserId) return;

    try {
      setIsLoading(true);
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch(`/api/clean-report?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          setReport({
            ...data.report,
            sessionDate: new Date(data.report.sessionDate),
            generatedAt: new Date(data.report.generatedAt)
          });
        }
      } else if (response.status === 404) {
        // Report doesn't exist, try to generate it
        await generateCleanReport();
      }
    } catch (error) {
      console.error('Error fetching clean report:', error);
      toast({
        title: "Error",
        description: "Failed to load session report",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCleanReport = async () => {
    if (!firebaseUser || !targetUserId) return;

    try {
      setIsGenerating(true);
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/clean-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, regenerate: false }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          setReport({
            ...data.report,
            sessionDate: new Date(data.report.sessionDate),
            generatedAt: new Date(data.report.generatedAt)
          });
          toast({
            title: "Success",
            description: "Session report generated successfully",
          });
        }
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating clean report:', error);
      toast({
        title: "Error",
        description: "Failed to generate session report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!firebaseUser || !report) return;

    try {
      setIsGeneratingPdf(true);
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/clean-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-report-${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "PDF downloaded successfully",
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your session report...</p>
        </div>
      </div>
    );
  }

  if (!report && !isGenerating) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Report Available</h3>
        <p className="text-muted-foreground mb-6">
          This session doesn&apos;t have a report yet. Click below to generate one.
        </p>
        <Button onClick={generateCleanReport} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating Report...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your session report...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Growth Session Report</h1>
          <p className="text-muted-foreground">
            {report.sessionDate.toLocaleDateString()} • {report.duration} minutes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={report.completeness >= 80 ? "default" : "secondary"}>
            {report.completeness}% Complete
          </Badge>
          <Button onClick={downloadPDF} disabled={isGeneratingPdf} size="sm">
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Session Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{report.circumstance}</p>
        </CardContent>
      </Card>

      {/* Progress Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold capitalize">{report.progressMetrics.engagementLevel}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clarity Gained</p>
                <p className="text-2xl font-bold">{report.progressMetrics.clarityGained}/10</p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emotional Shift</p>
                <p className="text-2xl font-bold capitalize">{report.progressMetrics.emotionalShift}</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Your Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {report.coreInsights.primaryBreakthrough && (
            <div>
              <h4 className="font-semibold mb-2">🎯 Primary Breakthrough</h4>
              <p className="text-muted-foreground">{report.coreInsights.primaryBreakthrough}</p>
            </div>
          )}
          
          {report.coreInsights.newPerspective && (
            <div>
              <h4 className="font-semibold mb-2">🔄 New Perspective</h4>
              <p className="text-muted-foreground">{report.coreInsights.newPerspective}</p>
            </div>
          )}
          
          {report.coreInsights.personalLegacy && (
            <div>
              <h4 className="font-semibold mb-2">⭐ Personal Legacy</h4>
              <p className="text-muted-foreground">{report.coreInsights.personalLegacy}</p>
            </div>
          )}
          
          {report.coreInsights.emotionalSummary && (
            <div>
              <h4 className="font-semibold mb-2">💭 Emotional Journey</h4>
              <p className="text-muted-foreground">{report.coreInsights.emotionalSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Your Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.actionableOutcomes.immediateSteps.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Immediate Actions</h4>
              <ul className="space-y-2">
                {report.actionableOutcomes.immediateSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {report.actionableOutcomes.practiceAreas.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Areas to Practice</h4>
              <div className="flex flex-wrap gap-2">
                {report.actionableOutcomes.practiceAreas.map((area, index) => (
                  <Badge key={index} variant="outline">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {report.actionableOutcomes.reflectionPrompts.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Reflection Questions</h4>
              <ul className="space-y-2">
                {report.actionableOutcomes.reflectionPrompts.map((prompt, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Highlights */}
      {report.sessionHighlights.keyMoments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Highlights</CardTitle>
            <CardDescription>
              Key moments from your conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.sessionHighlights.keyMoments.map((moment, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <Badge 
                    variant={moment.impact === 'high' ? 'default' : moment.impact === 'medium' ? 'secondary' : 'outline'}
                    className="mb-2"
                  >
                    {moment.phase}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{moment.moment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-6 border-t">
        Report generated on {report.generatedAt.toLocaleDateString()} • v{report.reportVersion}
      </div>
    </div>
  );
}
