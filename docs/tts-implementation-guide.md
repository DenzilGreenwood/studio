# Text-to-Speech (TTS) Implementation Guide

## Overview
The CognitiveInsight app now includes advanced Text-to-Speech functionality using Google Cloud Text-to-Speech API with high-quality neural voices. This feature enhances accessibility and provides a more immersive experience during protocol sessions.

## Features Added

### 🎵 **Core TTS Functionality**
- **High-Quality Voice**: Uses Google's Chirp3-HD-Achird neural voice for natural-sounding speech
- **Smart Text Processing**: Automatically cleans markdown and formats text for optimal TTS output
- **Audio Controls**: Play, pause, stop, and resume functionality
- **Auto-play Option**: Configurable auto-play for new AI responses

### 🔧 **User Settings**
- **Enable/Disable TTS**: Toggle TTS functionality on/off
- **Auto-play Control**: Choose whether new AI messages auto-play
- **Persistent Settings**: User preferences saved to localStorage
- **Settings UI**: Easy-to-use settings panel in the protocol interface

### 🎯 **Smart Integration**
- **Context-Aware**: Only shows TTS controls for AI messages
- **Latest Message Priority**: Auto-play only applies to the most recent AI response
- **Error Handling**: Graceful fallback when TTS is unavailable
- **Performance Optimized**: Efficient audio management and cleanup

## Setup Instructions

### 1. Google Cloud Configuration

#### Option A: API Key (Recommended for development)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Text-to-Speech API**
4. Navigate to **APIs & Services > Credentials**
5. Click **Create Credentials > API Key**
6. (Optional but recommended) Restrict the API key:
   - Click on the created API key
   - Under "API restrictions" select "Restrict key"
   - Choose "Text-to-Speech API"
7. Copy the API key

#### Option B: Service Account (Recommended for production)
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > Service Account**
3. Fill in service account details
4. Grant the service account the **Text-to-Speech User** role
5. Create and download a JSON key file
6. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### 2. Environment Variables

Add to your `.env.local` file:

```bash
# For API Key authentication
GOOGLE_CLOUD_TTS_API_KEY=your_api_key_here

# OR for Service Account authentication
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 3. Verify Setup

1. Start your development server: `npm run dev`
2. Navigate to the protocol page
3. Look for the TTS settings button (volume icon with gear)
4. Send a message and check if TTS controls appear on AI responses

## File Structure

```
src/
├── app/api/tts/
│   └── route.ts                 # TTS API endpoint
├── components/ui/
│   ├── tts-control.tsx          # Audio control component
│   └── tts-settings.tsx         # Settings panel component
├── hooks/
│   └── use-tts-settings.ts      # Settings management hook
├── lib/
│   └── tts-service.ts           # Core TTS service
└── components/protocol/
    └── chat-interface.tsx       # Updated with TTS integration
```

## API Endpoints

### POST `/api/tts`
Synthesizes text to speech using Google Cloud TTS.

**Request Body:**
```json
{
  "input": {
    "markup": "Hello, how can I help you?"
  },
  "voice": {
    "languageCode": "en-US",
    "name": "en-US-Chirp3-HD-Achird",
    "voiceClone": {}
  },
  "audioConfig": {
    "audioEncoding": "LINEAR16",
    "speakingRate": 1.0,
    "pitch": 0.0
  }
}
```

**Response:**
```json
{
  "audioContent": "base64_encoded_audio_data"
}
```

## Usage Examples

### Basic TTS Control
```tsx
import { TTSControl } from '@/components/ui/tts-control';

// Basic usage
<TTSControl text="Hello, this is a test message" />

// With auto-play
<TTSControl 
  text="This will auto-play" 
  autoPlay={true} 
/>

// Custom styling
<TTSControl 
  text="Custom styled button" 
  size="lg"
  variant="outline"
/>
```

### Settings Management
```tsx
import { useTTSSettings } from '@/hooks/use-tts-settings';

