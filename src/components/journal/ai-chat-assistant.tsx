// src/components/journal/ai-chat-assistant.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Loader2, Sparkles, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

interface AiChatAssistantProps {
  sessionSummary: string;
  reframedBelief: string;
  legacyStatement: string;
  topEmotions: string;
  circumstance: string;
  currentReflection?: string;
  currentGoals?: string[];
}

export function AiChatAssistant({
  sessionSummary,
  reframedBelief,
  legacyStatement,
  topEmotions,
  circumstance,
  currentReflection,
  currentGoals
}: AiChatAssistantProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      message: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsChatting(true);

    try {
      const response = await fetch('/api/journaling-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionSummary,
          reframedBelief,
          legacyStatement,
          topEmotions,
          circumstance,
          userMessage: currentMessage,
          conversationHistory: chatMessages,
          currentReflection,
          currentGoals
        })
      });

      const data = await response.json();

      const aiMessage: ChatMessage = {
        role: 'assistant',
        message: data.response,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'Could not send your message. Please try again.'
      });
    } finally {
      setIsChatting(false);
    }
  };

  const startConversation = () => {
    setIsOpen(true);
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        message: `Hi! I'm here to help you reflect on your session about "${circumstance}". What would you like to explore about your experience today?`,
        timestamp: new Date().toISOString()
      };
      setChatMessages([welcomeMessage]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>AI Journaling Assistant</CardTitle>
          </div>
          <Button 
            variant={isOpen ? "outline" : "default"}
            onClick={() => isOpen ? setIsOpen(false) : startConversation()}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isOpen ? 'Close Chat' : 'Chat with AI'}
          </Button>
        </div>
        <CardDescription>
          Have a conversation about your session to deepen your reflection
        </CardDescription>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="h-80 w-full rounded-md border p-4">
            <div className="space-y-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-3 w-3 text-pink-500" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Share your thoughts or ask a question..."
              className="flex-1"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!currentMessage.trim() || isChatting}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            💡 The AI knows about your session and can help you explore your insights deeper
          </div>
        </CardContent>
      )}
    </Card>
  );
}
