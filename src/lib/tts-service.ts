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
  private speechPromiseResolve?: () => void;
  private speechPromiseReject?: (error: Error) => void;
  private hasUserInteracted = false; // Track user interaction

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

      // Track user interaction for audio policy compliance
      const trackInteraction = () => {
        this.hasUserInteracted = true;
        document.removeEventListener('click', trackInteraction);
        document.removeEventListener('keydown', trackInteraction);
        document.removeEventListener('touchstart', trackInteraction);
      };
      
      document.addEventListener('click', trackInteraction);
      document.addEventListener('keydown', trackInteraction);
      document.addEventListener('touchstart', trackInteraction);
    }
  }

  setPlayingStateChangeCallback(callback: (isPlaying: boolean) => void) {
    this.onPlayingStateChange = callback;
  }

  // Check if user interaction is required for audio playback
  requiresUserInteraction(): boolean {
    return !this.hasUserInteracted;
  }

  // Enable audio after user interaction
  enableAudio(): void {
    this.hasUserInteracted = true;
  }

  // Use browser's Speech Synthesis API as primary method
  async playTextWithSpeechSynthesis(text: string, options?: { speakingRate?: number; pitch?: number }): Promise<void> {
    if (!this.speechSynthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Stop any current speech
    this.stop();

    return new Promise((resolve, reject) => {
      const cleanText = this.cleanTextForTTS(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Store promise handlers for error handling
      this.speechPromiseResolve = resolve;
      this.speechPromiseReject = reject;
      
      // Configure voice settings
      utterance.rate = options?.speakingRate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = 1.0;
      
      // Try to find a good English voice
      const voices = this.speechSynthesis!.getVoices();
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
        this.speechPromiseResolve?.();
        this.speechPromiseResolve = undefined;
        this.speechPromiseReject = undefined;
      };
      
      utterance.onerror = (event) => {
        const errorMessage = event.error || 'Unknown speech synthesis error';
        console.error('Speech synthesis error:', errorMessage, event);
        this.isPlaying = false;
        this.onPlayingStateChange?.(false);
        this.currentUtterance = null;
        
        this.speechPromiseReject?.(new Error(`Speech synthesis failed: ${errorMessage}`));
        this.speechPromiseResolve = undefined;
        this.speechPromiseReject = undefined;
      };

      this.currentUtterance = utterance;
      this.speechSynthesis!.speak(utterance);
    });
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
    // Check if user interaction is required (for browser audio policy compliance)
    if (this.requiresUserInteraction()) {
      throw new Error('Audio playback requires user interaction. Please click the play button first.');
    }

    // First try browser Speech Synthesis API (more reliable)
    if (this.speechSynthesis) {
      try {
        // Wait for voices to be loaded if they aren't already
        await this.ensureVoicesLoaded();
        await this.playTextWithSpeechSynthesis(text, options);
        return;
      } catch (speechError) {
        console.warn('Browser Speech API failed, trying cloud TTS:', speechError);
        
        // If it's a "not-allowed" error, don't fallback - inform user
        if (speechError instanceof Error && speechError.message.includes('not-allowed')) {
          throw new Error('Audio playback requires user interaction. Please click the play button to enable audio.');
        }
      }
    }

    // Fallback to cloud TTS
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
      
      try {
        await this.audioElement.play();
      } catch (playError) {
        // Handle audio play errors specifically
        if (playError instanceof Error && playError.name === 'NotAllowedError') {
          throw new Error('Audio playback requires user interaction. Please click the play button to enable audio.');
        }
        throw playError;
      }
      
      // Clean up the object URL when audio ends
      this.audioElement.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      }, { once: true });
      
    } catch (cloudError) {
      console.error('Cloud TTS also failed:', cloudError);
      
      // Re-throw user interaction errors without modification
      if (cloudError instanceof Error && cloudError.message.includes('user interaction')) {
        throw cloudError;
      }
      
      // Last resort: try browser speech synthesis again
      if (this.speechSynthesis) {
        try {
          await this.playTextWithSpeechSynthesis(text, options);
          return;
        } catch (finalError) {
          console.error('All TTS methods failed:', finalError);
          throw new Error('Text-to-speech is currently unavailable. Please check your internet connection or try again later.');
        }
      } else {
        throw new Error('Text-to-speech is not supported in this browser.');
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
    
    // Clean up promise handlers
    this.speechPromiseResolve = undefined;
    this.speechPromiseReject = undefined;
    
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

  private async ensureVoicesLoaded(): Promise<void> {
    if (!this.speechSynthesis) {
      throw new Error('Speech synthesis not available');
    }

    return new Promise((resolve) => {
      const voices = this.speechSynthesis!.getVoices();
      if (voices.length > 0) {
        resolve();
        return;
      }

      // Wait for voices to be loaded
      const handleVoicesChanged = () => {
        this.speechSynthesis!.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve();
      };

      this.speechSynthesis!.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout in case voiceschanged never fires
      setTimeout(() => {
        this.speechSynthesis!.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve();
      }, 3000);
    });
  }
}

// Export a singleton instance
export const ttsService = new TextToSpeechService();
