# Genkit Integration Setup

This document outlines how your Cognitive Edge Protocol app integrates with Genkit for Gemini AI.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Required: Google AI API Key
GOOGLE_API_KEY=your_google_api_key_here

# Firebase Configuration (if not already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### 3. Run the Application

```bash
# Start the development server
npm run dev

# Or use Genkit development mode for debugging
npm run genkit:dev
```

### 4. Health Check

Visit `http://localhost:3000/api/health` to verify all components are working properly.

## Genkit Flows

Your app uses four main Genkit flows:

### 1. Cognitive Edge Protocol Flow
- **Purpose**: Orchestrates the 6-phase consulting conversation
- **Input**: User input, current phase, session history
- **Output**: AI response, next phase, updated session history

### 2. Clarity Summary Flow
- **Purpose**: Generates insight summaries after sessions
- **Input**: Reframed belief, legacy statement, top emotions
- **Output**: Formatted insight summary

### 3. Sentiment Analysis Flow
- **Purpose**: Analyzes user emotions throughout conversation
- **Input**: Concatenated user messages
- **Output**: List of detected emotions

### 4. Goal Generator Flow
- **Purpose**: Creates actionable goals based on session outcomes
- **Input**: Session summary, user reflection
- **Output**: Array of suggested goals

## Development Commands

```bash
# Start Genkit development server with flow debugging
npm run genkit:dev

# List all available flows
npm run genkit:flows

# View flow execution traces
npm run genkit:trace

# Check application health
npm run health
```

## Architecture

```
src/
├── ai/
│   ├── genkit.ts           # Main Genkit configuration
│   ├── dev.ts             # Development configuration
│   └── flows/             # AI flow definitions
│       ├── cognitive-edge-protocol.ts
│       ├── clarity-summary-generator.ts
│       ├── sentiment-analysis-flow.ts
│       └── goal-generator-flow.ts
├── lib/
│   └── genkit-utils.ts    # Error handling and utilities
└── app/
    └── api/
        ├── genkit/        # Genkit API endpoint
        └── health/        # Health check endpoint
```

## Error Handling

The app includes robust error handling:

- **Automatic retries** with exponential backoff
- **Detailed logging** for debugging
- **User-friendly error messages**
- **Health monitoring** for all flows

## Troubleshooting

### Common Issues

1. **"API_KEY" error**: Check your `GOOGLE_API_KEY` in `.env.local`
2. **Flow not found**: Ensure all flows are properly imported in `dev.ts`
3. **Rate limiting**: The app will automatically retry with backoff
4. **Model errors**: Check the health endpoint for detailed status

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging:

```bash
NODE_ENV=development npm run dev
```

## Production Deployment

1. Set `GENKIT_ENV=prod` in production environment
2. Ensure all environment variables are configured
3. Monitor the health endpoint for system status
4. Consider implementing monitoring/alerting for flow failures
