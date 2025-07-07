// tests/__mocks__/jspdf.ts
const createMockjsPDF = () => ({
  // Font and text methods
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  setTextColor: jest.fn(),
  text: jest.fn(),
  getTextWidth: jest.fn().mockReturnValue(50),
  splitTextToSize: jest.fn().mockImplementation((text: string) => [text]),
  
  // Page methods
  addPage: jest.fn(),
  getPageCount: jest.fn().mockReturnValue(1),
  getNumberOfPages: jest.fn().mockReturnValue(1),
  setPage: jest.fn(),
  
  // Drawing methods
  addImage: jest.fn(),
  rect: jest.fn(),
  circle: jest.fn(),
  line: jest.fn(),
  setFillColor: jest.fn(),
  setDrawColor: jest.fn(),
  setLineWidth: jest.fn(),
  
  // Output methods
  output: jest.fn().mockImplementation((type: string) => {
    if (type === 'blob') {
      return new Blob(['mock pdf content'], { type: 'application/pdf' });
    }
    return 'mock pdf string';
  }),
  save: jest.fn(),
  
  // Internal properties
  internal: {
    pageSize: {
      getWidth: jest.fn().mockReturnValue(210),
      getHeight: jest.fn().mockReturnValue(297),
      width: 210,
      height: 297
    },
    scaleFactor: 1.33
  }
});

// Mock the default export as a constructor function
export default jest.fn().mockImplementation(() => createMockjsPDF());
