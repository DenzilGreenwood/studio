// src/app/(app)/journals/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Trash2, Search, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/auth-context-v2';
import { useToast } from "@/hooks/use-toast";
import { journalOperations } from '@/lib/journal-operations';
import { JournalEntry } from '@/types/journals';
import { Timestamp } from 'firebase/firestore';

// Helper function to convert timestamps to dates
const toDate = (timestamp: Timestamp | Date): Date => {
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
};

export default function JournalsPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newJournal, setNewJournal] = useState({
    title: '',
    content: '',
    tags: [] as string[]
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadJournals = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userJournals = await journalOperations.getByUser(user.uid);
      setJournals(userJournals);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load journals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadJournals();
    }
  }, [user, loadJournals]);

  const handleCreateJournal = async () => {
    if (!user || !newJournal.title.trim()) return;

    try {
      await journalOperations.create({
        userId: user.uid,
        title: newJournal.title,
        content: newJournal.content,
        tags: newJournal.tags,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          wordCount: newJournal.content.split(' ').length
        }
      });

      toast({
        title: "Success",
        description: "Journal entry created successfully!",
      });

      setNewJournal({ title: '', content: '', tags: [] });
      setIsCreatingNew(false);
      loadJournals();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create journal entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJournal = async (journalId: string) => {
    if (!user) return;
    
    try {
      await journalOperations.delete(user.uid, journalId);
      toast({
        title: "Success",
        description: "Journal entry deleted successfully.",
      });
      loadJournals();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete journal entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredJournals = journals.filter(journal =>
    journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!user) {
    return <div>Please log in to access your journals.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Journals</h1>
        <p className="text-muted-foreground">
          Capture your thoughts, reflections, and insights from your sessions.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search journals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setIsCreatingNew(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Journal Entry
        </Button>
      </div>

      {/* Create New Journal Dialog */}
      {isCreatingNew && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Journal Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Journal title..."
              value={newJournal.title}
              onChange={(e) => setNewJournal(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Write your thoughts here..."
              value={newJournal.content}
              onChange={(e) => setNewJournal(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateJournal} disabled={!newJournal.title.trim()}>
                Create Entry
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journal List */}
      {isLoading ? (
        <div className="text-center py-8">Loading journals...</div>
      ) : filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No journal entries found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start writing your first journal entry.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreatingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJournals.map((journal) => (
            <Card key={journal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{journal.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {toDate(journal.metadata.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/journals/${journal.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteJournal(journal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {journal.content}
                </p>
                {journal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {journal.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                  <span>{journal.metadata.wordCount} words</span>
                  <span>Updated {toDate(journal.metadata.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
