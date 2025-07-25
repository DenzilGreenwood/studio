import { onRequest } from 'firebase-functions/v2/https';
import { handleCors, validateMethod, logError } from '../utils/common';

export const sessionReflectionFunction = onRequest(async (req, res) => {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return;

  // Validate method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    const body = req.body;
    
    // Validate required fields
    if (!body.sessionSummary || !body.actualReframedBelief || !body.actualLegacyStatement || !body.topEmotions || !body.circumstance || !body.sessionDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Import and call the Genkit session reflection flow
    const { generateSessionReflection } = await import('../lib/ai-flows.js');
    
    const sessionReflectionInput = {
      sessionSummary: body.sessionSummary,
      actualReframedBelief: body.actualReframedBelief,
      actualLegacyStatement: body.actualLegacyStatement,
      topEmotions: Array.isArray(body.topEmotions) ? body.topEmotions.join(', ') : body.topEmotions,
      circumstance: body.circumstance,
      sessionDate: body.sessionDate,
      userReflection: body.userReflection,
      previousSessions: body.previousSessions
    };

    const aiResult = await generateSessionReflection(sessionReflectionInput);

    // Transform the AI result to match the expected response format
    const reflection = {
      reflection: aiResult.conversationalHighlights,
      keyInsights: [
        aiResult.emotionalInsights,
        aiResult.progressReflection,
        aiResult.encouragingMessage
      ],
      nextSteps: aiResult.actionableItems,
      conversationalHighlights: aiResult.conversationalHighlights,
      actionableItems: aiResult.actionableItems,
      emotionalInsights: aiResult.emotionalInsights,
      progressReflection: aiResult.progressReflection,
      encouragingMessage: aiResult.encouragingMessage,
      reflectionPrompts: aiResult.reflectionPrompts
    };
    
    res.json(reflection);
  } catch (error) {
    logError('session-reflection', error);
    res.status(500).json({ error: 'Failed to generate session reflection' });
  }
});
