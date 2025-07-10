/**
 * Emotional Tone Function
 * Migrated from: src/app/api/emotional-tone/route.ts
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { handleCors, validateMethod, logError } from "../utils/common";

export const emotionalToneFunction = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (!validateMethod(req, res, ['POST'])) return;

    const body = req.body;
    
    // Validate required field
    if (!body.text && !body.userMessage) {
      res.status(400).json({
        error: 'Missing required field: text or userMessage'
      });
      return;
    }
    
    logger.info('Analyzing emotional tone', {
      hasText: !!body.text || !!body.userMessage
    });

    // Import and call the Genkit emotional tone analysis flow
    const { analyzeEmotionalTone } = await import('../lib/ai-flows.js');
    
    const emotionalToneInput = {
      userMessage: body.text || body.userMessage,
      context: body.context,
      previousTone: body.previousTone
    };

    const aiResult = await analyzeEmotionalTone(emotionalToneInput);

    const result = {
      primaryEmotion: aiResult.primaryEmotion,
      intensity: aiResult.intensity,
      secondaryEmotion: aiResult.secondaryEmotion,
      confidence: aiResult.confidence,
      progression: aiResult.progression,
      triggerWords: aiResult.triggerWords,
      // Keep legacy fields for backward compatibility
      tone: aiResult.primaryEmotion,
      emotions: [aiResult.primaryEmotion, aiResult.secondaryEmotion].filter(Boolean),
      analysis: `Primary emotion: ${aiResult.primaryEmotion} (intensity: ${aiResult.intensity}/10). Emotional progression: ${aiResult.progression}.`,
      timestamp: new Date().toISOString()
    };

    logger.info('Emotional tone analysis completed successfully');
    res.status(200).json(result);

  } catch (error) {
    logError('emotionalTone', error);
    res.status(500).json({
      error: 'Failed to analyze emotional tone'
    });
  }
});
