import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Play, Clock, BarChart3, Loader } from 'lucide-react';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';

interface SimulationPreviewModalProps {
  simulationId: string;
  onClose: () => void;
  onStartPreview?: () => void;
}

const SimulationPreviewModal: React.FC<SimulationPreviewModalProps> = ({
  simulationId,
  onClose,
  onStartPreview
}) => {
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSimulation();
  }, [simulationId]);

  const loadSimulation = async () => {
    setLoading(true);
    setLoadingProgress(0);
    setError(null);

    try {
      setLoadingProgress(30);
      const data = await SimulationService.getSimulation(simulationId);
      setLoadingProgress(80);

      if (data) {
        setSimulation(data);
        setLoadingProgress(100);
      } else {
        setError('Simulation not found');
      }
    } catch (err) {
      console.error('Error loading simulation:', err);
      setError('Failed to load simulation');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:text-gray-100';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h2 className="text-2xl font-bold">Simulation Preview</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 mb-2">Loading simulation...</p>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={loadSimulation}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : simulation ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {simulation.display_name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(simulation.difficulty)}`}>
                      {simulation.difficulty}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(simulation.status)}`}>
                      {simulation.status}
                    </span>
                  </div>
                </div>

                {simulation.description && (
                  <p className="text-gray-600 mb-4">{simulation.description}</p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{simulation.estimated_duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>{simulation.scenarios?.length || 0} scenarios</span>
                  </div>
                </div>
              </div>

              {simulation.landing_page_enabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Landing Page</h4>
                  {simulation.landing_title && (
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Title:</strong> {simulation.landing_title}
                    </p>
                  )}
                  {simulation.landing_description && (
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Description:</strong> {simulation.landing_description}
                    </p>
                  )}
                  {simulation.landing_intro_video_url && (
                    <p className="text-sm text-blue-800">
                      <strong>Intro Video:</strong> Configured
                    </p>
                  )}
                </div>
              )}

              {simulation.closing_page_enabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Closing Page</h4>
                  {simulation.closing_title && (
                    <p className="text-sm text-green-800 mb-1">
                      <strong>Title:</strong> {simulation.closing_title}
                    </p>
                  )}
                  {simulation.closing_video_url && (
                    <p className="text-sm text-green-800 mb-1">
                      <strong>Closing Video:</strong> Configured
                    </p>
                  )}
                  <p className="text-sm text-green-800">
                    <strong>Analysis Type:</strong> {simulation.closing_analysis_type}
                  </p>
                </div>
              )}

              {simulation.scenarios && simulation.scenarios.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Scenarios</h4>
                  <div className="space-y-2 mb-4">
                    {simulation.scenarios.map((simScenario, index) => (
                      <div
                        key={simScenario.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {simScenario.scenarios?.title || 'Untitled Scenario'}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {simScenario.is_entry_point && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Entry Point</span>
                              )}
                              {simScenario.is_exit_point && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Exit Point</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Order: {simScenario.sequence_order}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!simulation.scenarios.some(s => s.is_entry_point) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-800">
                        <strong>Warning:</strong> No entry point is set. The simulation will start from the first scenario in the list.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-3">
                    <strong>No scenarios added:</strong> This simulation cannot be played until scenarios are added in the Scenario Flow step.
                  </p>
                  <button
                    onClick={loadSimulation}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Reload Simulation
                  </button>
                  <p className="text-xs text-red-700 mt-3">
                    If you just added scenarios, click "Reload Simulation" to refresh the data.
                  </p>
                </div>
              )}

              {simulation.tags && simulation.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {simulation.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {simulation && (
            <button
              onClick={() => {
                navigate(`/simulation/${simulationId}/landing`);
                onClose();
              }}
              disabled={!simulation.scenarios || simulation.scenarios.length === 0}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={(!simulation.scenarios || simulation.scenarios.length === 0) ? 'Add scenarios before previewing' : 'Preview this simulation'}
            >
              <Play className="w-4 h-4 mr-2" />
              Preview Simulation
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SimulationPreviewModal;
