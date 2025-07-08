
# CognitiveInsight Data Architecture

## 1. Overview

This document outlines the complete data storage architecture for the CognitiveInsight application. The architecture is designed around two core principles:

- **Zero-Knowledge Encryption**: All sensitive user data is encrypted on the client-side (in the browser) before being sent to our servers. Only the user, with their unique passphrase, can decrypt and view their data. This means even CognitiveInsight staff cannot access user content.
- **Scalable Data Modeling**: The Firestore data is structured to separate raw interaction logs from clean, final reports, ensuring the application remains fast and maintainable as it grows.

---

## 2. Firestore Data Model

Our database is structured into several collections to logically organize different types of user data.

### `/users/{userId}`

This is the root document for each user, storing their public profile and links to their private, encrypted data.

- **Purpose**: Stores the core `UserProfile`.
- **Encryption**: Sensitive fields like `displayName` are encrypted. The `email` remains unencrypted for authentication purposes.
- **Data Stored**:
  - `uid`, `email`
  - `displayName_encrypted`
  - `encryptedPassphrase` (The user's passphrase, itself encrypted with the recovery key)
  - Timestamps and other non-sensitive metadata.

---

### `/users/{userId}/sessions/{sessionId}`

This collection stores the raw, timestamped log of a user's interaction during a cognitive protocol session.

- **Purpose**: Tracks the state and progress of a single, live session.
- **Encryption**: The `circumstance` (the topic of the session) is encrypted.
- **Data Stored**:
  - `startTime`, `endTime`, `completedPhases`
  - `circumstance_encrypted`
  - `isDeleted` flag for the trash system.

---

### `/users/{userId}/sessions/{sessionId}/messages/{messageId}`

This subcollection holds the complete, encrypted conversation for a specific session.

- **Purpose**: Stores every message exchanged between the user and the AI.
- **Encryption**: The `text` of every message is encrypted.
- **Data Stored**:
  - `sender` ('user' or 'ai')
  - `text_encrypted`
  - `timestamp`, `phaseName`

---

### `/users/{userId}/reports/{reportId}`

This collection stores the clean, final summary reports generated after a session is completed.

- **Purpose**: Provides a user-friendly, structured summary without the raw chat log. It separates the final "artifact" from the "process."
- **Encryption**: All meaningful content within the report is encrypted.
- **Data Stored**:
  - `reportId`, `sessionId`, `userId`
  - `insights_encrypted` (contains breakthroughs, reframed beliefs, etc.)
  - `actionableOutcomes_encrypted` (goals, reflection prompts)
  - Other non-sensitive metadata like `duration` and `generatedAt`.

---

### `/clarityMaps/{mapId}`

A top-level collection for storing user-created Clarity Maps. These are not necessarily tied to a single session.

- **Purpose**: Stores the nodes, edges, and structure of a visual mind map.
- **Encryption**: All map content, including node labels and positions, is stored within a single `encryptedData` blob.
- **Data Stored**:
  - `mapId`, `userId`, `sessionId` (optional link)
  - `title_encrypted`
  - `encryptedData` (contains all nodes and edges)
  - `salt`, `iv` for decryption.

---

### `/insightReports/{reportId}`

A top-level collection for rich-text Insight Reports created by the user, which can be linked to sessions or clarity maps.

- **Purpose**: Stores user-authored rich text documents.
- **Encryption**: The entire report content and title are stored in an `encryptedContent` blob.
- **Data Stored**:
  - `reportId`, `userId`, `sessionId` (optional), `clarityMapId` (optional)
  - `encryptedContent` (contains title and all rich text sections)
  - `salt`, `iv` for decryption.

---

## 3. Data Flow & Lifecycle

1.  **Session Start**: A new document is created in `/users/{userId}/sessions/{sessionId}`.
2.  **Conversation**: Each message is encrypted and added to the `/messages` subcollection.
3.  **Session Complete**:
    - The `completedPhases` in the session document is updated.
    - A server-side process (Genkit flow) reads the encrypted messages, generates a summary, and creates a new, clean document in `/users/{userId}/reports/{reportId}`. The new report is also fully encrypted.
4.  **Clarity Map/Insight Report Creation**: When a user creates a map or report, a new document is created in the corresponding top-level collection (`/clarityMaps` or `/insightReports`), with all its content encrypted.

This structure ensures that all user data is captured, securely encrypted, and organized logically for efficient retrieval and use within the application.
