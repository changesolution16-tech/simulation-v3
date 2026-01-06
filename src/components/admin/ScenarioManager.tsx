'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Network, Video, Settings } from 'lucide-react';

interface Scenario {
  id: string;
  scenario_name: string;
  question_text?: string;
  hierarchy_level: number;
  video_url?: string;
  video_source?: string;
  order_index: number;
  has_timer: boolean;
  timer_seconds?: number;
}

interface ScenarioManagerProps {
  simulationId: string;
}

export default function ScenarioManager({ simulationId }: ScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, [simulationId]);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/simulations/${simulationId}/scenarios`);
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadScenarios();
      } else {
        alert('Failed to delete scenario');
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      alert('Failed to delete scenario');
    }
  };

  const getHierarchyLevelColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      2: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      3: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      4: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      5: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  const getHierarchyLevelName = (level: number) => {
    const names = {
      1: 'Entry Level',
      2: 'Associate',
      3: 'Manager',
      4: 'Senior Manager',
      5: 'Executive'
    };
    return names[level as keyof typeof names] || `Level ${level}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {scenarios.length === 0 ? (
        <div className="text-center py-12">
          <Network className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Scenarios Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start building your simulation by creating the first scenario
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Scenario
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scenarios List */}
          <div className="grid grid-cols-1 gap-4">
            {scenarios.map((scenario, index) => (
              <div
                key={scenario.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {scenario.scenario_name}
                      </h3>
                    </div>

                    {scenario.question_text && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-11 mb-3">
                        {scenario.question_text}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 ml-11">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHierarchyLevelColor(scenario.hierarchy_level)}`}>
                        {getHierarchyLevelName(scenario.hierarchy_level)}
                      </span>

                      {scenario.video_url && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                          <Video className="w-3 h-3 inline mr-1" />
                          Has Video
                        </span>
                      )}

                      {scenario.has_timer && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                          <Settings className="w-3 h-3 inline mr-1" />
                          Timer: {scenario.timer_seconds}s
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => alert('Edit scenario coming soon')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Scenario"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => alert('Preview scenario coming soon')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Preview Scenario"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(scenario.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Another Scenario
          </button>
        </div>
      )}

      {/* Create Modal (Placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Scenario
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Advanced scenario builder with full branching logic, video integration, and metric configuration coming soon!
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scenario Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Initial Meeting with Alex"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question
                </label>
                <textarea
                  rows={3}
                  placeholder="What do you say to Alex?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Full scenario builder will be available in the next update');
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Scenario Builder Features
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Visual branching logic editor</li>
          <li>• Video integration from multiple sources</li>
          <li>• BRAVIN metrics configuration per option</li>
          <li>• Competency mapping and weights</li>
          <li>• Decision timer settings</li>
          <li>• Feedback video configuration</li>
        </ul>
      </div>
    </div>
  );
}
