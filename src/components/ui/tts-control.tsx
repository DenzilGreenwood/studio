// src/components/ui/tts-control.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play, Loader2 } from 'lucide-react';
import { ttsService } from '@/lib/tts-service';
import { useToast } from '@/hooks/use-toast';
import { useTTSSettings } from '@/hooks/use-tts-settings';

interface TTSControlProps {
  text: string;
  autoPlay?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function TTSControl({ 
  text, 
  autoPlay = false, 
  disabled = false,
  size = 'sm',
  variant = 'ghost'
}: TTSControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  const { settings, isLoaded } = useTTSSettings();

  useEffect(() => {
    // Set up the playing state callback
    ttsService.setPlayingStateChangeCallback(setIsPlaying);
    
    // Auto-play if requested and settings allow it
    if (autoPlay && text.trim() && isLoaded && settings.enabled && settings.autoPlay) {
      handlePlay();
    }

    return () => {
      // Clean up when component unmounts
      ttsService.stop();
    };
  }, [text, autoPlay, settings.enabled, settings.autoPlay, isLoaded]);

  const handlePlay = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setHasError(false);

    try {
      await ttsService.playText(text);
    } catch (error) {
      console.error('TTS Error:', error);
      setHasError(true);
      toast({
        variant: 'destructive',
        title: 'Speech Error',
        description: 'Unable to play audio. Please check your connection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    ttsService.stop();
    setIsPlaying(false);
  };

  const handlePause = () => {
    if (isPlaying) {
      ttsService.pause();
    } else {
      ttsService.resume();
    }
  };

  if (disabled || !text.trim() || !isLoaded || !settings.enabled) {
    return null;
  }

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (hasError) {
      return <VolumeX className="h-4 w-4" />;
    }
    
    if (isPlaying) {
      return <Pause className="h-4 w-4" />;
    }
    
    return <Volume2 className="h-4 w-4" />;
  };

  const getTooltip = () => {
    if (isLoading) return 'Loading audio...';
    if (hasError) return 'Audio unavailable';
    if (isPlaying) return 'Pause';
    return 'Play audio';
  };

  return (
    <div className="flex items-center gap-1">
      {!isPlaying ? (
        <Button
          variant={variant}
          size={size}
          onClick={handlePlay}
          disabled={isLoading || hasError}
          title={getTooltip()}
          className="h-8 w-8 p-0"
        >
          {getIcon()}
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant={variant}
            size={size}
            onClick={handlePause}
            title="Pause"
            className="h-8 w-8 p-0"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            variant={variant}
            size={size}
            onClick={handleStop}
            title="Stop"
            className="h-8 w-8 p-0"
          >
            <VolumeX className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
