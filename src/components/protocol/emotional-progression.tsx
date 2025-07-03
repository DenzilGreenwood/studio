// src/components/protocol/emotional-progression.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap,
  Signpost,
  Target,
  Heart,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotionalProgressionProps {
  emotionalProgression?: Array<{
    phaseIndex: number;
    phaseName: string;
    primaryEmotion: string;
    intensity: number;
    timestamp: Date;
    triggerMessage?: string;
  }>;
  keyStatements?: {
    reframedBelief?: {
      statement: string;
      phaseIndex: number;
      timestamp: Date;
      confidence: number;
    };
    legacyStatement?: {
      statement: string;
      phaseIndex: number;
      timestamp: Date;
      confidence: number;
    };
    insights?: Array<{
      insight: string;
      phaseIndex: number;
      timestamp: Date;
      emotionalContext: string;
    }>;
  };
}

const getIntensityColor = (intensity: number) => {
  if (intensity <= 3) return 'bg-green-100 text-green-800 border-green-200';
  if (intensity <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (intensity <= 8) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

const getProgressionIcon = (current: number, previous?: number) => {
  if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  
  if (current > previous + 1) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (current < previous - 1) return <TrendingDown className="h-4 w-4 text-red-600" />;
  if (Math.abs(current - previous) >= 3) return <Zap className="h-4 w-4 text-purple-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getStatementIcon = (type: 'reframed_belief' | 'legacy_statement' | 'insight') => {
  switch (type) {
    case 'reframed_belief':
      return <Target className="h-5 w-5 text-blue-600" />;
    case 'legacy_statement':
      return <Heart className="h-5 w-5 text-purple-600" />;
    case 'insight':
      return <Lightbulb className="h-5 w-5 text-amber-600" />;
  }
};

export function EmotionalProgression({ emotionalProgression, keyStatements }: EmotionalProgressionProps) {
  if (!emotionalProgression || emotionalProgression.length === 0) {
    return null;
  }

  // Sort progression by phase index
  const sortedProgression = [...emotionalProgression].sort((a, b) => a.phaseIndex - b.phaseIndex);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Signpost className="h-5 w-5 text-primary" />
          Emotional Journey & Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emotional Progression Flow */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Emotional Progression
          </h4>
          
          <div className="relative">
            {sortedProgression.map((emotion, index) => {
              const previousEmotion = index > 0 ? sortedProgression[index - 1] : undefined;
              const isLast = index === sortedProgression.length - 1;
              
              return (
                <div key={`${emotion.phaseIndex}-${emotion.timestamp}`} className="relative">
                  {/* Emotion Card */}
                  <div className="flex items-center gap-4">
                    {/* Phase Indicator */}
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                      {emotion.phaseIndex + 1}
                    </div>
                    
                    {/* Emotion Content */}
                    <div className="flex-1 bg-muted/30 rounded-lg p-4 min-h-[80px] flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs font-medium border",
                              getIntensityColor(emotion.intensity)
                            )}
                          >
                            {emotion.primaryEmotion}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Intensity: {emotion.intensity}/10
                          </span>
                          {getProgressionIcon(emotion.intensity, previousEmotion?.intensity)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {emotion.phaseName}
                        </p>
                        {emotion.triggerMessage && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{emotion.triggerMessage.substring(0, 80)}..."
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow to next phase */}
                  {!isLast && (
                    <div className="flex justify-center my-3">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Statements Section */}
        {keyStatements && (
          <div className="space-y-4">
            <Separator />
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Key Insights & Breakthroughs
            </h4>
            
            <div className="space-y-4">
              {/* Reframed Belief */}
              {keyStatements.reframedBelief && (
                <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                      {getStatementIcon('reframed_belief')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-blue-900">Reframed Belief</h5>
                        <Badge variant="secondary" className="text-xs">
                          Phase {keyStatements.reframedBelief.phaseIndex + 1}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-800 italic mb-2">
                        "{keyStatements.reframedBelief.statement}"
                      </p>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Signpost className="h-3 w-3" />
                        <span>This is your new guiding belief - refer back to this when doubt arises</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Legacy Statement */}
              {keyStatements.legacyStatement && (
                <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-purple-100 rounded-full">
                      {getStatementIcon('legacy_statement')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-purple-900">Legacy Statement</h5>
                        <Badge variant="secondary" className="text-xs">
                          Phase {keyStatements.legacyStatement.phaseIndex + 1}
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-800 italic mb-2">
                        "{keyStatements.legacyStatement.statement}"
                      </p>
                      <div className="flex items-center gap-2 text-xs text-purple-600">
                        <Signpost className="h-3 w-3" />
                        <span>This represents your deeper purpose and impact - let it guide your actions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {keyStatements.insights && keyStatements.insights.length > 0 && (
                <div className="space-y-3">
                  {keyStatements.insights.map((insight, index) => (
                    <div key={index} className="border border-amber-200 bg-amber-50/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
                          {getStatementIcon('insight')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-amber-900">Key Insight</h5>
                            <Badge variant="secondary" className="text-xs">
                              Phase {insight.phaseIndex + 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-amber-800 mb-2">
                            {insight.insight}
                          </p>
                          <p className="text-xs text-amber-700 italic">
                            Emotional context: {insight.emotionalContext}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
