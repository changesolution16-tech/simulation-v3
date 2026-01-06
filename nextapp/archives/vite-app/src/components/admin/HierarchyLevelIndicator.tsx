import React from 'react';
import { Layers, Lock, Unlock } from 'lucide-react';
import { getLevelBadgeColor } from '../../lib/scenarioHierarchy';

interface HierarchyLevelIndicatorProps {
  level: number | null | undefined;
  autoCalculate: boolean;
  isCompact?: boolean;
  onClick?: () => void;
}

const HierarchyLevelIndicator: React.FC<HierarchyLevelIndicatorProps> = ({
  level,
  autoCalculate,
  isCompact = false,
  onClick
}) => {
  if (level === null || level === undefined) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
          isCompact ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-600 border border-gray-300'
        } ${onClick ? 'cursor-pointer hover:bg-gray-200' : ''}`}
        onClick={onClick}
        title="Level not calculated"
      >
        <Layers className="w-3 h-3" />
        {!isCompact && <span>-</span>}
      </div>
    );
  }

  const colors = getLevelBadgeColor(level);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={onClick}
      title={`Hierarchy Level ${level}${autoCalculate ? ' (auto-calculated)' : ' (manually set)'}`}
    >
      <Layers className="w-3 h-3" />
      <span>{isCompact ? `L${level}` : `Level ${level}`}</span>
      {!autoCalculate && (
        <Lock className="w-2.5 h-2.5 ml-0.5" title="Level manually locked" />
      )}
    </div>
  );
};

export default HierarchyLevelIndicator;
