'use client';

import React from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface HierarchyLevelIndicatorProps {
  level: number | null;
  maxLevel?: number;
  label?: string;
  showRelativePosition?: boolean;
}

const HierarchyLevelIndicator: React.FC<HierarchyLevelIndicatorProps> = ({
  level,
  maxLevel,
  label = 'Level',
  showRelativePosition = true
}) => {
  if (level === null) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <Target className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">No level set</span>
      </div>
    );
  }

  const getLevelColor = () => {
    if (!maxLevel) return 'blue';

    const percentage = (level / maxLevel) * 100;
    if (percentage < 33) return 'green';
    if (percentage < 66) return 'amber';
    return 'red';
  };

  const color = getLevelColor();
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  };

  const getPositionText = () => {
    if (!maxLevel || !showRelativePosition) return null;

    const percentage = (level / maxLevel) * 100;
    if (percentage < 33) return 'Early stage';
    if (percentage < 66) return 'Mid-flow';
    return 'Late stage';
  };

  const positionText = getPositionText();

  return (
    <div className="inline-flex flex-col gap-1">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClasses[color]}`}>
        <Target className="w-4 h-4" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {label} {level}
          </span>
          {maxLevel && (
            <span className="text-xs opacity-75">/ {maxLevel}</span>
          )}
        </div>
        {positionText && level === 0 && (
          <TrendingDown className="w-3 h-3" />
        )}
        {positionText && level > 0 && (
          <TrendingUp className="w-3 h-3" />
        )}
      </div>
      {positionText && (
        <span className="text-xs text-gray-500 dark:text-gray-400 pl-9">
          {positionText}
        </span>
      )}
    </div>
  );
};

export default HierarchyLevelIndicator;
