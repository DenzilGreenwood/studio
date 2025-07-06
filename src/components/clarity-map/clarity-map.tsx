// src/components/clarity-map/clarity-map.tsx
"use client";

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  Panel,
  MiniMap,
  ReactFlowInstance,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { ClarityMapNode, ClarityMapEdge, ClarityMap } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { useEncryption } from '@/lib/encryption-context';
import { encryptData } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';

// Node data type
interface NodeData {
  label: string;
  emoji?: string;
  color?: string;
  category?: string;
  intensity?: number;
  confidence?: number;
}

// Custom node types
const nodeTypes = {
  emotion: EmotionNode,
  challenge: ChallengeNode,
  belief: BeliefNode,
  insight: InsightNode,
};

// Node color schemes
const nodeColors = {
  emotion: {
    background: '#fee2e2',
    border: '#fca5a5',
    text: '#dc2626'
  },
  challenge: {
    background: '#fef3c7',
    border: '#fbbf24',
    text: '#d97706'
  },
  belief: {
    background: '#dbeafe',
    border: '#60a5fa',
    text: '#2563eb'
  },
  insight: {
    background: '#dcfce7',
    border: '#4ade80',
    text: '#16a34a'
  }
};

// Emotion emojis
const emotionEmojis = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  anxious: '😰',
  excited: '🤩',
  confused: '😕',
  peaceful: '😌',
  frustrated: '😤',
  hopeful: '🙏',
  determined: '💪',
  grateful: '🙏',
  overwhelmed: '😵'
};

interface ClarityMapProps {
  sessionId?: string;
  existingMap?: ClarityMap;
  onSave?: (map: ClarityMap) => void;
  readonly?: boolean;
}

