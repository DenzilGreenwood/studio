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

    // TODO: Import and use the actual AI flow when available
    // const { generateSessionReflection } = await import('@/ai/flows/session-reflection-flow');
    // const reflection = await generateSessionReflection(body);

    // Placeholder response
    const reflection = {
      reflection: `Based on your session about ${body.circumstance}, you've made meaningful progress. Your reframed belief "${body.actualReframedBelief}" shows growth from your legacy statement "${body.actualLegacyStatement}". The emotions you experienced (${body.topEmotions}) are part of your journey.`,
      keyInsights: [
        'You have shown courage in exploring difficult topics',
        'Your new perspective creates opportunities for growth',
        'The emotions you felt are valid and informative'
      ],
      nextSteps: [
        'Continue practicing your new belief',
        'Notice when old patterns emerge',
        'Celebrate small wins along the way'
      ]
    };
    
    res.json(reflection);
  } catch (error) {
    logError('session-reflection', error);
    res.status(500).json({ error: 'Failed to generate session reflection' });
  }
});
