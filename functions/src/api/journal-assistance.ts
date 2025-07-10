import { onRequest } from 'firebase-functions/v2/https';
import { handleCors, validateMethod, logError } from '../utils/common';

export const journalAssistanceFunction = onRequest(async (req, res) => {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return;

  // Validate method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    const body = req.body;
    
    // Validate required fields
    if (!body.reportData || !body.reportData.circumstance || !body.reportData.insights) {
      res.status(400).json({ error: 'Missing required fields: reportData with circumstance and insights required' });
      return;
    }

    // Import and call the Genkit journaling assistance flow
    const { generateJournalingAssistance } = await import('../lib/ai-flows.js');
    
    const journalingInput = {
      sessionSummary: body.reportData.sessionSummary || 'Session completed successfully',
      reframedBelief: body.reportData.insights?.primaryReframe || 'New perspective gained',
      legacyStatement: body.reportData.insights?.legacyStatement || 'Commitment to growth',
      topEmotions: body.reportData.insights?.emotionalJourney || 'reflective, hopeful',
      circumstance: body.reportData.circumstance,
      userMessage: body.userMessage || "I'd like to reflect on my session",
      conversationHistory: body.conversationHistory,
      currentReflection: body.currentReflection,
      currentGoals: body.currentGoals,
      previousSessions: body.previousJournals
    };

    const aiResult = await generateJournalingAssistance(journalingInput);

    // Transform the AI result to match the expected response format
    const assistance = {
      conversationalHighlights: aiResult.response,
      reflectionPrompts: aiResult.suggestedQuestions,
      actionableInsights: [
        "Practice your new reframed belief in daily situations",
        "Notice when old thought patterns emerge", 
        "Celebrate moments when you apply your new insights"
      ],
      progressTracking: "You're making meaningful progress in your personal growth journey.",
      encouragement: aiResult.encouragement,
      personalizedQuestions: aiResult.suggestedQuestions,
      crossSessionInsights: body.previousJournals?.length ? "Looking at your previous reflections, there's a clear pattern of growth and increasing self-awareness." : undefined,
      // Add AI flow specific fields
      response: aiResult.response,
      suggestedQuestions: aiResult.suggestedQuestions,
      concernsDetected: aiResult.concernsDetected,
      reflectionPrompt: aiResult.reflectionPrompt,
      goalSuggestion: aiResult.goalSuggestion
    };
    
    res.json(assistance);
  } catch (error) {
    logError('journal-assistance', error);
    res.status(500).json({ error: 'Failed to generate journal assistance' });
  }
});
