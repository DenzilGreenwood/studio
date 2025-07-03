// src/app/api/clean-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { CleanReportService } from '@/lib/clean-report-service';



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
