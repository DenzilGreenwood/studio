// src/lib/clean-report-service.ts
import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs,
  Timestamp 
} from '@/lib/firebase';
import { CleanSessionReport } from '@/types/clean-reports';
import { CleanReportGenerator, convertToPDFData } from '@/lib/clean-report-generator';
import { generateCleanPDF } from '@/lib/clean-pdf-generator';
import type { ProtocolSession, ChatMessage } from '@/types';

export class CleanReportService {
  
  /**
   * Generate and save a clean report for a session
   */
  static async generateAndSaveReport(
    session: ProtocolSession,
    messages: ChatMessage[]
  ): Promise<CleanSessionReport> {
    
    // Generate clean report
    const cleanReport = CleanReportGenerator.generateCleanReport(session, messages);
    
    // Save to Firestore
    const reportRef = doc(db, `users/${session.userId}/clean-reports/${session.sessionId}`);
    await setDoc(reportRef, {
      ...cleanReport,
      sessionDate: Timestamp.fromDate(cleanReport.sessionDate),
      generatedAt: Timestamp.fromDate(cleanReport.generatedAt)
    });
    
    return cleanReport;
  }
  
  /**
   * Get a clean report for a session
   */
  static async getCleanReport(userId: string, sessionId: string): Promise<CleanSessionReport | null> {
    const reportRef = doc(db, `users/${userId}/clean-reports/${sessionId}`);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      return null;
    }
    
    const data = reportDoc.data();
    return {
      ...data,
      sessionDate: data.sessionDate instanceof Timestamp ? data.sessionDate.toDate() : new Date(data.sessionDate),
      generatedAt: data.generatedAt instanceof Timestamp ? data.generatedAt.toDate() : new Date(data.generatedAt)
    } as CleanSessionReport;
  }
  
  /**
   * Get all clean reports for a user
   */
  static async getUserReports(userId: string): Promise<CleanSessionReport[]> {
    const reportsRef = collection(db, `users/${userId}/clean-reports`);
    const q = query(reportsRef, orderBy('sessionDate', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        sessionDate: data.sessionDate instanceof Timestamp ? data.sessionDate.toDate() : new Date(data.sessionDate),
        generatedAt: data.generatedAt instanceof Timestamp ? data.generatedAt.toDate() : new Date(data.generatedAt)
      } as CleanSessionReport;
    });
  }
  
  /**
   * Generate PDF from clean report
   */
  static async generatePDFFromReport(report: CleanSessionReport): Promise<Blob> {
    const pdfData = convertToPDFData(report);
    return await generateCleanPDF(pdfData);
  }
  
  /**
   * Generate clean report and PDF for a session
   */
  static async generateReportAndPDF(
    session: ProtocolSession,
    messages: ChatMessage[]
  ): Promise<{report: CleanSessionReport, pdf: Blob}> {
    
    // Generate clean report
    const report = await this.generateAndSaveReport(session, messages);
    
    // Generate PDF
    const pdf = await this.generatePDFFromReport(report);
    
    return { report, pdf };
  }
  
  /**
   * Check if a clean report exists for a session
   */
  static async reportExists(userId: string, sessionId: string): Promise<boolean> {
    const reportRef = doc(db, `users/${userId}/clean-reports/${sessionId}`);
    const reportDoc = await getDoc(reportRef);
    return reportDoc.exists();
  }
  
  /**
   * Update an existing clean report
   */
  static async updateReport(
    userId: string, 
    sessionId: string, 
    updates: Partial<CleanSessionReport>
  ): Promise<void> {
    const reportRef = doc(db, `users/${userId}/clean-reports/${sessionId}`);
    
    // Convert dates to Timestamps for Firestore
    const firestoreUpdates: Record<string, unknown> = { ...updates };
    if (updates.sessionDate) {
      firestoreUpdates.sessionDate = Timestamp.fromDate(updates.sessionDate);
    }
    if (updates.generatedAt) {
      firestoreUpdates.generatedAt = Timestamp.fromDate(updates.generatedAt);
    }
    
    await setDoc(reportRef, firestoreUpdates, { merge: true });
  }
}