function MyComponent() {
  const { settings, toggleEnabled, toggleAutoPlay } = useTTSSettings();
  
  return (
    <div>
      <p>TTS Enabled: {settings.enabled ? 'Yes' : 'No'}</p>
      <button onClick={toggleEnabled}>Toggle TTS</button>
      <button onClick={toggleAutoPlay}>Toggle Auto-play</button>
    </div>
  );
}
```

### Direct Service Usage
```tsx
import { ttsService } from '@/lib/tts-service';

// Play text
await ttsService.playText("Hello world");

// Play with custom options
await ttsService.playText("Hello world", {
  speakingRate: 1.2,
  pitch: 0.5
});

// Control playback
ttsService.pause();
ttsService.resume();
ttsService.stop();
```

## Customization Options

### Voice Configuration
Currently using `en-US-Chirp3-HD-Achird`. To change voice:

1. Update `tts-service.ts`:
```typescript
voice: {
  languageCode: "en-US",
  name: "en-US-Neural2-F", // Change this
  voiceClone: {}
}
```

2. Available voices can be found in [Google's documentation](https://cloud.google.com/text-to-speech/docs/voices)

### Audio Settings
Modify `tts-service.ts` to add more audio configuration options:

```typescript
audioConfig: {
  audioEncoding: "LINEAR16",
  speakingRate: 1.0,    // 0.25 to 4.0
  pitch: 0.0,           // -20.0 to 20.0
  volumeGainDb: 0.0,    // -96.0 to 16.0
  effectsProfileId: ["headphone-class-device"]
}
```

## Troubleshooting

### Common Issues

1. **"TTS API key not configured" error**
   - Ensure `GOOGLE_CLOUD_TTS_API_KEY` is set in `.env.local`
   - Restart your development server after adding the variable

2. **"Audio unavailable" error**
   - Check your internet connection
   - Verify the API key has proper permissions
   - Check browser console for detailed error messages

3. **No audio plays**
   - Ensure browser allows autoplay (some browsers block it)
   - Check if TTS is enabled in settings
   - Verify audio isn't muted

4. **API quota exceeded**
   - Google Cloud TTS has usage limits
   - Check your quota in Google Cloud Console
   - Consider implementing caching for repeated text

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+)
- **Mobile**: Supported on modern mobile browsers

### Performance Considerations
- Audio files are generated on-demand (no caching currently)
- Each TTS request counts toward Google Cloud quota
- Consider implementing client-side caching for repeated phrases

## Security Notes

1. **API Key Protection**: Never expose your API key in client-side code
2. **Rate Limiting**: Consider implementing rate limiting on the `/api/tts` endpoint
3. **Content Filtering**: The service automatically cleans text, but consider additional sanitization for user-generated content
4. **CORS**: The API endpoint is protected and only accessible from your domain

## Future Enhancements

### Potential Improvements
1. **Voice Selection**: UI for users to choose different voices
2. **Speed Control**: User-adjustable playback speed
3. **Caching**: Client-side caching of synthesized audio
4. **Offline Mode**: Fallback to browser's built-in speech synthesis
5. **Bookmarking**: Save and replay specific messages
6. **Transcript Highlighting**: Visual indication of currently spoken words

### Advanced Features
1. **SSML Support**: Enhanced text markup for better pronunciation
2. **Custom Voice Training**: Train voices on specific terminology
3. **Multi-language Support**: Dynamic language detection and voice switching
4. **Audio Quality Options**: Bandwidth-based quality adjustment

## Cost Considerations

Google Cloud Text-to-Speech pricing (as of 2024):
- **WaveNet voices**: $16.00 per 1M characters
- **Neural2 voices**: $16.00 per 1M characters  
- **Chirp voices**: $16.00 per 1M characters
- **Free tier**: 1M characters per month

A typical AI response (~100 characters) costs approximately $0.0016.

## Support

For issues related to:
- **Google Cloud TTS**: Check [Google Cloud Documentation](https://cloud.google.com/text-to-speech/docs)
- **Implementation**: Review this documentation and check browser console for errors
- **Browser Issues**: Ensure modern browser with HTML5 audio support

The TTS implementation is now ready for production use with proper Google Cloud configuration!
