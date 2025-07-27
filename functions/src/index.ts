/**
 * Firebase Functions for CognitiveInsight API
 * Migrated from Next.js API routes for better serverless scaling
 * Date: July 10, 2025
 */

import { setGlobalOptions } from "firebase-functions";

// Import individual function modules
import { healthFunction } from "./api/health";
import { protocolFunction } from "./api/protocol";
import { userLimitFunction } from "./api/user-limit";
import { claritySummaryFunction } from "./api/clarity-summary";
import { sentimentAnalysisFunction } from "./api/sentiment-analysis";
import { emotionalToneFunction } from "./api/emotional-tone";
import { sessionReflectionFunction } from "./api/session-reflection";
import { journalAssistanceFunction } from "./api/journal-assistance";
import { journalingAssistantFunction } from "./api/journaling-assistant";
import { generateInsightReportFunction } from "./api/generate-insight-report";
import { crossSessionAnalysisFunction } from "./api/cross-session-analysis";
import { growthReportFunction } from "./api/growth-report";
import { cleanReportFunction } from "./api/clean-report";
import { cleanPdfFunction } from "./api/clean-pdf";
import { genkitFunction } from "./api/genkit";
import { sendEmailFunction } from "./api/send-email";

// Set global options for cost control
setGlobalOptions({ 
  maxInstances: 50,
  memory: "512MiB",
  timeoutSeconds: 300,
  region: "us-central1"
});

// Export all API functions
export const health = healthFunction;
export const protocol = protocolFunction;
export const userLimit = userLimitFunction;
export const claritySummary = claritySummaryFunction;
export const sentimentAnalysis = sentimentAnalysisFunction;
export const emotionalTone = emotionalToneFunction;
export const sessionReflection = sessionReflectionFunction;
export const journalAssistance = journalAssistanceFunction;
export const journalingAssistant = journalingAssistantFunction;
export const generateInsightReport = generateInsightReportFunction;
export const crossSessionAnalysis = crossSessionAnalysisFunction;
export const growthReport = growthReportFunction;
export const cleanReport = cleanReportFunction;
export const cleanPdf = cleanPdfFunction;
export const genkit = genkitFunction;
export const sendEmail = sendEmailFunction;
