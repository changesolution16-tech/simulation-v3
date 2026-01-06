import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, BarChart3, RefreshCw } from 'lucide-react';
import { getHierarchyLevelStats, recalculateHierarchyLevels, HierarchyLevelStats } from '../../lib/scenarioHierarchy';

interface HierarchyLevelStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecalculate?: () => void;
}

const HierarchyLevelStatsModal: React.FC<HierarchyLevelStatsModalProps> = ({
  isOpen,
  onClose,
  onRecalculate
}) => {
  const [stats, setStats] = useState<HierarchyLevelStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getHierarchyLevelStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading hierarchy stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await recalculateHierarchyLevels();
      console.log('Recalculation result:', result);
      await loadStats();
      if (onRecalculate) {
        onRecalculate();
      }
    } catch (error) {
      console.error('Error recalculating levels:', error);
      alert('Failed to recalculate hierarchy levels. Please try again.');
    } finally {
      setRecalculating(false);
    }
  };

  if (!isOpen) return null;

  const totalScenarios = stats.reduce((sum, s) => sum + s.scenarioCount, 0);
  const maxCount = Math.max(...stats.map(s => s.scenarioCount), 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hierarchy Level Statistics</h2>
              <p className="text-sm text-gray-600">Overview of scenario organization by level</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : stats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Layers className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hierarchy levels found</p>
              <p className="text-sm mt-2">Create scenarios and connections to see hierarchy statistics</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Levels</div>
                  <div className="text-3xl font-bold text-blue-900 mt-1">{stats.length}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="text-sm text-emerald-600 font-medium">Total Scenarios</div>
                  <div className="text-3xl font-bold text-emerald-900 mt-1">{totalScenarios}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Deepest Level</div>
                  <div className="text-3xl font-bold text-purple-900 mt-1">
                    {Math.max(...stats.map(s => s.level))}
                  </div>
                </div>
              </div>

              {/* Level Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Level Details
                </h3>
                {stats.map((levelStat) => {
                  const barWidth = (levelStat.scenarioCount / maxCount) * 100;
                  return (
                    <div
                      key={levelStat.level}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Level {levelStat.level}
                          </div>
                          <div className="text-sm text-gray-600">
                            {levelStat.scenarioCount} scenario{levelStat.scenarioCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {levelStat.difficultiesAtLevel.map((diff) => (
                            <span
                              key={diff}
                              className={`px-2 py-1 rounded ${
                                diff === 'beginner'
                                  ? 'bg-green-100 text-green-800'
                                  : diff === 'intermediate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {diff}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-gray-600">Topics</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{levelStat.uniqueTopics}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">End Scenarios</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{levelStat.endScenarios}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Published</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{levelStat.publishedScenarios}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Levels are calculated based on scenario connections
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {recalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Recalculate All Levels
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HierarchyLevelStatsModal;
