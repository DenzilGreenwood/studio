# Clarity Map™ and Insight Report™ Features

This document describes the implementation of two new features added to the application:

## 🗺️ Clarity Map™

### Overview
A visual mind mapping tool that allows users to create interactive diagrams to organize thoughts, emotions, challenges, beliefs, and insights.

### Features
- **Interactive Node Creation**: Create four types of nodes:
  - 🎭 **Emotions**: Capture feelings and emotional states
  - 🎯 **Challenges**: Identify problems and obstacles
  - 💭 **Beliefs**: Document beliefs and assumptions
  - 💡 **Insights**: Record breakthrough moments and realizations
- **Visual Connections**: Connect nodes with labeled relationships
- **Drag & Drop Interface**: Intuitive node positioning
- **Auto-layout**: Automatic node arrangement for better visualization
- **Export as Image**: Save maps as PNG files
- **Encryption**: All data is encrypted client-side using user passphrase
- **Mobile Responsive**: Works on desktop and mobile devices

### Technical Implementation
- **Components**: `src/components/clarity-map/clarity-map.tsx`
- **Page**: `src/app/(app)/clarity-map/page.tsx`
- **Operations**: `src/lib/clarity-map-operations.ts`
- **Types**: `src/types/index.ts` (ClarityMap, ClarityMapNode, ClarityMapEdge)
- **Libraries**: React Flow, HTML2Canvas, UUID

### Usage
1. Navigate to "Clarity Map" in the app header
2. Click "Create New Map" to start
3. Add nodes by clicking the type buttons (Emotion, Challenge, Belief, Insight)
4. Click on nodes to edit their content
5. Connect nodes by dragging from one to another
6. Save your map to encrypted storage
7. Export as image for sharing or external use

## 📊 Insight Report™

### Overview
A rich text report generation tool that creates comprehensive session summaries with AI assistance.

### Features
- **Rich Text Editor**: Full-featured text editing with formatting
- **AI-Powered Generation**: Automatically generate insights using Gemini AI
- **Section-based Structure**: Organized into key sections:
  - ✨ **Highlights & Breakthroughs**: Key moments and realizations
  - 🧠 **Patterns & Mental Models**: Recurring themes and thought patterns
  - 💭 **Reframed Beliefs**: New perspectives and changed beliefs
  - 🎯 **Legacy Statement**: Core values and identity statements
  - 🚀 **Next Steps**: Action items and reflection prompts
- **Export as PDF**: Generate professional PDF reports
- **Timeline View**: Chronological view of all reports grouped by month
- **Grid/List View**: Toggle between different viewing modes
- **Encryption**: All content encrypted client-side
- **Mobile Responsive**: Optimized for mobile and desktop

### Technical Implementation
- **Components**: `src/components/insight-report/insight-report.tsx`
- **Page**: `src/app/(app)/insight-report/page.tsx`
- **AI Flow**: `src/ai/flows/insight-report-generator.ts`
- **Operations**: `src/lib/clarity-map-operations.ts` (reused for insight reports)
- **Types**: `src/types/index.ts` (InsightReport, InsightReportGeneratorInput/Output)
- **Libraries**: React-Quill, jsPDF, HTML2Canvas, Genkit AI

### Usage
1. Navigate to "Insight Report" in the app header
2. Click "Create New Report" to start
3. Use "Generate Report" to create AI-powered content from session data
4. Edit sections using the rich text editor
5. Switch between sections using the tabbed interface
6. Preview the formatted report
7. Export as PDF or save to encrypted storage
8. View all reports in timeline or grid view

## 🔐 Security & Privacy

Both features implement zero-knowledge encryption:
- All data is encrypted client-side using the user's passphrase
- No unencrypted data is stored on the server
- Users must enter their passphrase to decrypt and view content
- AI generation is performed on decrypted data but not stored

## 📱 Mobile Responsiveness

Both features are fully responsive:
- **Mobile-First Design**: Optimized for touch interfaces
- **Responsive Layout**: Adapts to different screen sizes
- **Touch Interactions**: Supports touch gestures for node manipulation
- **Collapsible Panels**: UI elements adapt to smaller screens
- **Readable Text**: Appropriate font sizes and spacing

## 🤖 AI Integration

Insight Reports use Gemini AI for content generation:
- **Contextual Analysis**: Processes session data and clarity maps
- **Structured Output**: Generates content for each report section
- **Error Handling**: Graceful fallback when AI is unavailable
- **Customizable**: Users can edit AI-generated content
- **Privacy-Focused**: AI calls are made with minimal data exposure

## 🛠️ Development Notes

### Dependencies Added
```json
{
  "reactflow": "^11.10.1",
  "react-quill": "^2.0.0",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "uuid": "^9.0.1",
  "@types/uuid": "^9.0.7"
}
```

### Files Created/Modified
- `src/components/clarity-map/` - New component directory
- `src/components/insight-report/` - New component directory
- `src/app/(app)/clarity-map/` - New page directory
- `src/app/(app)/insight-report/` - New page directory
- `src/ai/flows/insight-report-generator.ts` - AI flow for report generation
- `src/lib/clarity-map-operations.ts` - Firestore operations
- `src/types/index.ts` - Updated with new types
- `src/components/layout/app-header.tsx` - Updated navigation

### Future Enhancements
- **Collaboration**: Real-time collaborative editing
- **Templates**: Pre-built report templates
- **Data Visualization**: Charts and graphs in reports
- **Voice Input**: Voice-to-text for mobile users
- **Advanced AI**: More sophisticated AI analysis
- **Import/Export**: Multiple file format support

## 🔄 Integration Points

### With Existing Features
- **Session Integration**: Both features integrate with existing session data
- **Encryption Context**: Uses existing encryption system
- **Authentication**: Respects user authentication state
- **Navigation**: Integrated into existing app navigation
- **Toast Notifications**: Uses existing notification system

### Navigation Integration
Both features are accessible via the main app header:
- Added "Clarity Map" and "Insight Report" menu items
- Maintains existing navigation patterns
- Responsive navigation for mobile devices

## 🎯 User Experience

### Clarity Map UX
- **Intuitive Creation**: Easy-to-understand node types with icons
- **Visual Feedback**: Color-coded nodes and connections
- **Flexible Layout**: Users can arrange nodes as needed
- **Quick Actions**: Common actions accessible via buttons
- **Preview Mode**: See maps without editing capability

### Insight Report UX
- **Guided Creation**: Tab-based interface guides users through sections
- **AI Assistance**: One-click generation with AI enhancement
- **Professional Output**: Clean, readable report format
- **Timeline Organization**: Historical view of all reports
- **Quick Access**: Easy switching between view modes

Both features follow the application's existing design patterns and user experience principles.
