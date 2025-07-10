/**
 * Clarity Summary Function
 * Migrated from: src/app/api/clarity-summary/route.ts
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { handleCors, validateMethod, logError } from "../utils/common";

interface ClaritySummaryInput {
  reframedBelief: string;
  legacyStatement: string;
  topEmotions: string[];
}

export const claritySummaryFunction = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (!validateMethod(req, res, ['POST'])) return;

    const body: ClaritySummaryInput = req.body;
    
    // Validate required fields
    if (!body.reframedBelief || !body.legacyStatement || !body.topEmotions) {
      res.status(400).json({
        error: 'Missing required fields: reframedBelief, legacyStatement, topEmotions'
      });
      return;
    }

    logger.info('Generating clarity summary', {
      hasReframedBelief: !!body.reframedBelief,
      hasLegacyStatement: !!body.legacyStatement,
      emotionsCount: body.topEmotions?.length || 0
    });

    // TODO: Implement clarity summary generation or call to Genkit service
    const result = {
      summary: "Clarity summary generation has been moved to Firebase Functions. Implementation in progress.",
      insights: [],
      timestamp: new Date().toISOString(),
      input: {
        reframedBelief: body.reframedBelief,
        legacyStatement: body.legacyStatement,
        topEmotions: body.topEmotions
      }
    };

    logger.info('Clarity summary generated successfully');
    res.status(200).json(result);

  } catch (error) {
    logError('claritySummary', error);
    res.status(500).json({
      error: 'Failed to generate clarity summary'
    });
  }
});
