// src/app/api/clean-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { CleanReportService } from '@/lib/clean-report-service';

// Initialize Firebase Admin if not already done
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
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
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get clean report
    const cleanReport = await CleanReportService.getCleanReport(userId, sessionId);
    if (!cleanReport) {
      return NextResponse.json({ error: 'Clean report not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBlob = await CleanReportService.generatePDFFromReport(cleanReport);
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="session-report-${sessionId}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating clean PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate clean PDF' },
      { status: 500 }
    );
  }
}
