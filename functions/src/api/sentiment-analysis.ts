/**
 * Sentiment Analysis Function
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { handleCors, validateMethod, logError } from "../utils/common";

interface SentimentAnalysisInput {
  userMessages: string[];
}

export const sentimentAnalysisFunction = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (!validateMethod(req, res, ['POST'])) return;

    const body: SentimentAnalysisInput = req.body;
    
    // Validate required fields
    if (!body.userMessages) {
      res.status(400).json({
        error: 'Missing required field: userMessages'
      });
      return;
    }

    logger.info('Analyzing sentiment', {
      messagesCount: body.userMessages?.length || 0
    });

    // Import and call the Genkit sentiment analysis flow
    const { analyzeSentiment } = await import('../lib/ai-flows.js');
    
    // Convert array to string if needed
    const userMessagesString = Array.isArray(body.userMessages) 
      ? body.userMessages.join(' ') 
      : body.userMessages;
    
    const sentimentInput = {
      userMessages: userMessagesString
    };

    const aiResult = await analyzeSentiment(sentimentInput);

    const result = {
      sentiment: "neutral", // Keep for backward compatibility
      confidence: 0.8,
      emotions: aiResult.detectedEmotions.split(', '),
      detectedEmotions: aiResult.detectedEmotions,
      analysis: aiResult.detectedEmotions,
      timestamp: new Date().toISOString(),
      messageCount: Array.isArray(body.userMessages) ? body.userMessages.length : 1
    };

    logger.info('Sentiment analysis completed successfully');
    res.status(200).json(result);

  } catch (error) {
    logError('sentimentAnalysis', error);
    res.status(500).json({
      error: 'Failed to analyze sentiment'
    });
  }
});
