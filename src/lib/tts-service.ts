// src/lib/tts-service.ts
interface TTSRequest {
  input: {
    markup: string;
  };
  voice: {
    languageCode: string;
    name: string;
    voiceClone?: {};
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

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
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

  async synthesizeText(text: string, options?: { speakingRate?: number; pitch?: number }): Promise<string> {
    try {
      // Clean the text for better TTS
      const cleanText = this.cleanTextForTTS(text);
      
      const requestBody: TTSRequest = {
        input: {
          markup: cleanText
        },
        voice: {
          languageCode: "en-US",
          name: "en-US-Chirp3-HD-Achird",
          voiceClone: {}
        },
        audioConfig: {
          audioEncoding: "LINEAR16",
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
    if (!this.audioElement) {
      throw new Error('Audio element not available');
    }

    try {
      // Stop any currently playing audio
      this.stop();

      const audioContent = await this.synthesizeText(text, options);
      
      // Convert base64 to blob and create object URL
      const audioBlob = this.base64ToBlob(audioContent, 'audio/wav');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audioElement.src = audioUrl;
      await this.audioElement.play();
      
      // Clean up the object URL when audio ends
      this.audioElement.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      }, { once: true });
      
    } catch (error) {
      console.error('Error playing text:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  resume(): void {
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
