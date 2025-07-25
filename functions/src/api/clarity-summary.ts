/**
 * Clarity Summary Function
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { handleCors, validateMethod, logError } from "../utils/common";

interface ClaritySummaryRequestBody {
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

    const body: ClaritySummaryRequestBody = req.body;
    
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

    // Import and call the Genkit clarity summary flow
    const { generateClaritySummary } = await import('../lib/ai-flows.js');
    
    const summaryInput = {
      reframedBelief: body.reframedBelief,
      legacyStatement: body.legacyStatement,
      topEmotions: Array.isArray(body.topEmotions) ? body.topEmotions.join(', ') : body.topEmotions
    };

    const aiResult = await generateClaritySummary(summaryInput);

    const result = {
      insightSummary: aiResult.insightSummary,
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
