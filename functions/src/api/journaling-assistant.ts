import { onRequest } from 'firebase-functions/v2/https';
import { handleCors, validateMethod, logError } from '../utils/common';

export const journalingAssistantFunction = onRequest(async (req, res) => {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return;

  // Validate method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    const body = req.body;
    
    // Validate required fields
    if (!body.sessionSummary || !body.userMessage) {
      res.status(400).json({ 
        error: 'Missing required fields: sessionSummary and userMessage are required' 
      });
      return;
    }

    // TODO: Import and use the actual AI flow when available
    // const { generateJournalingResponse } = await import('@/ai/flows/journaling-assistant-flow');
    // const response = await generateJournalingResponse(input);

    // Supportive fallback response
    const response = {
      response: `Thank you for sharing your reflection about your session. I can see you're processing ${body.circumstance || 'important insights'}. Your willingness to explore these topics shows real commitment to growth.`,
      suggestedQuestions: [
        "What was the most meaningful moment in your session?",
        "How are you feeling about the insights you gained?", 
        "What would you like to focus on moving forward?",
        "How might you apply what you learned in your daily life?"
      ],
      encouragement: "You've done important work today, and every step of reflection helps you grow. Your journey of self-discovery is valuable and worthy of celebration.",
      nextSteps: body.reframedBelief ? [
        `Practice applying your new belief: "${body.reframedBelief}"`,
        "Notice moments when your old patterns emerge",
        "Celebrate small wins as you integrate new perspectives"
      ] : [
        "Continue reflecting on the insights from your session",
        "Consider how these learnings apply to your daily life",
        "Be patient and kind with yourself as you grow"
      ]
    };
    
    res.json(response);
  } catch (error) {
    logError('journaling-assistant', error);
    
    // Return a supportive fallback response instead of an error
    res.json({
      response: "I'm here to support your reflection. What would you like to explore about your session today?",
      suggestedQuestions: [
        "What was the most meaningful moment in your session?",
        "How are you feeling about the insights you gained?",
        "What would you like to focus on moving forward?"
      ],
      encouragement: "You've done important work today, and every step of reflection helps you grow."
    });
  }
});
