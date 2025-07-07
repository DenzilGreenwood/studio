// tests/unit/pdfGenerator.test.ts
/**
 * Unit tests for PDF Generator
 */

// ✅ Mock jsPDF before any imports
const mockJsPDFInstance = {
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  setTextColor: jest.fn(),
  text: jest.fn(),
  addPage: jest.fn(),
  getPageCount: jest.fn().mockReturnValue(1),
  getNumberOfPages: jest.fn().mockReturnValue(1),
  setPage: jest.fn(),
  addImage: jest.fn(),
  rect: jest.fn(),
  setFillColor: jest.fn(),
  setDrawColor: jest.fn(),
  setLineWidth: jest.fn(),
  line: jest.fn(),
  circle: jest.fn(),
  splitTextToSize: jest.fn().mockImplementation((text: string) => {
    // ✅ Always return an array of strings
    if (!text || typeof text !== 'string') return [''];
    return [text];
  }),
  getTextWidth: jest.fn().mockReturnValue(50),
  output: jest.fn().mockImplementation((type: string) => {
    if (type === 'blob') {
      return new Blob(['mock pdf content'], { type: 'application/pdf' });
    }
    return 'mock pdf string';
  }),
  save: jest.fn(),
  internal: {
    pageSize: {
      getWidth: jest.fn().mockReturnValue(210),
      getHeight: jest.fn().mockReturnValue(297),
      width: 210,
      height: 297
    },
    scaleFactor: 1.33
  }
};

// ✅ Properly mock the module
jest.mock('jspdf', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockJsPDFInstance)
  };
});

import { PDFGenerator, prepareSessionDataForPDF } from '../../src/lib/pdf-generator';
import type { ProtocolSession } from '../../src/types';

