// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateGenkitEnvironment } from '@/lib/genkit-utils';

export async function GET() {
  try {
    // Validate environment
    validateGenkitEnvironment();

    // Try to import the flows to ensure they're working
    const flows = await Promise.allSettled([
      import('@/ai/flows/cognitive-edge-protocol'),
      import('@/ai/flows/clarity-summary-generator'),
      import('@/ai/flows/sentiment-analysis-flow'),
      import('@/ai/flows/goal-generator-flow')
    ]);

    const flowStatus = {
      cognitiveEdgeProtocol: flows[0].status === 'fulfilled',
      claritySummary: flows[1].status === 'fulfilled',
      sentimentAnalysis: flows[2].status === 'fulfilled',
      goalGenerator: flows[3].status === 'fulfilled'
    };

    const allFlowsHealthy = Object.values(flowStatus).every(status => status);

    return NextResponse.json({
      status: allFlowsHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      genkit: {
        configured: true,
        googleApiKey: !!process.env.COGNITIVEINSIGHT_GOOGLE_API_KEY,
        flows: flowStatus
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      genkit: {
        configured: false,
        googleApiKey: !!process.env.GOOGLE_API_KEY,
        flows: {}
      }
    }, { status: 500 });
  }
}
