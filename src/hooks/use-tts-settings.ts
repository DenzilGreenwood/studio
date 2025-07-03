// src/hooks/use-tts-settings.ts
"use client";

import { useState, useEffect } from 'react';

interface TTSSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: string;
  speed: number;
  pitch: number;
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: true,
  autoPlay: false, // Disabled by default due to browser audio policies requiring user interaction
  voice: 'en-US-Chirp3-HD-Achird',
  speed: 1.0,
  pitch: 1.0,
};

const STORAGE_KEY = 'cognitive-insight-tts-settings';

export function useTTSSettings() {
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading TTS settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage when they change
  const updateSettings = (newSettings: Partial<TTSSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  };

  const toggleEnabled = () => {
    updateSettings({ enabled: !settings.enabled });
  };

  const toggleAutoPlay = () => {
    updateSettings({ autoPlay: !settings.autoPlay });
  };

  return {
    settings,
    isLoaded,
    updateSettings,
    toggleEnabled,
    toggleAutoPlay,
  };
}
