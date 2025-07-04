// src/components/protocol/phase-indicator.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, Anchor, Ear, RefreshCcwDot, LifeBuoy, Microscope, Award } from "lucide-react";

interface PhaseIndicatorProps {
  currentPhase: number;
  totalPhases: number;
  phaseName: string;
  isCompleted?: boolean;
  isLoadingNextPhase?: boolean;
}

// Use Lucide React icons instead of inline SVG for better reliability
const phaseIcons = [
  Anchor,        // Stabilize & Structure
  Ear,           // Listen for Core Frame
  RefreshCcwDot, // Validate Emotion / Reframe
  LifeBuoy,      // Provide Grounded Support
  Microscope,    // Reflective Pattern Discovery
  Award,         // Empower & Legacy Statement
];

// Fallback phase names in case of encryption issues
const fallbackPhaseNames = [
  "Stabilize & Structure",
  "Listen for Core Frame", 
  "Validate Emotion / Reframe",
  "Provide Grounded Support",
  "Reflective Pattern Discovery",
  "Empower & Legacy Statement",
];


export function PhaseIndicator({ currentPhase, totalPhases, phaseName, isCompleted = false, isLoadingNextPhase = false }: PhaseIndicatorProps) {
  const progressValue = isCompleted ? 100 : ((currentPhase - 1) / totalPhases) * 100;
  
  // Get the appropriate icon component
  const IconComponent = phaseIcons[currentPhase - 1] || phaseIcons[0];
  
  // Handle potential encryption issues by using fallback names if needed
  const displayName = phaseName && phaseName.length > 0 && !phaseName.startsWith('[Encrypted') 
    ? phaseName 
    : fallbackPhaseNames[currentPhase - 1] || `Phase ${currentPhase}`;

  // Debug logging to help identify encryption issues
  if (process.env.NODE_ENV === 'development') {
    console.log('PhaseIndicator Debug:', {
      currentPhase,
      phaseName,
      displayName,
      isEncrypted: phaseName?.startsWith('[Encrypted') || false
    });
  }

  return (
    <div className="p-4 md:p-6 bg-card rounded-lg shadow-md border border-border sticky top-16 z-30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : isLoadingNextPhase ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <IconComponent className="h-8 w-8 text-primary" />
          )}
          <div>
            <h2 className="font-headline text-xl md:text-2xl text-primary">
              {isCompleted ? "Session Complete" : displayName}
            </h2>
            {!isCompleted && (
              <p className="text-sm text-muted-foreground">
                Phase {currentPhase} of {totalPhases}
              </p>
            )}
          </div>
        </div>
      </div>
      <Progress value={progressValue} className="w-full h-2" />
      {isCompleted && (
        <p className="text-sm text-green-600 mt-2 text-center">
          Congratulations on completing the protocol! Your summary is below.
        </p>
      )}
    </div>
  );
}
