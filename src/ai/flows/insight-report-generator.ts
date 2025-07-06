// src/ai/flows/insight-report-generator.ts

/**
 * @fileOverview Generates comprehensive insight reports based on session data
 * and clarity map information.
 */

import { ai } from '@/ai/genkit';
import {
  InsightReportGeneratorInputSchema,
  type InsightReportGeneratorInput,
  InsightReportGeneratorOutputSchema,
  type InsightReportGeneratorOutput,
} from '@/types';
import { runGenkitFlowWithRetry, formatAIError, logAIFlowExecution } from '@/lib/genkit-utils';

export async function generateInsightReport(
  input: InsightReportGeneratorInput
): Promise<InsightReportGeneratorOutput> {
  try {
    return await runGenkitFlowWithRetry(
      insightReportFlow,
      input,
      'generateInsightReport',
      2
    );
  } catch (error) {
    const formattedError = formatAIError(error, 'Insight Report Generation');
    logAIFlowExecution('generateInsightReport', input, undefined, error instanceof Error ? error : new Error(String(error)));
    throw new Error(formattedError);
  }
}

const insightReportFlow = ai.defineFlow({
  name: 'insightReportGenerator',
  inputSchema: InsightReportGeneratorInputSchema,
  outputSchema: InsightReportGeneratorOutputSchema,
}, async (input) => {
    const { sessionData, clarityMapData, focusArea } = input;
    
    // Build context from session data
    const sessionContext = `
    Session Context:
    - Challenge/Situation: ${sessionData.circumstance}
    - Chat History: ${sessionData.chatHistory?.length || 0} messages
    - Key Statements: ${sessionData.keyStatements?.reframedBelief ? 'Reframed Belief: ' + sessionData.keyStatements.reframedBelief + '. ' : ''}${sessionData.keyStatements?.legacyStatement ? 'Legacy Statement: ' + sessionData.keyStatements.legacyStatement + '. ' : ''}
    - Insights: ${sessionData.keyStatements?.insights?.join(', ') || 'None recorded'}
    
    Chat Messages:
    ${sessionData.chatHistory?.map((msg: { sender: string; text: string }) => `${msg.sender}: ${msg.text}`).join('\n') || 'No chat history available'}
    `;

    const clarityMapContext = clarityMapData ? `
    Clarity Map Data:
    - Nodes: ${clarityMapData.nodes.map((node: { type: string; label: string }) => `${node.type}: ${node.label}`).join(', ')}
    - Connections: ${clarityMapData.connections?.map((conn: { from: string; to: string }) => `${conn.from} -> ${conn.to}`).join(', ') || 'No connections'}
    ` : '';

    const focusContext = focusArea ? `Focus Area: ${focusArea}` : '';

    const prompt = `
    You are an expert insight analyst helping users create meaningful reflection documents. Based on the following session data, create a comprehensive insight report that helps the user understand their breakthrough moments, patterns, and growth opportunities.

    ${sessionContext}
    ${clarityMapContext}
    ${focusContext}

    Create a detailed insight report with the following sections:

    1. **Highlights & Breakthroughs**: Identify and elaborate on the most significant moments of clarity, breakthrough insights, and emotional shifts that occurred during this session.

    2. **Patterns & Mental Models**: Analyze the recurring themes, thought patterns, and mental models that emerged. Look for cognitive patterns, emotional responses, and behavioral tendencies.

    3. **Reframed Beliefs & Insights**: Focus on beliefs that were challenged, reframed, or newly formed. Explain how these new perspectives differ from previous thinking.

    4. **Legacy Statement**: Synthesize the core values, principles, and identity statements that emerged. This should capture the essence of who the person is becoming.

    5. **Next Steps & Reflection Prompts**: Provide actionable next steps and thoughtful questions for continued reflection and growth.

    Requirements:
    - Write in a warm, encouraging, and insightful tone
    - Use specific examples from the session when possible
    - Format each section with rich HTML including <p>, <ul>, <li>, <strong>, <em> tags
    - Make it personal and meaningful to the user's specific situation
    - Include relevant quotes from the conversation when appropriate
    - Suggest a meaningful title for the report

    Return a JSON object with:
    - title: A meaningful title for the report
    - sections: An object with highlights, patterns, reframedBeliefs, legacyStatement, nextSteps
    - fullContent: Complete HTML content for the report
    `;

    const result = await ai.generate(prompt);
    
    try {
      const parsedResult = JSON.parse(result.text);
      return parsedResult;
    } catch {
      // Fallback if JSON parsing fails
      const sections = {
        highlights: extractSection(result.text, 'highlights') || '<p>Key highlights from your session about overcoming challenges and finding clarity.</p>',
        patterns: extractSection(result.text, 'patterns') || '<p>Mental patterns and models that emerged during our conversation.</p>',
        reframedBeliefs: extractSection(result.text, 'reframedbeliefs') || `<p>${sessionData.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.'}</p>`,
        legacyStatement: extractSection(result.text, 'legacystatement') || `<p>${sessionData.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.'}</p>`,
        nextSteps: extractSection(result.text, 'nextsteps') || '<p>Recommended next steps and reflection prompts for continued growth.</p>'
      };

      const title = extractTitle(result.text) || `Insight Report - ${sessionData.circumstance || 'Session'} - ${new Date().toLocaleDateString()}`;

      const fullContent = `
        <div class="insight-report">
          <h1>${title}</h1>
          
          <section class="highlights">
            <h2>✨ Highlights & Breakthroughs</h2>
            <div>${sections.highlights}</div>
          </section>
          
          <section class="patterns">
            <h2>🧠 Patterns & Mental Models</h2>
            <div>${sections.patterns}</div>
          </section>
          
          <section class="reframed-beliefs">
            <h2>💭 Reframed Beliefs & Insights</h2>
            <div>${sections.reframedBeliefs}</div>
          </section>
          
          <section class="legacy-statement">
            <h2>🎯 Legacy Statement</h2>
            <div>${sections.legacyStatement}</div>
          </section>
          
          <section class="next-steps">
            <h2>🚀 Next Steps & Reflection Prompts</h2>
            <div>${sections.nextSteps}</div>
          </section>
        </div>
      `;

      return {
        title,
        sections,
        fullContent
      };
    }
});

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[^:]*:([^]*?)(?=\\n\\s*\\d+\\.|\\n\\s*$)`, 'i');
  const match = text.match(regex);
  if (match) {
    return match[1].trim();
  }
  return '';
}

function extractTitle(text: string): string | null {
  const titleRegex = /title[^:]*:\s*([^\n]+)/i;
  const match = text.match(titleRegex);
  return match ? match[1].trim() : null;
}
