import { onRequest } from 'firebase-functions/v2/https';
import { handleCors, validateMethod, logError } from '../utils/common';

export const generateInsightReportFunction = onRequest(async (req, res) => {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return;

  // Validate method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    const body = req.body;
    const sessionData = body.sessionData || {};
    const focusArea = body.focusArea;

    // TODO: Import and use the actual AI flow when available
    // const { generateInsightReport } = await import('@/ai/flows/insight-report-generator');
    // const result = await generateInsightReport({ sessionData, clarityMapData: undefined, focusArea });

    // Fallback response
    const circumstance = sessionData.circumstance || 'Session';
    const reframedBelief = sessionData.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.';
    const legacyStatement = sessionData.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.';
    
    const result = {
      title: `Insight Report - ${circumstance} - ${new Date().toLocaleDateString()}`,
      sections: {
        highlights: `<p>Key highlights from your session about ${circumstance}. You've shown remarkable courage in exploring challenging topics and developing new perspectives.</p>`,
        patterns: '<p>Mental patterns and models that emerged during our conversation show increasing self-awareness and growth mindset.</p>',
        reframedBeliefs: `<p>${reframedBelief}</p>`,
        legacyStatement: `<p>${legacyStatement}</p>`,
        nextSteps: '<p>Recommended next steps include practicing your new perspectives, continuing regular reflection, and celebrating progress along your journey.</p>'
      },
      fullContent: `
        <div class="insight-report">
          <h1>Insight Report - ${circumstance}</h1>
          <p class="report-date">${new Date().toLocaleDateString()}</p>
          
          <section class="highlights">
            <h2>✨ Highlights & Breakthroughs</h2>
            <div><p>Key highlights from your session about ${circumstance}. You've shown remarkable courage in exploring challenging topics and developing new perspectives.</p></div>
          </section>
          
          <section class="patterns">
            <h2>🧠 Mental Patterns & Models</h2>
            <div><p>Mental patterns and models that emerged during our conversation show increasing self-awareness and growth mindset.</p></div>
          </section>
          
          <section class="reframed-beliefs">
            <h2>🔄 Reframed Beliefs</h2>
            <div><p>${reframedBelief}</p></div>
          </section>
          
          <section class="legacy-statement">
            <h2>🌟 Legacy Statement</h2>
            <div><p>${legacyStatement}</p></div>
          </section>
          
          <section class="next-steps">
            <h2>🚀 Next Steps</h2>
            <div><p>Recommended next steps include practicing your new perspectives, continuing regular reflection, and celebrating progress along your journey.</p></div>
          </section>
        </div>
      `,
      metadata: {
        generatedAt: new Date().toISOString(),
        sessionDate: new Date().toISOString(),
        focusArea: focusArea || 'General Reflection'
      }
    };
    
    res.json(result);
  } catch (error) {
    logError('generate-insight-report', error);
    res.status(500).json({ error: 'Failed to generate insight report' });
  }
});
