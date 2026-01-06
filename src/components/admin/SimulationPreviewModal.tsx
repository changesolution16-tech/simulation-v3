'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, FileText, Target } from 'lucide-react';

interface SimulationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: {
    display_name: string;
    description?: string;
    difficulty?: string;
    estimated_duration_minutes?: number;
    scenario_count?: number;
  };
  onStartPreview?: () => void;
}

const SimulationPreviewModal: React.FC<SimulationPreviewModalProps> = ({
  isOpen,
  onClose,
  simulation,
  onStartPreview
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
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {simulation.display_name}
              </h2>
              {simulation.description && (
                <p className="text-gray-600 dark:text-gray-400">{simulation.description}</p>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 text-sm">
                {simulation.difficulty && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{simulation.difficulty}</span>
                  </div>
                )}
                {simulation.scenario_count && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{simulation.scenario_count} scenarios</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              {onStartPreview && (
                <button
                  onClick={onStartPreview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SimulationPreviewModal;
