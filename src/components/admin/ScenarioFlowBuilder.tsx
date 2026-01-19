'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Grid2x2 as Grid,
  Link2,
  X,
  Edit,
  Target
} from 'lucide-react';
import ScenarioEditModal from './ScenarioEditModal';
import ScenarioFlowEngine from '@/components/simulation/ScenarioFlowEngine';
import {
  calculateHierarchicalLayout,
  calculateCompactLayout,
  areAllNodesUnpositioned
} from '@/lib/scenarioLayoutAlgorithm';

interface ScenarioOption {
  id: string;
  text: string;
  nextScenarioId: string | null;
}

interface ScenarioNode {
  id: string;
  title: string;
  description: string;
  questionText?: string;
  position: { x: number; y: number };
  topicId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isEndScenario: boolean;
  isEntryPoint: boolean;
  options: ScenarioOption[];
  hierarchyLevel?: number | null;
  autoCalculateLevel?: boolean;
}

interface Connection {
  from: string;
  to: string;
  optionId: string;
}

interface ScenarioFlowBuilderProps {
  simulationId: string;
}

const ScenarioFlowBuilder: React.FC<ScenarioFlowBuilderProps> = ({ simulationId }) => {
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<{ nodeId: string; optionId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'compact'>('hierarchical');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [topics, setTopics] = useState<{ id: string; title: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const connections = useMemo(() => {
    const data: Connection[] = [];
    nodes.forEach(node => {
      node.options.forEach(option => {
        if (option.nextScenarioId) {
          data.push({
            from: node.id,
            to: option.nextScenarioId,
            optionId: option.id
          });
        }
      });
    });
    return data;
  }, [nodes]);

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [simulationId]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingNodeId) return;
      const node = nodes.find(n => n.id === draggingNodeId);
      if (!node) return;

      const newPosition = {
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y
      };

      setNodes(prev =>
        prev.map(n => (n.id === draggingNodeId ? { ...n, position: newPosition } : n))
      );
    };

    const handleMouseUp = async () => {
      if (!draggingNodeId) return;
      const node = nodes.find(n => n.id === draggingNodeId);
      setDraggingNodeId(null);

      if (node) {
        await saveNodePosition(node.id, node.position);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, dragOffset, nodes]);

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      if (!response.ok) return;
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/simulations/${simulationId}/scenarios`);
      if (!response.ok) {
        throw new Error('Failed to load scenarios');
      }
      const scenarios = await response.json();

      const optionResults = await Promise.all(
        scenarios.map(async (scenario: any) => {
          const optionsResponse = await fetch(`/api/scenarios/${scenario.scenario_id}/options`);
          const options = optionsResponse.ok ? await optionsResponse.json() : [];
          return { scenarioId: scenario.scenario_id, options };
        })
      );

      const optionsMap = new Map(
        optionResults.map(result => [result.scenarioId, result.options])
      );

      const nodesData: ScenarioNode[] = scenarios.map((s: any) => ({
        id: s.scenario_id,
        title: s.title || 'Untitled',
        description: s.description || '',
        questionText: s.question_text || 'How would you respond?',
        position: { x: s.position_x || 0, y: s.position_y || 0 },
        topicId: s.topic_id || '',
        difficulty: s.difficulty || 'beginner',
        isEndScenario: s.is_end_scenario || false,
        isEntryPoint: s.is_entry_point || false,
        hierarchyLevel: s.hierarchy_level ?? null,
        autoCalculateLevel: s.auto_calculate_level ?? true,
        options: (optionsMap.get(s.scenario_id) || []).map((opt: any) => ({
          id: opt.id,
          text: opt.option_text,
          nextScenarioId: opt.next_scenario_id
        }))
      }));

      setNodes(nodesData);

      const positions = new Map(
        nodesData.map(node => [node.id, { x: node.position.x, y: node.position.y }])
      );

      if (areAllNodesUnpositioned(positions) && nodesData.length > 0) {
        applyAutoLayout(nodesData);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyAutoLayout = (nodesToLayout: ScenarioNode[] = nodes) => {
    const nodeIds = nodesToLayout.map(n => n.id);
    const connectionData = nodesToLayout.flatMap((node) =>
      node.options
        .filter((opt) => opt.nextScenarioId)
        .map((opt) => ({ from: node.id, to: opt.nextScenarioId as string }))
    );
    const hierarchyLevels = new Map<string, number | null>(
      nodesToLayout.map(n => [n.id, n.hierarchyLevel ?? null])
    );

    const positions = layoutMode === 'compact'
      ? calculateCompactLayout(nodeIds, connectionData, undefined, hierarchyLevels)
      : calculateHierarchicalLayout(nodeIds, connectionData, undefined, hierarchyLevels);

    const updated = nodesToLayout.map(node => ({
      ...node,
      position: positions.get(node.id) || node.position
    }));

    setNodes(updated);
    batchSaveNodePositions(updated);
  };

  const saveNodePosition = async (scenarioId: string, position: { x: number; y: number }) => {
    try {
      await fetch(`/api/simulations/${simulationId}/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_x: position.x,
          position_y: position.y
        })
      });
    } catch (error) {
      console.error('Error saving node position:', error);
    }
  };

  const batchSaveNodePositions = async (nodesToSave: ScenarioNode[]) => {
    await Promise.all(
      nodesToSave.map(node =>
        saveNodePosition(node.id, node.position)
      )
    );
  };

  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: event.clientX - node.position.x,
      y: event.clientY - node.position.y
    });
  };

  const handleStartConnection = (nodeId: string, optionId: string) => {
    setIsConnecting({ nodeId, optionId });
  };

  const handleCancelConnection = () => {
    setIsConnecting(null);
  };

  const handleNodeClick = async (nodeId: string) => {
    if (isConnecting) {
      await connectOption(isConnecting.nodeId, isConnecting.optionId, nodeId);
      setIsConnecting(null);
      return;
    }

    setSelectedNodeId(nodeId);
  };

  const connectOption = async (fromNodeId: string, optionId: string, targetNodeId: string) => {
    try {
      const response = await fetch(`/api/options/${optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_scenario_id: targetNodeId })
      });

      if (!response.ok) {
        throw new Error('Failed to update connection');
      }

      setNodes(prev =>
        prev.map(node => {
          if (node.id !== fromNodeId) return node;
          return {
            ...node,
            options: node.options.map(opt =>
              opt.id === optionId ? { ...opt, nextScenarioId: targetNodeId } : opt
            )
          };
        })
      );
    } catch (error) {
      console.error('Error connecting option:', error);
    }
  };

  const disconnectOption = async (fromNodeId: string, optionId: string) => {
    try {
      const response = await fetch(`/api/options/${optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_scenario_id: null })
      });

      if (!response.ok) {
        throw new Error('Failed to remove connection');
      }

      setNodes(prev =>
        prev.map(node => {
          if (node.id !== fromNodeId) return node;
          return {
            ...node,
            options: node.options.map(opt =>
              opt.id === optionId ? { ...opt, nextScenarioId: null } : opt
            )
          };
        })
      );
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const handleAddScenario = async () => {
    try {
      const topicId = topics[0]?.id;
      const response = await fetch(`/api/simulations/${simulationId}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Scenario',
          description: 'Describe the scenario context',
          question_text: 'How would you respond?',
          topic_id: topicId || null,
          difficulty: 'beginner',
          is_end_scenario: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create scenario');
      }

      await loadScenarios();
    } catch (error) {
      console.error('Error creating scenario:', error);
    }
  };

  const handleSetEntryPoint = async (scenarioId: string) => {
    try {
      const response = await fetch(`/api/simulations/${simulationId}/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_entry_point: true })
      });

      if (!response.ok) {
        throw new Error('Failed to update entry point');
      }

      setNodes(prev =>
        prev.map(node => ({
          ...node,
          isEntryPoint: node.id === scenarioId
        }))
      );
    } catch (error) {
      console.error('Error setting entry point:', error);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddScenario}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Scenario
          </button>
          <button
            onClick={() => applyAutoLayout()}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto Layout
          </button>
          <button
            onClick={() => setLayoutMode(layoutMode === 'hierarchical' ? 'compact' : 'hierarchical')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Grid className="w-4 h-4 mr-2" />
            {layoutMode === 'hierarchical' ? 'Compact' : 'Hierarchical'}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Grid className="w-4 h-4 mr-2" />
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Preview Flow
          </button>
        </div>

        {isConnecting && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            <Link2 className="w-4 h-4" />
            Click a target scenario to connect.
            <button onClick={handleCancelConnection} className="ml-2 text-blue-700 hover:text-blue-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div
          ref={canvasRef}
          className={`relative border border-gray-200 rounded-lg overflow-auto min-h-[600px] bg-white ${
            showGrid ? 'bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:24px_24px]' : ''
          }`}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const startX = fromNode.position.x + 160;
              const startY = fromNode.position.y + 40;
              const endX = toNode.position.x + 160;
              const endY = toNode.position.y + 40;

              return (
                <line
                  key={`${conn.from}-${conn.optionId}-${conn.to}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-[320px] rounded-lg border shadow-sm bg-white ${
                selectedNodeId === node.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              style={{ left: node.position.x, top: node.position.y }}
              onClick={() => handleNodeClick(node.id)}
            >
              <div
                className="cursor-move px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between"
                onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{node.title}</span>
                  {node.isEntryPoint && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Entry
                    </span>
                  )}
                  {node.isEndScenario && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      End
                    </span>
                  )}
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingScenarioId(node.id);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="px-3 py-2 space-y-2">
                <p className="text-xs text-gray-600 line-clamp-2">{node.description}</p>
                <div className="space-y-1">
                  {node.options.map(option => (
                    <div key={option.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 line-clamp-1">{option.text}</span>
                      {option.nextScenarioId ? (
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            disconnectOption(node.id, option.id);
                          }}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStartConnection(node.id, option.id);
                          }}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Scenario Properties</h3>
            {selectedNode ? (
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <div className="font-medium text-gray-900">{selectedNode.title}</div>
                  <div className="text-xs text-gray-500">{selectedNode.questionText}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetEntryPoint(selectedNode.id)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Mark as Entry
                  </button>
                  <button
                    onClick={() => setEditingScenarioId(selectedNode.id)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Scenario
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a scenario to view details.</p>
            )}
          </div>
        </div>
      </div>

      {editingScenarioId && (
        <ScenarioEditModal
          scenarioId={editingScenarioId}
          simulationId={simulationId}
          onClose={() => setEditingScenarioId(null)}
          onSuccess={() => {
            setEditingScenarioId(null);
            loadScenarios();
          }}
          onError={(message) => alert(message)}
        />
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Scenario Flow Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <ScenarioFlowEngine
              simulation={{
                id: simulationId,
                display_name: 'Scenario Preview',
                scenarios: nodes.map((node) => ({
                  scenario_id: node.id,
                  is_entry_point: node.isEntryPoint,
                  scenarios: {
                    id: node.id,
                    title: node.title,
                    description: node.description,
                    question_text: node.questionText,
                    options: node.options.map((opt) => ({
                      id: opt.id,
                      option_text: opt.text,
                      next_scenario_id: opt.nextScenarioId,
                      feedback_beginner: 'Preview feedback'
                    }))
                  }
                }))
              }}
              onComplete={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioFlowBuilder;
