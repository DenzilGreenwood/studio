// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { cognitiveEdgeProtocol } from './flows/cognitive-edge-protocol';
import { generateInsightReport } from './flows/insight-report-generator';

// Initialize Firebase Admin
admin.initializeApp();

// Example: Convert protocol route to Firebase Function
export const protocolAPI = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // req.body is automatically parsed - no .json() needed!
    const { userInput, phase, sessionHistory, attemptCount } = req.body;
    
    if (!userInput || !phase) {
      res.status(400).json({ error: 'Missing required fields: userInput and phase' });
      return;
    }

    const result = await cognitiveEdgeProtocol({
      userInput,
      phase,
      sessionHistory,
      attemptCount
    });
    
    res.json(result);
  } catch (error) {
    console.error('Protocol API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example: Convert insight report route
export const generateInsightReportAPI = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sessionData, focusArea } = req.body; // No .json() needed!
    
    const result = await generateInsightReport({
      sessionData: {
        circumstance: sessionData?.circumstance || 'Reflection Session',
        chatHistory: sessionData?.chatHistory || [],
        keyStatements: sessionData?.keyStatements
      },
      clarityMapData: undefined,
      focusArea: focusArea || undefined
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error generating insight report:', error);
    
    // Fallback response - sessionData is already available from req.body
    const fallbackResult = {
      title: `Insight Report - ${req.body.sessionData?.circumstance || 'Session'} - ${new Date().toLocaleDateString()}`,
      sections: {
        highlights: `<p>Key highlights from your session about ${req.body.sessionData?.circumstance || 'your situation'}.</p>`,
        patterns: '<p>Mental patterns and models that emerged during our conversation.</p>',
        reframedBeliefs: `<p>${req.body.sessionData?.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.'}</p>`,
        legacyStatement: `<p>${req.body.sessionData?.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.'}</p>`,
        nextSteps: '<p>Recommended next steps and reflection prompts for continued growth.</p>'
      },
      fullContent: `<div class="insight-report">
        <h1>Insight Report - ${req.body.sessionData?.circumstance || 'Session'}</h1>
        <section class="highlights">
          <h2>✨ Highlights & Breakthroughs</h2>
          <div><p>Key highlights from your session.</p></div>
        </section>
      </div>`
    };
    
    res.json(fallbackResult);
  }
});

// Authentication middleware for protected routes
export const authenticatedFunction = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Your protected logic here
    const { sessionId } = req.body;
    
    // Direct Firestore access with Admin SDK
    const sessionDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ success: true, session: sessionDoc.data() });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});
