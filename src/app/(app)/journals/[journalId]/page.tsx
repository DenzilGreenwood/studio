// src/app/(app)/journals/[journalId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useEncryption } from '@/lib/encryption-context';
import { useToast } from "@/hooks/use-toast";
import { journalOperations } from '@/lib/journal-operations';
import { JournalEntry } from '@/types/journals';
import { Timestamp } from 'firebase/firestore';
import { toDate } from '@/lib/timestamp-utils';

export default function JournalDetailPage() {
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { user } = useAuth();
  const { userPassphrase } = useEncryption();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const journalId = params.journalId as string;

  const loadJournal = useCallback(async () => {
    if (!user || !journalId) return;
    
    try {
      setIsLoading(true);
      const journalData = await journalOperations.get(user.uid, journalId, userPassphrase || undefined);
      if (journalData) {
        setJournal(journalData);
        setEditTitle(journalData.title);
        setEditContent(journalData.content);
        setEditTags(journalData.tags);
      } else {
        toast({
          title: "Error",
          description: "Journal entry not found.",
          variant: "destructive",
        });
        router.push('/journals');
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, journalId, userPassphrase, toast, router]);

  useEffect(() => {
    if (user && journalId) {
      loadJournal();
    }
  }, [user, journalId, loadJournal]);

  const handleSave = async () => {
    if (!user || !journal || !editTitle.trim()) return;

    try {
      setIsSaving(true);
      await journalOperations.update(user.uid, journal.id, {
        title: editTitle,
        content: editContent,
        tags: editTags,
        metadata: {
          ...journal.metadata,
          updatedAt: new Date(),
          wordCount: editContent.split(' ').length
        }
      });

      setJournal(prev => prev ? {
        ...prev,
        title: editTitle,
        content: editContent,
        tags: editTags,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date(),
          wordCount: editContent.split(' ').length
        }
      } : null);

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Journal entry updated successfully!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (journal) {
      setEditTitle(journal.title);
      setEditContent(journal.content);
      setEditTags(journal.tags);
    }
    setIsEditing(false);
  };

  if (!user) {
    return <div>Please log in to view your journal.</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading journal entry...</div>;
  }

  if (!journal) {
    return <div className="container mx-auto p-6">Journal entry not found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/journals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journals
        </Button>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Journal Content */}
      <Card>
        <CardHeader>
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Journal title..."
                className="text-lg font-semibold"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving || !editTitle.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <CardTitle className="text-2xl">{journal.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Created: {toDate(journal.metadata.createdAt).toLocaleDateString()}
                </span>
                <span>
                  Updated: {toDate(journal.metadata.updatedAt).toLocaleDateString()}
                </span>
                <span>{journal.metadata.wordCount} words</span>
              </div>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={20}
              className="min-h-[400px]"
            />
          ) : (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-foreground">
                {journal.content}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium mb-2">Tags</h3>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  placeholder="Add tags (comma separated)..."
                  value={editTags.join(', ')}
                  onChange={(e) => setEditTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                />
                <div className="flex flex-wrap gap-1">
                  {editTags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {journal.tags.length > 0 ? (
                  journal.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No tags</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
