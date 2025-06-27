// src/components/ui/tts-settings.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings, Volume2 } from 'lucide-react';
import { useTTSSettings } from '@/hooks/use-tts-settings';

export function TTSSettings() {
  const { settings, toggleEnabled, toggleAutoPlay, isLoaded } = useTTSSettings();

  if (!isLoaded) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Volume2 className="h-4 w-4" />
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Audio Settings</h4>
            <p className="text-sm text-muted-foreground">
              Configure text-to-speech preferences
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="tts-enabled" 
                className="text-sm font-normal"
              >
                Enable text-to-speech
              </Label>
              <Switch
                id="tts-enabled"
                checked={settings.enabled}
                onCheckedChange={toggleEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="tts-autoplay" 
                className="text-sm font-normal"
              >
                Auto-play AI responses
              </Label>
              <Switch
                id="tts-autoplay"
                checked={settings.autoPlay}
                onCheckedChange={toggleAutoPlay}
                disabled={!settings.enabled}
              />
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Uses Google Cloud Text-to-Speech with high-quality neural voices
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
