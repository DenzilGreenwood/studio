// src/components/protocol/phase-indicator.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";

interface PhaseIndicatorProps {
  currentPhase: number;
  totalPhases: number;
  phaseName: string;
  isCompleted?: boolean;
  isLoadingNextPhase?: boolean;
}

const phaseIcons = [
  () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-anchor"><path d="M12 6V2"/><path d="M12 22V8"/><path d="M5 8H2c0 4.42 3.58 8 8 8s8-3.58 8-8h-3"/><path d="M5 12H2"/><path d="M19 12h3"/></svg>, // Stabilize & Structure
  () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ear"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 6a3.5 3.5 0 0 0-7 0Z"/><path d="M16 16.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>, // Listen for Core Frame
  () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-ccw-dot"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M12 12h.01"/></svg>, // Validate Emotion / Reframe
  () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-life-buoy"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" x2="9.17" y1="4.93" y2="9.17"/><line x1="14.83" x2="19.07" y1="4.93" y2="9.17"/><line x1="14.83" x2="19.07" y1="19.07" y2="14.83"/><line x1="4.93" x2="9.17" y1="19.07" y2="14.83"/></svg>, // Provide Grounded Support
  () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-microscope"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z"/><path d="M15 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z"/></svg>, // Reflective Pattern Discovery
  () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>, // Empower & Legacy Statement
];


export function PhaseIndicator({ currentPhase, totalPhases, phaseName, isCompleted = false, isLoadingNextPhase = false }: PhaseIndicatorProps) {
  const progressValue = isCompleted ? 100 : ((currentPhase -1) / totalPhases) * 100;
  const IconComponent = phaseIcons[currentPhase - 1] || phaseIcons[0];

  return (
    <div className="p-4 md:p-6 bg-card rounded-lg shadow-md border border-border sticky top-16 z-30"> {/* top-16 for header height */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : isLoadingNextPhase ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <IconComponent />
          )}
          <div>
            <h2 className="font-headline text-xl md:text-2xl text-primary">
              {isCompleted ? "Session Complete" : phaseName}
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
