// src/lib/tts-service.ts
interface TTSRequest {
  input: {
    text: string;  // Changed from 'markup' to 'text' as per Google TTS API
  };
  voice: {
    languageCode: string;
    name: string;
  };
  audioConfig: {
    audioEncoding: string;
    speakingRate?: number;
    pitch?: number;
  };
}

interface TTSResponse {
  audioContent: string; // Base64 encoded audio
}

class TextToSpeechService {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private onPlayingStateChange?: (isPlaying: boolean) => void;
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.speechSynthesis = window.speechSynthesis;
      
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.onPlayingStateChange?.(false);
      });
      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        this.onPlayingStateChange?.(false);
      });
      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        this.onPlayingStateChange?.(true);
      });
    }
  }

  setPlayingStateChangeCallback(callback: (isPlaying: boolean) => void) {
    this.onPlayingStateChange = callback;
  }

  // Use browser's Speech Synthesis API as primary method
  async playTextWithSpeechSynthesis(text: string, options?: { speakingRate?: number; pitch?: number }): Promise<void> {
    if (!this.speechSynthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Stop any current speech
    this.stop();

    const cleanText = this.cleanTextForTTS(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configure voice settings
    utterance.rate = options?.speakingRate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = 1.0;
    
    // Try to find a good English voice
    const voices = this.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && (voice.name.includes('Google') || voice.name.includes('Chrome'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.isPlaying = true;
      this.onPlayingStateChange?.(true);
    };
    
    utterance.onend = () => {
      this.isPlaying = false;
      this.onPlayingStateChange?.(false);
      this.currentUtterance = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isPlaying = false;
      this.onPlayingStateChange?.(false);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.speechSynthesis.speak(utterance);
  }

  async synthesizeText(text: string, options?: { speakingRate?: number; pitch?: number }): Promise<string> {
    try {
      // Clean the text for better TTS
      const cleanText = this.cleanTextForTTS(text);
      
      const requestBody: TTSRequest = {
        input: {
          text: cleanText  // Changed from 'markup' to 'text' as required by Google TTS API
        },
        voice: {
          languageCode: "en-US",
          name: "en-US-Standard-C", // Using a standard voice that's guaranteed to exist
          // Removed voiceClone as it's not a standard field
        },
        audioConfig: {
          audioEncoding: "LINEAR16", // Using LINEAR16 for better compatibility
          speakingRate: options?.speakingRate || 1.0,
          pitch: options?.pitch || 0.0
        }
      };

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TTS API request failed: ${response.status} - ${errorText}`);
        throw new Error(`TTS API request failed: ${response.status}`);
      }

      const data: TTSResponse = await response.json();
      return data.audioContent;
    } catch (error) {
      console.error('Error synthesizing text:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  async playText(text: string, options?: { speakingRate?: number; pitch?: number }): Promise<void> {
    // Try cloud TTS first if available (better quality)
    try {
      if (!this.audioElement) {
        throw new Error('Audio element not available');
      }

      // Stop any currently playing audio
      this.stop();

      const audioContent = await this.synthesizeText(text, options);
      
      // Convert base64 to blob and create object URL
      const audioBlob = this.base64ToBlob(audioContent, 'audio/wav'); // LINEAR16 is WAV format
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audioElement.src = audioUrl;
      await this.audioElement.play();
      
      // Clean up the object URL when audio ends
      this.audioElement.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      }, { once: true });
      
    } catch (error) {
      console.warn('Cloud TTS failed, falling back to browser Speech API:', error);
      
      // Fallback to browser Speech Synthesis API
      if (this.speechSynthesis) {
        try {
          await this.playTextWithSpeechSynthesis(text, options);
          return;
        } catch (speechError) {
          console.error('Both TTS methods failed:', speechError);
          throw new Error('Text-to-speech is currently unavailable');
        }
      } else {
        console.error('Error playing text:', error);
        throw error;
      }
    }
  }

  stop(): void {
    // Stop speech synthesis
    if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    
    // Stop audio element
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    
    this.isPlaying = false;
    this.currentUtterance = null;
    this.onPlayingStateChange?.(false);
  }

  pause(): void {
    // Pause speech synthesis
    if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.pause();
    }
    
    // Pause audio element
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    
    this.isPlaying = false;
    this.onPlayingStateChange?.(false);
  }

  resume(): void {
    // Resume speech synthesis
    if (this.speechSynthesis && this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
    }
    
    // Resume audio element
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private cleanTextForTTS(text: string): string {
    // Remove markdown formatting
    let cleaned = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/`(.*?)`/g, '$1')       // Remove code markdown
      .replace(/#{1,6}\s/g, '')        // Remove header markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, '. ')           // Replace line breaks with periods
      .replace(/\s+/g, ' ')            // Normalize spaces
      .trim();

    // Add natural pauses for better speech flow
    cleaned = cleaned
      .replace(/\?\s/g, '? ')
      .replace(/!\s/g, '! ')
      .replace(/\.\s/g, '. ')
      .replace(/,\s/g, ', ');

    return cleaned;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}

// Export a singleton instance
export const ttsService = new TextToSpeechService();