function EmotionNode({ data, selected }: { data: NodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        backgroundColor: nodeColors.emotion.background,
        borderColor: nodeColors.emotion.border,
        color: nodeColors.emotion.text,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.emoji || '😊'}</span>
        <div>
          <div className="font-medium">{data.label}</div>
          {data.intensity && (
            <div className="text-xs opacity-75">
              Intensity: {data.intensity}/10
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChallengeNode({ data, selected }: { data: NodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        backgroundColor: nodeColors.challenge.background,
        borderColor: nodeColors.challenge.border,
        color: nodeColors.challenge.text,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        <div className="font-medium">{data.label}</div>
      </div>
    </div>
  );
}

function BeliefNode({ data, selected }: { data: NodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        backgroundColor: nodeColors.belief.background,
        borderColor: nodeColors.belief.border,
        color: nodeColors.belief.text,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">💭</span>
        <div>
          <div className="font-medium">{data.label}</div>
          {data.confidence && (
            <div className="text-xs opacity-75">
              Confidence: {data.confidence}/10
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightNode({ data, selected }: { data: NodeData; selected: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        backgroundColor: nodeColors.insight.background,
        borderColor: nodeColors.insight.border,
        color: nodeColors.insight.text,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">💡</span>
        <div className="font-medium">{data.label}</div>
      </div>
    </div>
  );
}

export function ClarityMapComponent({ 
  sessionId, 
  existingMap, 
  onSave, 
  readonly = false 
}: ClarityMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    existingMap?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(existingMap?.edges || []);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mapTitle, setMapTitle] = useState(existingMap?.title || 'My Clarity Map');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { userPassphrase } = useEncryption();

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        id: uuidv4(),
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (readonly) return;
    setSelectedNode(node);
    setIsEditing(true);
  }, [readonly]);

  const addNode = useCallback((type: 'emotion' | 'challenge' | 'belief' | 'insight') => {
    if (readonly) return;
    
    const position = reactFlowInstance?.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }) || { x: 0, y: 0 };

    const newNode: Node = {
      id: uuidv4(),
      type,
      position,
      data: {
        label: `New ${type}`,
        emoji: type === 'emotion' ? '😊' : undefined,
        intensity: type === 'emotion' ? 5 : undefined,
        confidence: type === 'belief' ? 5 : undefined,
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode);
    setIsEditing(true);
  }, [reactFlowInstance, setNodes, readonly]);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node['data']>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    setIsEditing(false);
  }, [setNodes, setEdges]);

  const saveMap = useCallback(async () => {
    if (!user || !userPassphrase) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in and have encryption enabled.",
        variant: "destructive",
      });
      return;
    }

    try {
      const mapData: ClarityMap = {
        id: existingMap?.id || uuidv4(),
        userId: user.uid,
        sessionId,
        title: mapTitle,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type as 'emotion' | 'challenge' | 'belief' | 'insight',
          position: node.position,
          data: node.data
        })) as ClarityMapNode[],
        edges: edges as ClarityMapEdge[],
        metadata: {
          createdAt: existingMap?.metadata.createdAt || new Date(),
          updatedAt: new Date(),
          version: (existingMap?.metadata.version || 0) + 1,
        },
      };

      // Encrypt the map data
      const mapJson = JSON.stringify(mapData);
      const encrypted = await encryptData(mapJson, userPassphrase);
      
      const encryptedMap: ClarityMap = {
        ...mapData,
        encryptedData: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        nodes: [], // Clear unencrypted data
        edges: [],
      };

      if (onSave) {
        onSave(encryptedMap);
      }

      toast({
        title: "Success",
        description: "Clarity map saved successfully!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save clarity map. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, userPassphrase, nodes, edges, mapTitle, sessionId, existingMap, onSave, toast]);

  const exportAsImage = useCallback(async () => {
    if (!reactFlowWrapper.current) return;

    try {
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `${mapTitle.replace(/\s+/g, '_')}_clarity_map.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Success",
        description: "Clarity map exported as image!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export map as image.",
        variant: "destructive",
      });
    }
  }, [mapTitle, toast]);

  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <div className="flex h-full flex-col lg:flex-row">
          {/* Main Flow Area */}
          <div className="flex-1 relative min-h-[400px] lg:min-h-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              {showMiniMap && <MiniMap />}
              
              <Panel position="top-left">
                <Card className="w-64 lg:w-72">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      <Input
                        value={mapTitle}
                        onChange={(e) => setMapTitle(e.target.value)}
                        className="text-sm font-medium"
                        placeholder="Enter map title..."
                        disabled={readonly}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!readonly && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => addNode('emotion')}
                          className="text-xs"
                          style={{ backgroundColor: nodeColors.emotion.border }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Emotion
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addNode('challenge')}
                          className="text-xs"
                          style={{ backgroundColor: nodeColors.challenge.border }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Challenge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addNode('belief')}
                          className="text-xs"
                          style={{ backgroundColor: nodeColors.belief.border }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Belief
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addNode('insight')}
                          className="text-xs"
                          style={{ backgroundColor: nodeColors.insight.border }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Insight
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setShowMiniMap(!showMiniMap)}
                        variant="outline"
                        className="text-xs"
                      >
                        {showMiniMap ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={exportAsImage}
                        variant="outline"
                        className="text-xs"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      {!readonly && (
                        <Button
                          size="sm"
                          onClick={saveMap}
                          className="text-xs"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Panel>
            </ReactFlow>
          </div>

          {/* Node Editor Panel */}
          {isEditing && selectedNode && (
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-background p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Edit {selectedNode.type} Node
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteNode(selectedNode.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="label">Label</Label>
                    <Textarea
                      id="label"
                      value={selectedNode.data.label}
                      onChange={(e) =>
                        updateNode(selectedNode.id, { label: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  {selectedNode.type === 'emotion' && (
                    <>
                      <div>
                        <Label htmlFor="emoji">Emoji</Label>
                        <Select
                          value={selectedNode.data.emoji}
                          onValueChange={(value) =>
                            updateNode(selectedNode.id, { emoji: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(emotionEmojis).map(([key, emoji]) => (
                              <SelectItem key={key} value={emoji}>
                                {emoji} {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="intensity">
                          Intensity: {selectedNode.data.intensity}/10
                        </Label>
                        <Slider
                          id="intensity"
                          min={1}
                          max={10}
                          step={1}
                          value={[selectedNode.data.intensity || 5]}
                          onValueChange={(value) =>
                            updateNode(selectedNode.id, { intensity: value[0] })
                          }
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.type === 'belief' && (
                    <div>
                      <Label htmlFor="confidence">
                        Confidence: {selectedNode.data.confidence}/10
                      </Label>                        <Slider
                          id="confidence"
                          min={1}
                          max={10}
                          step={1}
                          value={[selectedNode.data.confidence || 5]}
                          onValueChange={(value) =>
                            updateNode(selectedNode.id, { confidence: value[0] })
                          }
                          className="mt-2"
                        />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="category">Category (optional)</Label>
                    <Input
                      id="category"
                      value={selectedNode.data.category || ''}
                      onChange={(e) =>
                        updateNode(selectedNode.id, { category: e.target.value })
                      }
                      className="mt-1"
                      placeholder="e.g., Work, Family, Self"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ReactFlowProvider>
    </div>
  );
}
