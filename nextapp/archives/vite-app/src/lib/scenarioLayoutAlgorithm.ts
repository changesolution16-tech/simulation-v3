interface LayoutNode {
  id: string;
  x: number;
  y: number;
  children: string[];
  level: number;
  hierarchyLevel?: number | null;
}

interface Connection {
  from: string;
  to: string;
}

interface NodeDimensions {
  width: number;
  height: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const DEFAULT_DIMENSIONS: NodeDimensions = {
  width: 320,
  height: 200,
  horizontalSpacing: 100,
  verticalSpacing: 150
};

export function calculateHierarchicalLayout(
  nodeIds: string[],
  connections: Connection[],
  dimensions: NodeDimensions = DEFAULT_DIMENSIONS,
  nodeHierarchyLevels?: Map<string, number | null>
): Map<string, { x: number; y: number }> {
  if (nodeIds.length === 0) {
    return new Map();
  }

  const incomingConnections = new Map<string, number>();
  const outgoingConnections = new Map<string, string[]>();

  nodeIds.forEach(id => {
    incomingConnections.set(id, 0);
    outgoingConnections.set(id, []);
  });

  connections.forEach(conn => {
    const count = incomingConnections.get(conn.to) || 0;
    incomingConnections.set(conn.to, count + 1);

    const children = outgoingConnections.get(conn.from) || [];
    children.push(conn.to);
    outgoingConnections.set(conn.from, children);
  });

  const levels: string[][] = [];
  const visited = new Set<string>();
  const nodeLevel = new Map<string, number>();

  if (nodeHierarchyLevels && nodeHierarchyLevels.size > 0) {
    nodeIds.forEach(nodeId => {
      const hierarchyLevel = nodeHierarchyLevels.get(nodeId);
      if (hierarchyLevel !== null && hierarchyLevel !== undefined) {
        nodeLevel.set(nodeId, hierarchyLevel);
        if (!levels[hierarchyLevel]) {
          levels[hierarchyLevel] = [];
        }
        levels[hierarchyLevel].push(nodeId);
        visited.add(nodeId);
      }
    });

    nodeIds.forEach(id => {
      if (!visited.has(id)) {
        const fallbackLevel = levels.length;
        nodeLevel.set(id, fallbackLevel);
        if (!levels[fallbackLevel]) {
          levels[fallbackLevel] = [];
        }
        levels[fallbackLevel].push(id);
      }
    });
  } else {
    const rootNodes = nodeIds.filter(id => (incomingConnections.get(id) || 0) === 0);

    if (rootNodes.length === 0 && nodeIds.length > 0) {
      rootNodes.push(nodeIds[0]);
    }

    function assignLevels(nodeId: string, level: number) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      nodeLevel.set(nodeId, level);

      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(nodeId);

      const children = outgoingConnections.get(nodeId) || [];
      children.forEach(childId => {
        assignLevels(childId, level + 1);
      });
    }

    rootNodes.forEach(rootId => assignLevels(rootId, 0));

    nodeIds.forEach(id => {
      if (!visited.has(id)) {
        assignLevels(id, levels.length);
      }
    });
  }

  const positions = new Map<string, { x: number; y: number }>();

  levels.forEach((levelNodes, levelIndex) => {
    const levelWidth = levelNodes.length * (dimensions.width + dimensions.horizontalSpacing);
    const startX = -levelWidth / 2 + dimensions.width / 2;

    levelNodes.forEach((nodeId, nodeIndex) => {
      const x = startX + nodeIndex * (dimensions.width + dimensions.horizontalSpacing);
      const y = 100 + levelIndex * (dimensions.height + dimensions.verticalSpacing);

      positions.set(nodeId, { x, y });
    });
  });

  return positions;
}

export function calculateCompactLayout(
  nodeIds: string[],
  connections: Connection[],
  dimensions: NodeDimensions = DEFAULT_DIMENSIONS,
  nodeHierarchyLevels?: Map<string, number | null>
): Map<string, { x: number; y: number }> {
  const compactDimensions = {
    ...dimensions,
    horizontalSpacing: dimensions.horizontalSpacing * 0.6,
    verticalSpacing: dimensions.verticalSpacing * 0.7
  };

  return calculateHierarchicalLayout(nodeIds, connections, compactDimensions, nodeHierarchyLevels);
}

export function detectOverlappingNodes(
  positions: Map<string, { x: number; y: number }>,
  dimensions: NodeDimensions = DEFAULT_DIMENSIONS
): boolean {
  const posArray = Array.from(positions.values());

  for (let i = 0; i < posArray.length; i++) {
    for (let j = i + 1; j < posArray.length; j++) {
      const pos1 = posArray[i];
      const pos2 = posArray[j];

      const xOverlap = Math.abs(pos1.x - pos2.x) < dimensions.width;
      const yOverlap = Math.abs(pos1.y - pos2.y) < dimensions.height;

      if (xOverlap && yOverlap) {
        return true;
      }
    }
  }

  return false;
}

export function identifyRootNodes(
  nodeIds: string[],
  connections: Connection[]
): string[] {
  const nodesWithIncoming = new Set<string>();

  connections.forEach(conn => {
    nodesWithIncoming.add(conn.to);
  });

  const roots = nodeIds.filter(id => !nodesWithIncoming.has(id));

  return roots.length > 0 ? roots : (nodeIds.length > 0 ? [nodeIds[0]] : []);
}

export function areAllNodesUnpositioned(
  positions: Map<string, { x: number; y: number }>
): boolean {
  return Array.from(positions.values()).every(pos => pos.x === 0 && pos.y === 0);
}
