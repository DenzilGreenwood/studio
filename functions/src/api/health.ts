/**
 * Health Check Function
 * Migrated from: src/app/api/health/route.ts
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const healthFunction = onRequest({
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 30
}, async (req, res) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Validate environment
    const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY || !!process.env.COGNITIVEINSIGHT_GOOGLE_API_KEY;

    // Since we can't dynamically import AI flows in Firebase Functions,
    // we'll check basic environment setup
    const flowStatus = {
      cognitiveEdgeProtocol: hasGoogleApiKey,
      claritySummary: hasGoogleApiKey,
      sentimentAnalysis: hasGoogleApiKey,
      goalGenerator: hasGoogleApiKey
    };

    const allFlowsHealthy = Object.values(flowStatus).every(status => status);

    const healthData = {
      status: allFlowsHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      genkit: {
        configured: hasGoogleApiKey,
        googleApiKey: hasGoogleApiKey,
        flows: flowStatus
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        functions: true
      }
    };

    logger.info('Health check completed', healthData);
    res.status(200).json(healthData);

  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      genkit: {
        configured: false,
        googleApiKey: !!process.env.GOOGLE_API_KEY || !!process.env.COGNITIVEINSIGHT_GOOGLE_API_KEY,
        flows: {
          cognitiveEdgeProtocol: false,
          claritySummary: false,
          sentimentAnalysis: false,
          goalGenerator: false
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        functions: true
      }
    });
  }
});
