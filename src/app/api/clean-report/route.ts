// src/app/api/clean-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { CleanReportService } from '@/lib/clean-report-service';
import { db, doc, getDoc, collection, query, orderBy, getDocs } from '@/lib/firebase';
import type { ProtocolSession, ChatMessage } from '@/types';

// Initialize Firebase Admin if not already done
if (!getApps().length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin not initialized: Missing environment variables');
    // Don't throw an error during build, just warn
  } else {
    try {
      const serviceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    const decodedToken = await auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get request body
    const { sessionId, regenerate = false } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if clean report already exists (unless regenerate is true)
    if (!regenerate) {
      const existingReport = await CleanReportService.getCleanReport(userId, sessionId);
      if (existingReport) {
        return NextResponse.json({ 
          success: true, 
          report: existingReport,
          message: 'Clean report already exists'
        });
      }
    }

    // Get session data from Firestore
    const sessionRef = doc(db, `users/${userId}/sessions/${sessionId}`);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionDoc.data() as ProtocolSession;

    // Get chat messages
    const messagesRef = collection(db, `users/${userId}/sessions/${sessionId}/messages`);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const messages: ChatMessage[] = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];

    // Generate clean report
    const cleanReport = await CleanReportService.generateAndSaveReport(session, messages);

    return NextResponse.json({
      success: true,
      report: cleanReport,
      message: 'Clean report generated successfully'
    });

  } catch (error) {
    console.error('Error generating clean report:', error);
    return NextResponse.json(
      { error: 'Failed to generate clean report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    const decodedToken = await auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific clean report
      const report = await CleanReportService.getCleanReport(userId, sessionId);
      if (!report) {
        return NextResponse.json({ error: 'Clean report not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, report });
    } else {
      // Get all clean reports for user
      const reports = await CleanReportService.getUserReports(userId);
      return NextResponse.json({ success: true, reports });
    }

  } catch (error) {
    console.error('Error fetching clean report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clean report' },
      { status: 500 }
    );
  }
}
