import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, ZoomIn, ZoomOut, Maximize, Grid2x2 as Grid, Eye, Trash2, Copy, Link, Settings, Play, Network, RefreshCw, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSimulationStore } from '../../store';
import { Difficulty } from '../../types';
import ScenarioPreview from './ScenarioPreview';
import {
  calculateHierarchicalLayout,
  calculateCompactLayout,
  areAllNodesUnpositioned
} from '../../lib/scenarioLayoutAlgorithm';
import { saveScenarioWithOptions, validateSession } from '../../lib/queryHelpers';
import { validateScenarioBeforeSave, logValidationErrors } from '../../lib/videoValidation';
import HierarchyLevelSelector from './HierarchyLevelSelector';

interface ScenarioNode {
  id: string;
  title: string;
  description: string;
  questionText?: string;
  position: { x: number; y: number };
  topicId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isEndScenario: boolean;
  options: ScenarioOption[];
  content_status: 'draft' | 'review' | 'published';
  hierarchyLevel?: number | null;
  autoCalculateLevel?: boolean;
}

interface ScenarioOption {
  id: string;
  text: string;
  nextScenarioId: string | null;
  skillImpact: Record<string, number>;
  feedback: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
}

interface Connection {
  from: string;
  to: string;
  optionId: string;
  fromOption: ScenarioOption;
}

const ScenarioFlowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState<{ nodeId: string; optionId: string } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDifficulty, setPreviewDifficulty] = useState<Difficulty>('beginner');
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [connectionTooltip, setConnectionTooltip] = useState<{
    x: number;
    y: number;
    content: Connection;
  } | null>(null);
  const [isAutoLayoutting, setIsAutoLayoutting] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'compact'>('hierarchical');

  const canvasRef = useRef<HTMLDivElement>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const lastLoadTimestamp = useRef<number>(0);
  const DEBOUNCE_DELAY = 300;

  const { startPreview, previewSession, loadScenarios: loadStoreScenarios } = useSimulationStore();

  const connections = useMemo(() => {
    const connectionsData: Connection[] = [];
    nodes.forEach(node => {
      node.options.forEach(option => {
        if (option.nextScenarioId) {
          connectionsData.push({
            from: node.id,
            to: option.nextScenarioId,
            optionId: option.id,
            fromOption: option
          });
        }
      });
    });
    return connectionsData;
  }, [nodes]);

  useEffect(() => {
    loadTopics();
    loadScenarios();
  }, []);

  const loadTopics = async () => {
    const { data } = await supabase.from('topics').select('*');
    if (data) setTopics(data);
  };

  const loadScenarios = async () => {
    const now = Date.now();
    if (now - lastLoadTimestamp.current < DEBOUNCE_DELAY || isSaving) {
      console.log('[ScenarioFlowBuilder] Skipping load (debounce or saving in progress)');
      return;
    }
    lastLoadTimestamp.current = now;

    setLoading(true);
    try {
      console.log('[ScenarioFlowBuilder] Loading scenarios and connections...');

      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (scenariosError) throw scenariosError;

      const { data: optionsData, error: optionsError } = await supabase
        .from('scenario_options')
        .select('*')
        .order('option_order');

      if (optionsError) throw optionsError;

      console.log('[ScenarioFlowBuilder] Loaded scenarios:', scenariosData?.length || 0);
      console.log('[ScenarioFlowBuilder] Loaded options:', optionsData?.length || 0);

      if (scenariosData) {
        const nodesData: ScenarioNode[] = scenariosData.map((s: any) => {
          const scenarioOptions = (optionsData || [])
            .filter((opt: any) => opt.scenario_id === s.id)
            .map((opt: any) => ({
              id: opt.id,
              text: opt.option_text,
              nextScenarioId: opt.next_scenario_id,
              skillImpact: opt.skill_impacts || {},
              feedback: {
                beginner: opt.feedback_beginner || '',
                intermediate: opt.feedback_intermediate || opt.feedback_beginner || '',
                advanced: opt.feedback_advanced || opt.feedback_beginner || ''
              }
            }));

          return {
            id: s.id,
            title: s.title || 'Untitled',
            description: s.description || '',
            questionText: s.question_text || 'How would you respond?',
            position: { x: s.position_x || 0, y: s.position_y || 0 },
            topicId: s.topic_id || '',
            difficulty: s.difficulty || 'beginner',
            isEndScenario: s.is_end_scenario || false,
            options: scenarioOptions,
            content_status: s.content_status || 'draft',
            hierarchyLevel: s.hierarchy_level ?? null,
            autoCalculateLevel: s.auto_calculate_level ?? true
          };
        });
        setNodes(nodesData);

        const positionsMap = new Map(
          nodesData.map(node => [node.id, { x: node.position.x, y: node.position.y }])
        );

        if (areAllNodesUnpositioned(positionsMap) && nodesData.length > 0) {
          console.log('[ScenarioFlowBuilder] All nodes unpositioned, triggering auto-layout');
          setTimeout(() => {
            const connectionsForLayout = nodesData.flatMap(node =>
              node.options
                .filter(opt => opt.nextScenarioId)
                .map(opt => ({
                  from: node.id,
                  to: opt.nextScenarioId!,
                  optionId: opt.id,
                  fromOption: opt
                }))
            );
            applyAutoLayout(nodesData, connectionsForLayout, false);
          }, 100);
        }
      }
    } catch (error) {
      console.error('[ScenarioFlowBuilder] Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = useCallback(() => {
    const newNode: ScenarioNode = {
      id: `scenario-${Date.now()}`,
      title: 'New Scenario',
      description: 'Enter scenario description',
      questionText: 'How would you respond?',
      position: { x: 100 - offset.x, y: 100 - offset.y },
      topicId: topics[0]?.id || 'communication',
      difficulty: 'beginner',
      isEndScenario: false,
      options: [
        {
          id: `opt-${Date.now()}-1`,
          text: 'Option A',
          nextScenarioId: null,
          skillImpact: { communication: 10 },
          feedback: {
            beginner: 'Good choice!',
            intermediate: 'Well considered.',
            advanced: 'Excellent strategic thinking.'
          }
        },
        {
          id: `opt-${Date.now()}-2`,
          text: 'Option B',
          nextScenarioId: null,
          skillImpact: { communication: -5 },
          feedback: {
            beginner: 'Consider alternative approaches.',
            intermediate: 'This approach has some drawbacks.',
            advanced: 'Reflect on the implications of this choice.'
          }
        }
      ],
      content_status: 'draft'
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
  }, [nodes, offset, topics]);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes(nodes.map(node =>
      node.id === nodeId ? { ...node, position: newPosition } : node
    ));
  }, [nodes]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setScale(Math.min(scale + 0.1, 2));
  const handleZoomOut = () => setScale(Math.max(scale - 0.1, 0.3));
  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSaveScenario = async (node: ScenarioNode) => {
    setIsSaving(true);
    const nodeSnapshot = JSON.parse(JSON.stringify(node));

    try {
      const sessionValidation = await validateSession();
      if (!sessionValidation.isValid) {
        alert(`Cannot save: ${sessionValidation.error}. Please refresh and log in again.`);
        return;
      }

      const validation = validateScenarioBeforeSave(node);
      if (!validation.isValid) {
        logValidationErrors(validation.errors, 'ScenarioFlowBuilder Save Validation');
        alert(`Cannot save scenario: Data validation failed.\n\n${validation.errors.slice(0, 3).join('\n')}\n${validation.errors.length > 3 ? `\n...and ${validation.errors.length - 3} more errors` : ''}`);
        return;
      }

      console.log('[ScenarioFlowBuilder] Saving scenario:', node.id, node.title);
      console.log('[ScenarioFlowBuilder] Options with connections:', node.options.map(o => ({
        id: o.id,
        text: o.text,
        nextScenarioId: o.nextScenarioId
      })));

      const scenarioData = {
        id: node.id,
        title: node.title,
        description: node.description,
        question_text: node.questionText || 'How would you respond?',
        topic_id: node.topicId,
        difficulty: node.difficulty,
        is_end_scenario: node.isEndScenario,
        position_x: node.position.x,
        position_y: node.position.y,
        content_status: node.content_status,
        hierarchy_level: node.hierarchyLevel ?? null,
        auto_calculate_level: node.autoCalculateLevel ?? true,
        updated_at: new Date().toISOString()
      };

      const optionsData = node.options.map((opt, index) => ({
        id: opt.id,
        scenario_id: node.id,
        option_text: opt.text,
        option_order: index,
        next_scenario_id: opt.nextScenarioId,
        feedback_beginner: opt.feedback.beginner,
        feedback_intermediate: opt.feedback.intermediate,
        feedback_advanced: opt.feedback.advanced,
        skill_impacts: opt.skillImpact
      }));

      const saveResult = await saveScenarioWithOptions(node.id, scenarioData, optionsData);

      if (!saveResult.success) {
        if (saveResult.validationErrors) {
          logValidationErrors(saveResult.validationErrors, 'ScenarioFlowBuilder Database Save');
          alert(`Failed to save scenario:\n\n${saveResult.validationErrors.join('\n')}`);
        }
        throw new Error('Save operation failed');
      }

      console.log('[ScenarioFlowBuilder] Scenario saved successfully');

      if (!saveResult.data?.connectionsVerified) {
        console.warn('[ScenarioFlowBuilder] Connections may not have persisted correctly, reloading...');
        setTimeout(() => loadScenarios(), 500);
      }

      try {
        const { data: syncData, error: syncError } = await supabase.rpc('sync_scenario_branches_for_scenario', {
          p_scenario_id: node.id
        });

        if (syncError) {
          console.error('[ScenarioFlowBuilder] Branch sync error (non-critical):', syncError);
        } else {
          console.log('[ScenarioFlowBuilder] Branches synced successfully', syncData);
        }
      } catch (syncError) {
        console.warn('[ScenarioFlowBuilder] Branch sync failed (continuing):', syncError);
      }

    } catch (error) {
      console.error('[ScenarioFlowBuilder] Error saving scenario:', error);
      setNodes(nodes.map(n => n.id === nodeSnapshot.id ? nodeSnapshot : n));
      alert(`Failed to save scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const validateConnectionsPersisted = async (scenarioId: string, options: ScenarioOption[]) => {
    try {
      const { data, error } = await supabase
        .from('scenario_options')
        .select('id, next_scenario_id')
        .eq('scenario_id', scenarioId);

      if (error) throw error;

      const persistedConnections = data?.filter(o => o.next_scenario_id).length || 0;
      const expectedConnections = options.filter(o => o.nextScenarioId).length;

      if (persistedConnections !== expectedConnections) {
        console.warn(`[ScenarioFlowBuilder] Connection mismatch: expected ${expectedConnections}, found ${persistedConnections}`);
        setTimeout(() => loadScenarios(), 500);
      } else {
        console.log('[ScenarioFlowBuilder] Connection validation passed:', persistedConnections, 'connections');
      }
    } catch (error) {
      console.error('[ScenarioFlowBuilder] Error validating connections:', error);
    }
  };

  // Removed saveBranches - now handled by database trigger

  const handleDeleteNode = async (nodeId: string) => {
    if (window.confirm('Delete this scenario? This will break any connections to it.')) {
      await supabase.from('scenarios').delete().eq('id', nodeId);
      setNodes(nodes.filter(n => n.id !== nodeId));
      setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
      setSelectedNode(null);
    }
  };

  const handleDuplicateNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      const scenarioInsert: any = {
        topic_id: node.topicId,
        title: `${node.title} (Copy)`,
        description: node.description,
        difficulty: node.difficulty,
        is_end_scenario: node.isEndScenario,
        is_published: false,
        position_x: node.position.x + 50,
        position_y: node.position.y + 50,
        content_status: 'draft'
      };

      const { data: newScenario, error: scenarioError } = await supabase
        .from('scenarios')
        .insert(scenarioInsert)
        .select()
        .single();

      if (scenarioError) throw scenarioError;

      if (node.options.length > 0) {
        const optionsToInsert = node.options.map((opt, index) => ({
          scenario_id: newScenario.id,
          option_text: opt.text,
          option_order: index,
          next_scenario_id: null,
          feedback_beginner: opt.feedback.beginner,
          feedback_intermediate: opt.feedback.intermediate,
          feedback_advanced: opt.feedback.advanced,
          skill_impacts: opt.skillImpact
        }));

        const { error: optionsError } = await supabase
          .from('scenario_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      await loadScenarios();
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      alert('Failed to duplicate scenario. Please try again.');
    }
  };

  const startConnection = (nodeId: string, optionId: string) => {
    setIsConnecting({ nodeId, optionId });
  };

  const completeConnection = async (targetNodeId: string) => {
    if (isConnecting) {
      const node = nodes.find(n => n.id === isConnecting.nodeId);
      if (node) {
        console.log('[ScenarioFlowBuilder] Creating connection:', {
          from: isConnecting.nodeId,
          to: targetNodeId,
          optionId: isConnecting.optionId
        });

        const previousNode = { ...node };

        const updatedOptions = node.options.map(opt =>
          opt.id === isConnecting.optionId
            ? { ...opt, nextScenarioId: targetNodeId }
            : opt
        );
        const updatedNode = { ...node, options: updatedOptions };
        setNodes(nodes.map(n => n.id === node.id ? updatedNode : n));

        try {
          await handleSaveScenario(updatedNode);
          console.log('[ScenarioFlowBuilder] Connection saved to database');
        } catch (error) {
          console.error('[ScenarioFlowBuilder] Failed to save connection:', error);
          setNodes(nodes.map(n => n.id === node.id ? previousNode : n));
          alert('Failed to save connection. The connection has been reverted.');
        }
      }
      setIsConnecting(null);
    }
  };

  const removeConnection = async (from: string, optionId: string) => {
    const node = nodes.find(n => n.id === from);
    if (node) {
      const previousNode = { ...node };

      const updatedOptions = node.options.map(opt =>
        opt.id === optionId ? { ...opt, nextScenarioId: null } : opt
      );
      const updatedNode = { ...node, options: updatedOptions };
      setNodes(nodes.map(n => n.id === node.id ? updatedNode : n));

      try {
        await handleSaveScenario(updatedNode);
        console.log('[ScenarioFlowBuilder] Connection removed successfully');
      } catch (error) {
        console.error('[ScenarioFlowBuilder] Failed to remove connection:', error);
        setNodes(nodes.map(n => n.id === node.id ? previousNode : n));
        alert('Failed to remove connection. The connection has been restored.');
      }
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'published': return 'border-green-500 bg-green-50';
      case 'review': return 'border-amber-500 bg-amber-50';
      case 'archived': return 'border-gray-400 bg-gray-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getConnectionColor = (connection: Connection) => {
    const totalImpact = Object.values(connection.fromOption.skillImpact).reduce((sum, val) => sum + val, 0);
    if (totalImpact > 5) return { stroke: '#10b981', glow: '#10b98140' };
    if (totalImpact < -5) return { stroke: '#ef4444', glow: '#ef444440' };
    return { stroke: '#3b82f6', glow: '#3b82f640' };
  };

  const getConnectionKey = (conn: Connection) => `${conn.from}-${conn.optionId}-${conn.to}`;

  const isConnectionHighlighted = (conn: Connection) => {
    if (!hoveredConnection) return false;
    return getConnectionKey(conn) === hoveredConnection;
  };

  const isNodeInActiveConnection = (nodeId: string) => {
    if (!hoveredConnection) return false;
    const conn = connections.find(c => getConnectionKey(c) === hoveredConnection);
    return conn ? (conn.from === nodeId || conn.to === nodeId) : false;
  };

  const handleStartPreview = async (nodeId: string, difficulty: Difficulty) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error('Node not found:', nodeId);
      return;
    }

    try {
      await loadStoreScenarios();
      startPreview(nodeId, difficulty, node.topicId);
    } catch (error) {
      console.error('Error loading scenarios for preview:', error);
      alert('Failed to start preview. Please try again.');
    }
  };

  const handlePreviewFromNode = (nodeId: string) => {
    console.log('Preview button clicked for node:', nodeId);
    setSelectedNode(nodeId);
    setShowPreviewModal(true);
    console.log('Preview modal should now be visible');
  };

  const handleConfirmPreview = async () => {
    if (selectedNode) {
      await handleStartPreview(selectedNode, previewDifficulty);
      setShowPreviewModal(false);
    }
  };

  const applyAutoLayout = async (
    nodesToLayout: ScenarioNode[] = nodes,
    connectionsToUse: Connection[] = connections,
    saveToDb: boolean = true
  ) => {
    if (nodesToLayout.length === 0) return;

    setIsAutoLayoutting(true);

    try {
      const nodeIds = nodesToLayout.map(n => n.id);
      const simpleConnections = connectionsToUse.map(c => ({
        from: c.from,
        to: c.to
      }));

      const nodeHierarchyLevels = new Map<string, number | null>();
      nodesToLayout.forEach(node => {
        if (node.hierarchyLevel !== null && node.hierarchyLevel !== undefined) {
          nodeHierarchyLevels.set(node.id, node.hierarchyLevel);
        }
      });

      const layoutFunction = layoutMode === 'compact'
        ? calculateCompactLayout
        : calculateHierarchicalLayout;

      const newPositions = layoutFunction(
        nodeIds,
        simpleConnections,
        undefined,
        nodeHierarchyLevels.size > 0 ? nodeHierarchyLevels : undefined
      );

      const updatedNodes = nodesToLayout.map(node => {
        const newPos = newPositions.get(node.id);
        if (newPos) {
          return {
            ...node,
            position: { x: newPos.x, y: newPos.y }
          };
        }
        return node;
      });

      setNodes(updatedNodes);

      if (saveToDb) {
        await batchSaveNodePositions(updatedNodes);
      }

    } catch (error) {
      console.error('Error applying auto-layout:', error);
    } finally {
      setIsAutoLayoutting(false);
    }
  };

  const batchSaveNodePositions = async (nodesToSave: ScenarioNode[]) => {
    try {
      const updates = nodesToSave.map(node => ({
        id: node.id,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        await supabase
          .from('scenarios')
          .update({
            position_x: update.position_x,
            position_y: update.position_y,
            updated_at: update.updated_at
          })
          .eq('id', update.id);
      }

      console.log(`Saved positions for ${updates.length} scenarios`);
    } catch (error) {
      console.error('Error saving node positions:', error);
    }
  };

  const handleAutoLayoutClick = () => {
    if (nodes.length === 0) return;

    const hasPositionedNodes = nodes.some(
      n => n.position.x !== 0 || n.position.y !== 0
    );

    if (hasPositionedNodes) {
      const confirmed = window.confirm(
        'This will reorganize all scenarios. Your current layout will be replaced. Continue?'
      );
      if (!confirmed) return;
    }

    applyAutoLayout();
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <>
    <ScenarioPreview />
    <div className="flex h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <div className="px-2 py-1 text-xs text-gray-600 border-b">
          <div>Nodes: {nodes.length}</div>
          <div className={`font-semibold ${connections.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Connections: {connections.length}
          </div>
          {loading && <div className="text-blue-600 animate-pulse">Loading...</div>}
        </div>
        <button
          onClick={handleAddNode}
          className="p-2 hover:bg-blue-50 rounded text-blue-600 transition-colors w-full"
          title="Add Scenario Node"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={loadScenarios}
          disabled={loading}
          className="p-2 hover:bg-green-50 rounded text-green-600 transition-colors w-full disabled:opacity-50"
          title="Refresh Connections"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="border-t my-2"></div>
        <button
          onClick={() => {
            if (nodes.length > 0) {
              handlePreviewFromNode(nodes[0].id);
            }
          }}
          disabled={nodes.length === 0}
          className="p-2 hover:bg-green-50 rounded text-green-600 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
          title="Preview Flow"
        >
          <Play className="w-5 h-5" />
        </button>
        <div className="border-t my-2"></div>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors w-full"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors w-full"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 rounded transition-colors w-full"
          title="Reset View"
        >
          <Maximize className="w-5 h-5" />
        </button>
        <div className="border-t my-2"></div>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded transition-colors w-full ${showGrid ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          title="Toggle Grid"
        >
          <Grid className="w-5 h-5" />
        </button>
        <div className="border-t my-2"></div>
        <button
          onClick={handleAutoLayoutClick}
          disabled={nodes.length === 0 || isAutoLayoutting}
          className="p-2 hover:bg-purple-50 rounded text-purple-600 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed relative"
          title="Auto Layout Scenarios"
        >
          <Network className={`w-5 h-5 ${isAutoLayoutting ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={() => setLayoutMode(layoutMode === 'hierarchical' ? 'compact' : 'hierarchical')}
          className="p-1 text-xs hover:bg-gray-50 rounded transition-colors w-full"
          title={`Layout Mode: ${layoutMode === 'hierarchical' ? 'Hierarchical' : 'Compact'}`}
        >
          <span className="text-gray-600">
            {layoutMode === 'hierarchical' ? 'Hierarchical' : 'Compact'}
          </span>
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden cursor-move relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* Grid Background */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              backgroundPosition: `${offset.x}px ${offset.y}px`
            }}
          />
        )}

        {/* Canvas Content */}
        <div
          className="absolute"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Connection Lines */}
          <svg
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              minWidth: '5000px',
              minHeight: '5000px',
              overflow: 'visible',
              zIndex: 1
            }}
          >
            {connections.length > 0 && (
              <text x="100" y="100" fill="red" fontSize="20">
                Rendering {connections.length} connections
              </text>
            )}
            {connections.map((conn, idx) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.position.x + 320;
              const y1 = fromNode.position.y + 80;
              const x2 = toNode.position.x;
              const y2 = toNode.position.y + 80;


              const connectionKey = getConnectionKey(conn);
              const isHighlighted = isConnectionHighlighted(conn);
              const colors = getConnectionColor(conn);
              const isDimmed = hoveredConnection && !isHighlighted;

              const optionIndex = fromNode.options.findIndex(opt => opt.id === conn.optionId);
              const optionLabel = optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : '?';

              return (
                <g
                  key={idx}
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  onMouseEnter={(e) => {
                    setHoveredConnection(connectionKey);
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      setConnectionTooltip({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        content: conn
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect && connectionTooltip) {
                      setConnectionTooltip({
                        ...connectionTooltip,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredConnection(null);
                    setConnectionTooltip(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(conn.from);
                  }}
                >
                  {isHighlighted && (
                    <path
                      d={`M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`}
                      stroke={colors.glow}
                      strokeWidth="12"
                      fill="none"
                      opacity="0.6"
                      className="transition-all duration-200"
                    />
                  )}
                  <path
                    d={`M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`}
                    stroke="transparent"
                    strokeWidth="20"
                    fill="none"
                  />
                  <path
                    d={`M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`}
                    stroke={colors.stroke}
                    strokeWidth={isHighlighted ? "3" : "2"}
                    fill="none"
                    markerEnd={`url(#arrowhead-${connectionKey})`}
                    opacity={isDimmed ? "0.2" : "1"}
                    className="transition-all duration-200"
                    strokeDasharray={conn.fromOption.nextScenarioId ? "0" : "5,5"}
                  />
                  <circle
                    cx={x2}
                    cy={y2}
                    r={isHighlighted ? "6" : "4"}
                    fill={colors.stroke}
                    opacity={isDimmed ? "0.2" : "1"}
                    className="transition-all duration-200"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 10}
                    fill={colors.stroke}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    opacity={isHighlighted ? "1" : "0.7"}
                    className="transition-all duration-200"
                    style={{ pointerEvents: 'none' }}
                  >
                    {optionLabel}
                  </text>
                </g>
              );
            })}
            <defs>
              {connections.map((conn) => {
                const connectionKey = getConnectionKey(conn);
                const colors = getConnectionColor(conn);
                return (
                  <marker
                    key={connectionKey}
                    id={`arrowhead-${connectionKey}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill={colors.stroke} />
                  </marker>
                );
              })}
            </defs>
          </svg>

          {/* Scenario Nodes */}
          {nodes.map(node => (
            <motion.div
              key={node.id}
              drag
              dragMomentum={false}
              onDragEnd={(e, info) => handleNodeDrag(node.id, {
                x: node.position.x + info.offset.x / scale,
                y: node.position.y + info.offset.y / scale
              })}
              animate={{
                x: node.position.x,
                y: node.position.y
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                mass: 1
              }}
              className={`absolute w-80 cursor-move transition-all duration-200 ${isNodeInActiveConnection(node.id) ? 'z-10' : 'z-0'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isConnecting) {
                  completeConnection(node.id);
                } else {
                  setSelectedNode(node.id);
                }
              }}
            >
              <div className={`bg-white rounded-lg shadow-lg border-2 ${getNodeColor(node.content_status)} ${selectedNode === node.id ? 'ring-2 ring-blue-400' : ''} ${isNodeInActiveConnection(node.id) ? 'ring-2 ring-blue-300 shadow-xl' : ''} transition-all duration-200`}>
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex-1">{node.title}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePreviewFromNode(node.id); }}
                        className="p-1 hover:bg-green-100 rounded"
                        title="Preview from here"
                      >
                        <Play className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateNode(node.id); }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{node.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      node.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      node.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {node.difficulty}
                    </span>
                    {node.isEndScenario && (
                      <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                        End Node
                      </span>
                    )}
                    {node.hierarchyLevel !== null && node.hierarchyLevel !== undefined && (
                      <span className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${
                        node.autoCalculateLevel
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {node.autoCalculateLevel ? (
                          <RefreshCw className="w-3 h-3" />
                        ) : (
                          <Target className="w-3 h-3" />
                        )}
                        L{node.hierarchyLevel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {node.options.map((option, idx) => (
                    <div key={option.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-gray-700 truncate">{option.text}</span>
                      {option.nextScenarioId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeConnection(node.id, option.id); }}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Remove Connection"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startConnection(node.id, option.id); }}
                          className="p-1 hover:bg-blue-100 rounded"
                          title="Connect to Another Scenario"
                        >
                          <Link className="w-3 h-3 text-blue-600" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNodeData && (
        <div className="w-96 bg-white border-l overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4">Scenario Properties</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={selectedNodeData.title}
                onChange={(e) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, title: e.target.value } : n
                  );
                  setNodes(updated);
                }}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={selectedNodeData.description}
                onChange={(e) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, description: e.target.value } : n
                  );
                  setNodes(updated);
                }}
                rows={4}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question Text</label>
              <input
                type="text"
                value={selectedNodeData.questionText || 'How would you respond?'}
                onChange={(e) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, questionText: e.target.value } : n
                  );
                  setNodes(updated);
                }}
                className="w-full px-3 py-2 border rounded"
                placeholder="How would you respond?"
              />
              <p className="text-xs text-gray-500 mt-1">
                This question will be displayed to learners before they see the response options.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                value={selectedNodeData.difficulty}
                onChange={(e) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, difficulty: e.target.value as any } : n
                  );
                  setNodes(updated);
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={selectedNodeData.content_status}
                onChange={(e) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, content_status: e.target.value as any } : n
                  );
                  setNodes(updated);
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="draft">Draft</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNodeData.isEndScenario}
                onChange={(e) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, isEndScenario: e.target.checked } : n
                  );
                  setNodes(updated);
                }}
                className="rounded"
              />
              <label className="text-sm font-medium">End Scenario (Shows Results)</label>
            </div>

            <div className="border-t pt-4">
              <HierarchyLevelSelector
                value={selectedNodeData.hierarchyLevel ?? null}
                autoCalculate={selectedNodeData.autoCalculateLevel ?? true}
                calculatedLevel={selectedNodeData.hierarchyLevel}
                onChange={(level) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, hierarchyLevel: level } : n
                  );
                  setNodes(updated);
                }}
                onAutoCalculateChange={(auto) => {
                  const updated = nodes.map(n =>
                    n.id === selectedNode ? { ...n, autoCalculateLevel: auto } : n
                  );
                  setNodes(updated);
                }}
                onRecalculate={async () => {
                  try {
                    const { data, error } = await supabase.rpc('apply_scenario_hierarchy_levels');
                    if (error) throw error;
                    await loadScenarios();
                  } catch (error) {
                    console.error('Error recalculating hierarchy levels:', error);
                    alert('Failed to recalculate hierarchy levels');
                  }
                }}
                showAutoToggle={true}
              />
            </div>

            <button
              onClick={() => handleSaveScenario(selectedNodeData)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Scenario
            </button>
          </div>
        </div>
      )}

      {/* Connection Tooltip */}
      {connectionTooltip && (() => {
        const fromNode = nodes.find(n => n.id === connectionTooltip.content.from);
        const toNode = nodes.find(n => n.id === connectionTooltip.content.to);
        const option = connectionTooltip.content.fromOption;
        const totalImpact = Object.values(option.skillImpact).reduce((sum, val) => sum + val, 0);
        const impactColor = totalImpact > 5 ? 'text-green-600' : totalImpact < -5 ? 'text-red-600' : 'text-blue-600';

        return (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: connectionTooltip.x + 20,
              top: connectionTooltip.y + 20,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700 p-4 max-w-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">From:</span>
                  <span className="text-gray-900 dark:text-gray-100">{fromNode?.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">To:</span>
                  <span className="text-gray-900 dark:text-gray-100">{toNode?.title}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="text-sm font-semibold text-gray-700 mb-1">Option:</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 italic">"{option.text}"</div>
                </div>
                {Object.keys(option.skillImpact).length > 0 && (
                  <div className="border-t pt-2">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Skill Impact:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(option.skillImpact).map(([skill, impact]) => (
                        <span
                          key={skill}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            impact > 0
                              ? 'bg-green-100 text-green-700'
                              : impact < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {skill}: {impact > 0 ? '+' : ''}{impact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-500 italic">
                    {option.feedback.beginner.substring(0, 100)}{option.feedback.beginner.length > 100 ? '...' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Connection Mode Indicator */}
      {isConnecting && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Click on a target scenario to create connection
        </div>
      )}

      {/* Auto Layout Indicator */}
      {isAutoLayoutting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Organizing scenarios...</span>
        </motion.div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Preview Scenario Flow</h3>
            <p className="text-gray-600 mb-4">
              Select the difficulty level to preview this scenario flow as a learner would experience it.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview as difficulty level:
              </label>
              <select
                value={previewDifficulty}
                onChange={(e) => setPreviewDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ScenarioFlowBuilder;
