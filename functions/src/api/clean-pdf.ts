import { onRequest } from 'firebase-functions/v2/https';
import { handleCors, validateMethod, logError } from '../utils/common';

export const cleanPdfFunction = onRequest(async (req, res) => {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return;

  // Validate method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract token for future Firebase Admin verification
    // const token = authHeader.split('Bearer ')[1];
    
    // TODO: Implement Firebase Admin verification when available
    // const { auth } = await import('firebase-admin');
    // const decodedToken = await auth().verifyIdToken(token);
    // const userId = decodedToken.uid;

    // Get request body
    const { sessionId, userId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // TODO: Implement clean report service when available
    // const { CleanReportService } = await import('@/lib/clean-report-service');
    // const cleanReport = await CleanReportService.getCleanReport(userId, sessionId);
    // if (!cleanReport) {
    //   res.status(404).json({ error: 'Clean report not found' });
    //   return;
    // }
    // const pdfBlob = await CleanReportService.generatePDFFromReport(cleanReport);

    // Placeholder PDF generation - in reality this would generate a proper PDF
    const pdfContent = `
Session Report - ${sessionId}
Generated: ${new Date().toLocaleDateString()}

Summary:
This session focused on personal growth and self-discovery. 
You made meaningful progress in exploring new perspectives and developing insights.

Key Insights:
• Demonstrated strong self-awareness and reflection capabilities
• Showed openness to new perspectives and growth opportunities
• Made progress in reframing limiting beliefs

Action Items:
• Continue practicing new thought patterns in daily life
• Maintain regular reflection and journaling
• Apply insights to real-world situations

Next Steps:
Focus on implementing the insights gained during this session while maintaining momentum in your personal growth journey.
    `;

    // Convert text to buffer (in reality, this would be a proper PDF)
    const pdfBuffer = Buffer.from(pdfContent, 'utf-8');

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="session-report-${sessionId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    logError('clean-pdf', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
