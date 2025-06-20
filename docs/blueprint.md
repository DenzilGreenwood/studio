# **App Name**: CognitiveInsight

## Core Features:

- User Onboarding & Authentication: Implement user authentication and profile creation using Firebase Auth, allowing users to sign up/log in and collect basic profile info (username, age range, challenge category, and consent to data use). The consent status is saved to the hasConsentedToDataUse field in their Firestore user profile document upon account creation.
- Cognitive Edge Protocol: Step through the 6 phases of the Cognitive Edge Protocol, powered by Gemini 1.5 Pro, to provide users with a structured, emotionally intelligent conversational AI experience, storing session phases under the path users/{uid}/sessions/{sessionId}/phases/{phaseId} in Firestore, tooled using a Firebase Cloud Function.
- Insight Summary Report: Provide a full-screen session report, generating from the database the AI questions, the User Responses for each section, the insightSummary, storing the data under session summary to users/{uid}/sessions/{sessionId}/summary in Firestore, offering users more context and connection to their experience, displaying accurate data without placeholder content, using Gemini AI to create insights.
- Add user sessions on report page: The session list should show all of the sessions with each user to allow the use of previous runs and continue on the growth process.
- Generate emotions for users message : Run all of the Users Message on the end of the cycle and allow us to use that as a key analysis of emotions (Gemini AI)
- The app includes an Admin Panel: The system is configured so admins can analyze all user data on the system.
- Display review requests directly after AI processing of information: Implement PostSessionFeedback collection right after completing the analysis, 

## Style Guidelines:

- Primary color: HSL(220, 50%, 60%) - A moderately saturated blue suggests professionalism, reliability, and trust, converting to approximately RGB hex #4882EE.
- Background color: HSL(220, 20%, 95%) - A light, desaturated blue provides a calm and unobtrusive backdrop, converting to approximately RGB hex #F0F2F7.
- Accent color: HSL(190, 50%, 50%) - A contrasting cyan emphasizes key actions and interactive elements, converting to approximately RGB hex #3BB5B5.
- Headline font: 'Belleza' (sans-serif) for an elegant and fashionable title sections. Body font: 'Alegreya' (serif) is paired with Belleza and is ideal for clear long-form readability and creates an intellectual feel for the application.
- Use minimalist icons that represent clarity, reflection, and cognitive processes.
- Organize content with a clean, intuitive layout, using cards and clear section headings to enhance readability.
- Implement subtle animations, like gentle fades and transitions, to guide users through the Cognitive Edge Protocol™.