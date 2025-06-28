# PDF Report Enhancements

## Overview
Enhanced the session report PDF generation with a professional cover page, table of contents, and intelligent placeholders for empty sections.

## New Features

### 1. Cover Page
- **Professional branding** with CognitiveInsight title and blue accent color
- **Session details box** containing:
  - Session ID
  - Date and time
  - Duration (if session is completed)
  - Session focus/circumstance
- **Generation timestamp** at the bottom
- **Clean, centered layout** with proper spacing

### 2. Table of Contents (TOC)
- **Automatic generation** based on content sections
- **Visual indicators** for sections with/without content:
  - Normal text for sections with content
  - Italic, grayed text for empty sections
- **Dotted lines** connecting section names to page numbers
- **Dynamic page numbering** that updates automatically

### 3. Smart Placeholders
Intelligent placeholders are shown when sections are empty, with specific messages:

#### Session Focus
- "No specific focus was set for this session"

#### Session Summary
- "Summary will be available after session completion"
- "No insights captured yet"
- "No reframed belief developed yet"
- "No legacy statement created yet"
- "No emotions identified yet"

#### Personal Journal & Reflection
- "No personal reflection entries yet"
- "No goals have been set for this session"

#### AI-Generated Insights
- "AI insights will be generated after session completion"
- "No highlights captured yet"
- "No emotional insights available yet"
- "No progress reflection available yet"
- "No actionable items identified yet"
- "No reflection prompts available yet"
- "Encouraging message will be available after session completion"

### 4. Visual Design Improvements
- **Placeholder boxes** with subtle background and border
- **Consistent typography** with proper font weights and sizes
- **Color coding** for different content states
- **Professional footer** with generation date and page numbers

## Technical Implementation

### New Interfaces
```typescript
interface TOCEntry {
  title: string;
  page: number;
  hasContent: boolean;
}
```

### Key Methods Added
- `addCoverPage()` - Creates the professional cover page
- `addTableOfContents()` - Generates the TOC with dotted lines
- `addTOCEntry()` - Registers sections for the TOC
- `addEmptyPlaceholder()` - Creates styled placeholders for empty sections

### PDF Generation Flow
1. **Cover Page** - Professional title page with session details
2. **Table of Contents** - Auto-generated based on content availability
3. **Content Sections** - With smart placeholders for empty data
4. **Footer** - Added to all pages with generation info and page numbers

## User Experience Benefits
- **Clear expectations** - Users know what to expect in each section
- **Professional appearance** - Polished, report-ready format
- **Complete documentation** - Even empty sections are acknowledged
- **Easy navigation** - TOC provides quick access to content
- **Consistent formatting** - Professional standards throughout

## Usage
The enhanced PDF generation is automatically used when clicking "Download PDF" on any session report. The system intelligently detects which sections have content and adjusts the TOC and placeholders accordingly.

## Future Enhancements
- Add more detailed session statistics to cover page
- Include session emotion progression charts
- Add custom branding options
- Implement section-specific icons in TOC
