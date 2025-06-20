// src/components/protocol/chat-interface.tsx
"use client";

import React, { useState, useRef, useEffect, type HTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

// This declaration allows 'maxRows' as a custom attribute on textarea elements for TypeScript
declare module 'react' {
    interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
        maxRows?: number;
    }
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (messageText: string) => Promise<void>;
  isLoadingResponse: boolean;
  currentPhaseName?: string; // Optional: for display or specific logic
}

export function ChatInterface({ messages, onSendMessage, isLoadingResponse, currentPhaseName }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the chat textarea
  const { user } = useAuth();

  const handleSend = async () => {
    if (inputText.trim() === '' || isLoadingResponse) return;
    const messageToSend = inputText.trim();
    setInputText(''); // Clear input immediately
    await onSendMessage(messageToSend);
     // After sending, reset textarea height if it was multi-line
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Or set to initial row height
      // You might need to call updateTextareaHeight logic here if you want it to go back to 1 row strictly.
      // For now, handleSend clears the text, and the useEffect dependent on inputText will re-evaluate.
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || "U";
  }

  // useEffect for auto-resizing the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const maxRowsAttr = textarea.getAttribute('maxRows') || '5';
      const maxRows = parseInt(maxRowsAttr, 10);
      // Estimate line height or get it more accurately if needed. 24px is a common estimate for 1rem font + line-height.
      // For ShadCN's Textarea, base size is 16px, line-height might be ~1.5 (24px).
      // The component itself has min-h-[80px] which is about 3 lines + padding.
      // Let's use computed style for line height for more accuracy.
      let lineHeight = 24; // Default
      const computedStyle = window.getComputedStyle(textarea);
      const lh = parseFloat(computedStyle.lineHeight);
      if (!isNaN(lh)) {
          lineHeight = lh;
      } else if (computedStyle.lineHeight === 'normal') {
          // For 'normal', estimate based on font size
          const fs = parseFloat(computedStyle.fontSize);
          if (!isNaN(fs)) lineHeight = fs * 1.2; // Common approximation for 'normal'
      }

      const maxHeight = maxRows * lineHeight + (parseFloat(computedStyle.paddingTop) || 0) + (parseFloat(computedStyle.paddingBottom) || 0);


      const updateTextareaHeight = () => {
        textarea.style.height = 'auto'; // Temporarily shrink to get correct scrollHeight
        let newScrollHeight = textarea.scrollHeight;
        
        if (newScrollHeight > maxHeight) {
          textarea.style.height = `${maxHeight}px`;
          textarea.style.overflowY = 'auto'; // Enable scroll if max height reached
        } else {
          textarea.style.height = `${newScrollHeight}px`;
          textarea.style.overflowY = 'hidden'; // Hide scroll if not needed
        }
      };

      textarea.addEventListener('input', updateTextareaHeight);
      updateTextareaHeight(); // Initial call + call when inputText changes programmatically

      return () => {
        textarea.removeEventListener('input', updateTextareaHeight);
      };
    }
  }, [inputText]); // Dependency on inputText ensures height is updated on programmatic changes too


  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-md border border-border overflow-hidden">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-end gap-3',
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.sender === 'ai' && (
                <Avatar className="h-8 w-8 self-start">
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    <Brain size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[70%] rounded-xl px-4 py-3 shadow-sm text-sm md:text-base break-words',
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                )}
              >
                {msg.text.split('\n').map((line, index, arr) => (
                    <React.Fragment key={index}>
                        {line}
                        {index < arr.length - 1 && <br />}
                    </React.Fragment>
                ))}
              </div>
              {msg.sender === 'user' && user && (
                <Avatar className="h-8 w-8 self-start">
                   <AvatarImage src={undefined} alt={user.displayName || "User"} />
                   <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.displayName)}
                   </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoadingResponse && (
            <div className="flex items-end gap-3 justify-start">
              <Avatar className="h-8 w-8 self-start">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  <Brain size={18} />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] rounded-xl px-4 py-3 shadow-sm bg-muted text-muted-foreground rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-3 md:p-4 bg-background/50">
        <div className="flex items-center gap-2 md:gap-3">
          <Textarea
            ref={textareaRef} // Assign ref
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoadingResponse ? "AI is thinking..." : `Your response for ${currentPhaseName || 'current phase'}...`}
            className="flex-grow resize-none bg-background focus-visible:ring-primary text-base"
            rows={1} // Start with 1 row
            maxRows={5} // Custom attribute for JS to pick up
            disabled={isLoadingResponse}
            aria-label="Chat input"
          />
          <Button
            onClick={handleSend}
            disabled={isLoadingResponse || inputText.trim() === ''}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Send message"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
