# Types Structure

This directory contains all TypeScript type definitions for the CognitiveInsight application, organized into focused, manageable modules.

## File Organization

### `index.ts`
Central re-export file that exposes all types from other modules. Import from here in your application code:
```typescript
import { UserProfile, ProtocolSession, ChatMessage } from '@/types';
```

### Core Domain Types

#### `base.ts`
- `BaseDocument` - Base type for all DataService operations

#### `user.ts`
- `UserProfile` - Main user profile interface
- `CognitiveProfile` - User cognitive assessment data

#### `session.ts`
- `ProtocolSession` - Main session data structure
- `ChatMessage` - Individual chat messages
- `EmotionalProgression` - Emotional tracking data
- `Goal` - User goals and objectives
- `SessionFeedback` - User feedback on sessions

#### `protocol.ts`
- Protocol phase definitions and enums
- `CognitiveEdgeProtocolInput/Output` - Protocol AI flow types
- Phase-related constants and schemas

#### `ai-flows.ts`
- AI service input/output schemas
- `ClaritySummaryInput/Output`
- `SentimentAnalysisInput/Output`
- `GoalGeneratorInput/Output`
- `JournalingAssistantInput/Output`

#### `analytics.ts`
- `CrossSessionAnalysisInput/Output` - Multi-session analysis types
- Complex analytics schemas and data structures

#### `reports.ts`
- `ClarityMap` and related node/edge types
- `InsightReport` - Generated insight reports
- `ReportData` - General report data interface
- `TrashItem` - Soft deletion tracking
- Report generation schemas

#### `authority.ts`
- `UserRole` and `Permission` enums
- `AuthorityUserProfile` - Enhanced user profile with permissions
- `AdminActionLog` - Audit trail for admin actions
- `SystemConfiguration` - System settings
- `AuthorityCollections` - Collection type mappings

### External Dependencies

#### `journals.ts`
Contains journal-specific types that are imported from this module.

## Usage Guidelines

1. **Import from index**: Always import types from the main index file
2. **Single responsibility**: Each file focuses on one domain area
3. **Clear naming**: Interface names clearly indicate their purpose
4. **Documentation**: All interfaces include JSDoc comments
5. **Dependencies**: Minimize cross-dependencies between type files

## Migration Notes

This structure replaces the previous single large `index.ts` file with focused modules. All existing imports from `@/types` will continue to work unchanged due to the re-export structure.
