// src/lib/clipboard-utils.ts
"use client";

import { toast } from "@/hooks/use-toast";

export const copyToClipboard = async (text: string, elementId?: string) => {
  try {
    // Use modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Text copied to clipboard!" });
      return;
    }
    
    // Fallback for older browsers or insecure contexts
    throw new Error('Clipboard API not available');
  } catch {
    // Auto-select the text and show instructions for manual copying
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
    
    toast({ 
      title: "Copy Manually", 
      description: "The text is now selected. Press Ctrl+C (or Cmd+C) to copy.",
      duration: 5000
    });
  }
};

export const selectAllText = (elementId: string, showToast = true) => {
  const element = document.getElementById(elementId);
  if (element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    if (showToast) {
      toast({ 
        title: "Text Selected", 
        description: "Press Ctrl+C (or Cmd+C) to copy" 
      });
    }
  }
};
