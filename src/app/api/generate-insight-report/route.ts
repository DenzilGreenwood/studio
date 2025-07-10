// src/app/api/generate-insight-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateInsightReport } from '@/ai/flows/insight-report-generator';

export async function POST(request: NextRequest) {
  let body: { sessionData?: unknown; focusArea?: string } = {};
  let sessionData: { 
    circumstance?: string; 
    chatHistory?: Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>; 
    keyStatements?: { reframedBelief?: string; legacyStatement?: string; insights?: string[] }
  } = {};
  
  try {
    body = await request.json();
    sessionData = body.sessionData as typeof sessionData || {};
    const { focusArea } = body;

    // Call the AI flow with session data
    const result = await generateInsightReport({
      sessionData: {
        circumstance: sessionData.circumstance || 'Reflection Session',
        chatHistory: sessionData.chatHistory || [],
        keyStatements: sessionData.keyStatements
      },
      clarityMapData: undefined, // Could be passed in if available
      focusArea: focusArea || undefined
    });

    return NextResponse.json(result);
  } catch {
    // Use the already parsed sessionData instead of trying to parse request again
    
    const fallbackResult = {
      title: `Insight Report - ${sessionData.circumstance || 'Session'} - ${new Date().toLocaleDateString()}`,
      sections: {
        highlights: `<p>Key highlights from your session about ${sessionData.circumstance || 'your situation'}.</p>`,
        patterns: '<p>Mental patterns and models that emerged during our conversation.</p>',
        reframedBeliefs: `<p>${sessionData.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.'}</p>`,
        legacyStatement: `<p>${sessionData.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.'}</p>`,
        nextSteps: '<p>Recommended next steps and reflection prompts for continued growth.</p>'
      },
      fullContent: `
        <div class="insight-report">
          <h1>Insight Report - ${sessionData.circumstance || 'Session'}</h1>
          
          <section class="highlights">
            <h2>✨ Highlights & Breakthroughs</h2>
            <div><p>Key highlights from your session about ${sessionData.circumstance || 'your situation'}.</p></div>
          </section>
          
          <section class="patterns">
            <h2>🧠 Patterns & Mental Models</h2>
            <div><p>Mental patterns and models that emerged during our conversation.</p></div>
          </section>
          
          <section class="reframed-beliefs">
            <h2>💭 Reframed Beliefs & Insights</h2>
            <div><p>${sessionData.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.'}</p></div>
          </section>
          
          <section class="legacy-statement">
            <h2>🎯 Legacy Statement</h2>
            <div><p>${sessionData.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.'}</p></div>
          </section>
          
          <section class="next-steps">
            <h2>🚀 Next Steps & Reflection Prompts</h2>
            <div><p>Recommended next steps and reflection prompts for continued growth.</p></div>
          </section>
        </div>
      `
    };

    return NextResponse.json(fallbackResult);
  }
}
