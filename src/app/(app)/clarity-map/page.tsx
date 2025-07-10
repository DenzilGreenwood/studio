// src/app/(app)/clarity-map/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Edit, Trash2, Search, FileText } from 'lucide-react';
import { ClarityMapComponent } from '@/components/clarity-map';
import { useAuth } from '@/context/auth-context-v2';
import { useEncryption } from '@/lib/encryption-context';
import { useToast } from "@/hooks/use-toast";
import { clarityMapOperations } from '@/lib/clarity-map-operations';
import { ClarityMap } from '@/types';

export default function ClarityMapPage() {
  const [clarityMaps, setClarityMaps] = useState<ClarityMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<ClarityMap | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const { user } = useAuth();
  const { userPassphrase } = useEncryption();
  const { toast } = useToast();
  const router = useRouter();

  const loadClarityMaps = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const maps = await clarityMapOperations.getByUser(user.uid, userPassphrase || undefined);
      setClarityMaps(maps);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load clarity maps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userPassphrase, toast]);

  useEffect(() => {
    if (user) {
      loadClarityMaps();
    }
  }, [user, loadClarityMaps]);

  const handleSaveMap = async (map: ClarityMap) => {
    try {
      if (map.id && clarityMaps.find(m => m.id === map.id)) {
        await clarityMapOperations.update(map);
        setClarityMaps(prev => prev.map(m => m.id === map.id ? map : m));
        toast({
          title: "Success",
          description: "Clarity map updated successfully!",
        });
      } else {
        await clarityMapOperations.create(map);
        setClarityMaps(prev => [map, ...prev]);
        toast({
          title: "Success",
          description: "Clarity map created successfully!",
        });
      }
      setIsCreatingNew(false);
      setSelectedMap(null);
      setViewMode('list');
    } catch {
      toast({
        title: "Error",
        description: "Failed to save clarity map. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      await clarityMapOperations.delete(mapId);
      setClarityMaps(prev => prev.filter(m => m.id !== mapId));
      toast({
        title: "Success",
        description: "Clarity map deleted successfully!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete clarity map. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateInsightReport = (map: ClarityMap) => {
    const searchParams = new URLSearchParams({
      clarityMapId: map.id,
      title: `Insight Report - ${map.title}`
    });
    router.push(`/insight-report?${searchParams.toString()}`);
  };

  const filteredMaps = clarityMaps.filter(map =>
    map.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (map.sessionId && map.sessionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (viewMode === 'map') {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8 h-screen">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isCreatingNew ? 'Create New Clarity Map' : selectedMap ? `Edit: ${selectedMap.title}` : 'Clarity Map'}
          </h1>
          <Button 
            onClick={() => {
              setViewMode('list');
              setIsCreatingNew(false);
              setSelectedMap(null);
            }}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Back to List
          </Button>
        </div>
        
        <div className="h-full">
          <ClarityMapComponent
            existingMap={selectedMap || undefined}
            onSave={handleSaveMap}
            readonly={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Clarity Maps</h1>
        <Button 
          onClick={() => {
            setIsCreatingNew(true);
            setSelectedMap(null);
            setViewMode('map');
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Map
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clarity maps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaps.map((map) => (
            <Card key={map.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-1">{map.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMap(map);
                        setViewMode('map');
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMap(map);
                        setViewMode('map');
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMap(map.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {map.nodes.length} nodes
                    </Badge>
                    <Badge variant="secondary">
                      {map.edges.length} connections
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {map.metadata.createdAt instanceof Date ? 
                      map.metadata.createdAt.toLocaleDateString() : 
                      new Date(map.metadata.createdAt.seconds * 1000).toLocaleDateString()}</p>
                    <p>Updated: {map.metadata.updatedAt instanceof Date ? 
                      map.metadata.updatedAt.toLocaleDateString() : 
                      new Date(map.metadata.updatedAt.seconds * 1000).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {map.nodes.slice(0, 3).map((node, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {node.type}: {node.data.label.slice(0, 20)}...
                      </Badge>
                    ))}
                    {map.nodes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{map.nodes.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMap(map);
                        setViewMode('map');
                      }}
                      className="flex-1"
                    >
                      View Map
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateInsightReport(map)}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredMaps.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold mb-2">No clarity maps found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? 
              "No maps match your search. Try adjusting your search terms." :
              "Create your first clarity map to start visualizing your thoughts and insights."
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedMap(null);
                setViewMode('map');
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Map
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