describe('PDF Generator', () => {
  let pdfGenerator: PDFGenerator;
  let mockSessionData: ProtocolSession;

  beforeEach(() => {
    jest.clearAllMocks();

    pdfGenerator = new PDFGenerator();
    // ✅ Force inject the mock instance to fix mock integration
    (pdfGenerator as any)['doc'] = mockJsPDFInstance;
    
    mockSessionData = {
      sessionId: 'test-session-123',
      userId: 'test-user-456',
      circumstance: 'Test session circumstance',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      completedPhases: 6,
      ageRange: '25-34',
      summary: {
        insightSummary: 'Test insights gained during session',
        actualReframedBelief: 'New positive belief framework',
        actualLegacyStatement: 'My legacy statement',
        topEmotions: 'calm, hopeful, determined',
        generatedAt: new Date()
      },
      userReflection: 'My personal reflection on this session',
      goals: [
        { id: '1', text: 'Complete daily meditation', completed: false, createdAt: new Date() },
        { id: '2', text: 'Practice gratitude journaling', completed: true, createdAt: new Date() }
      ],
      aiReflection: {
        conversationalHighlights: 'Key moments from our conversation',
        actionableItems: ['Item 1', 'Item 2'],
        emotionalInsights: 'Emotional growth observations',
        progressReflection: 'Progress made in this session',
        encouragingMessage: 'You are making great progress',
        reflectionPrompts: ['What did you learn?', 'How will you apply this?'],
        generatedAt: new Date()
      }
    };
  });

  describe('prepareSessionDataForPDF', () => {
    test('should prepare session data correctly', () => {
      const pdfData = prepareSessionDataForPDF(mockSessionData);

      expect(pdfData.sessionId).toBe(mockSessionData.sessionId);
      expect(pdfData.circumstance).toBe(mockSessionData.circumstance);
      expect(pdfData.startTime).toEqual(mockSessionData.startTime);
      expect(pdfData.summary).toBeDefined();
      expect(pdfData.userReflection).toBe(mockSessionData.userReflection);
      expect(pdfData.goals).toHaveLength(2);
      expect(pdfData.aiReflection).toBeDefined();
    });

    test('should handle missing optional fields', () => {
      const minimalSession: Partial<ProtocolSession> = {
        sessionId: 'test-123',
        userId: 'user-456',
        circumstance: 'Test',
        startTime: new Date(),
        completedPhases: 0
      };

      const pdfData = prepareSessionDataForPDF(minimalSession as ProtocolSession);

      expect(pdfData.sessionId).toBe(minimalSession.sessionId);
      expect(pdfData.summary).toBeUndefined();
      expect(pdfData.userReflection).toBeUndefined();
      expect(pdfData.goals).toBeUndefined();
      expect(pdfData.aiReflection).toBeUndefined();
    });
  });

  describe('generateSessionPDF', () => {
    test('should generate PDF blob successfully', async () => {
      const pdfData = prepareSessionDataForPDF(mockSessionData);

      pdfGenerator['doc'] = {
        output: jest.fn().mockReturnValue(
          new Blob(['pdf content'], { type: 'application/pdf' })
        )
      } as any;

      const result = await pdfGenerator.generateSessionPDF(pdfData);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    test('should handle empty session data', async () => {
      const emptyData = {
        sessionId: 'empty-session',
        circumstance: 'Empty test',
        startTime: new Date()
      };

      pdfGenerator['doc'] = {
        output: jest.fn().mockReturnValue(
          new Blob(['pdf content'], { type: 'application/pdf' })
        )
      } as any;

      const result = await pdfGenerator.generateSessionPDF(emptyData);

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('private methods', () => {
    test('should add title correctly', () => {
      // ✅ Test that the title method calls the correct PDF methods
      (pdfGenerator as any)['addTitle']('Test Title', 16);

      expect(mockJsPDFInstance.setFontSize).toHaveBeenCalledWith(16);
      expect(mockJsPDFInstance.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockJsPDFInstance.text).toHaveBeenCalled();
    });

    test('should check page breaks', () => {
      const initialY = (pdfGenerator as any)['currentY'];
      // ✅ Test the checkPageBreak method properly
      (pdfGenerator as any)['checkPageBreak'](30);

      expect(typeof (pdfGenerator as any)['currentY']).toBe('number');
      expect((pdfGenerator as any)['currentY']).toBeGreaterThanOrEqual(initialY);
    });

    test('should format dates correctly', () => {
      const testDate = new Date('2024-01-01T10:30:00Z');
      const formatted = (pdfGenerator as any)['formatDate'](testDate);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('2024');
    });
  });

  describe('content sections', () => {
    test('should add session header', () => {
      const pdfData = prepareSessionDataForPDF(mockSessionData);
      expect(() => {
        (pdfGenerator as any)['addSessionHeader'](pdfData);
      }).not.toThrow();
    });

    test('should add session summary', () => {
      const pdfData = prepareSessionDataForPDF(mockSessionData);
      expect(() => {
        (pdfGenerator as any)['addSessionSummary'](pdfData);
      }).not.toThrow();
    });

    test('should add journal section', () => {
      const pdfData = prepareSessionDataForPDF(mockSessionData);
      expect(() => {
        (pdfGenerator as any)['addJournalSection'](pdfData);
      }).not.toThrow();
    });

    test('should add empty placeholders for missing content', () => {
      expect(() => {
        (pdfGenerator as any)['addEmptyPlaceholder']('Test Section', 'No content available');
      }).not.toThrow();
    });
  });

  describe('table of contents', () => {
    test('should track TOC entries', () => {
      (pdfGenerator as any)['addTOCEntry']('Test Section', true);
      expect((pdfGenerator as any)['tocEntries']).toHaveLength(1);
      expect((pdfGenerator as any)['tocEntries'][0].title).toBe('Test Section');
      expect((pdfGenerator as any)['tocEntries'][0].hasContent).toBe(true);
    });

    test('should generate table of contents', () => {
      (pdfGenerator as any)['addTOCEntry']('Section 1', true);
      (pdfGenerator as any)['addTOCEntry']('Section 2', false);

      expect(() => {
        (pdfGenerator as any)['addTableOfContents']();
      }).not.toThrow();
    });
  });
});

// ✅ Type-safe test data factory
export const createPDFTestData = () => ({
  minimal: {
    sessionId: 'minimal-session',
    circumstance: 'Minimal test session',
    startTime: new Date()
  } as ProtocolSession,
  complete: {
    sessionId: 'complete-session',
    circumstance: 'Complete test session with all data',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    summary: {
      insightSummary: 'Comprehensive insights',
      actualReframedBelief: 'Strong new belief',
      actualLegacyStatement: 'Meaningful legacy',
      topEmotions: 'joy, peace, confidence'
    },
    userReflection: 'Deep personal reflection',
    goals: [
      { id: '1', text: 'Daily exercise', completed: false, createdAt: new Date() },
      { id: '2', text: 'Weekly therapy', completed: true, createdAt: new Date() }
    ],
    aiReflection: {
      conversationalHighlights: 'Key conversation points',
      actionableItems: ['Action 1', 'Action 2', 'Action 3'],
      emotionalInsights: 'Emotional breakthrough insights',
      progressReflection: 'Significant progress made',
      encouragingMessage: 'Continue this great work',
      reflectionPrompts: ['How do you feel?', 'What changed?']
    }
  } as ProtocolSession
});
