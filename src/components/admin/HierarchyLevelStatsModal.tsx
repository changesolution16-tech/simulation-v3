'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, TrendingUp } from 'lucide-react';

interface LevelStats {
  level: number;
  scenario_count: number;
  avg_completion_time?: number;
  success_rate?: number;
}

interface HierarchyLevelStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationName: string;
  stats: LevelStats[];
}

const HierarchyLevelStatsModal: React.FC<HierarchyLevelStatsModalProps> = ({
  isOpen,
  onClose,
  simulationName,
  stats
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Hierarchy Level Statistics
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{simulationName}</p>
            </div>

            <div className="space-y-4">
              {stats.map((stat) => (
                <div
                  key={stat.level}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Level {stat.level + 1}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.scenario_count} scenarios
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {stat.avg_completion_time && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Completion</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {stat.avg_completion_time}min
                        </p>
                      </div>
                    )}
                    {stat.success_rate !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {stat.success_rate}%
                          </p>
                          {stat.success_rate >= 70 && (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default HierarchyLevelStatsModal;
