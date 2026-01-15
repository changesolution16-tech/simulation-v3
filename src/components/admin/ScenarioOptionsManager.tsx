'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Video, ArrowRight } from 'lucide-react';

interface Option {
  id: string;
  option_text: string;
  option_order: number;
  next_scenario_id?: string;
  feedback_beginner?: string;
  feedback_intermediate?: string;
  feedback_advanced?: string;
  feedback_video_url_beginner?: string;
  feedback_video_url_intermediate?: string;
  feedback_video_url_advanced?: string;
  competency_impacts?: Record<string, number>;
}

interface ScenarioOptionsManagerProps {
  scenarioId: string;
  simulationId: string;
}

export default function ScenarioOptionsManager({
  scenarioId,
  simulationId,
}: ScenarioOptionsManagerProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    option_text: '',
    next_scenario_id: '',
    feedback_beginner: '',
    feedback_intermediate: '',
    feedback_advanced: '',
    feedback_video_url_beginner: '',
    feedback_video_url_intermediate: '',
    feedback_video_url_advanced: '',
  });

  useEffect(() => {
    loadData();
  }, [scenarioId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [optionsRes, scenariosRes] = await Promise.all([
        fetch(`/api/scenarios/${scenarioId}/options`),
        fetch(`/api/simulations/${simulationId}/scenarios`),
      ]);

      if (optionsRes.ok) {
        const optionsData = await optionsRes.json();
        setOptions(optionsData);
      }

      if (scenariosRes.ok) {
        const scenariosData = await scenariosRes.json();
        setScenarios(scenariosData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.option_text.trim()) {
      alert('Please enter option text');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          option_order: options.length,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowCreateModal(false);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create option');
      }
    } catch (error) {
      console.error('Error creating option:', error);
      alert('Failed to create option');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingOption || !formData.option_text.trim()) {
      alert('Please enter option text');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/options/${editingOption.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        setEditingOption(null);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update option');
      }
    } catch (error) {
      console.error('Error updating option:', error);
      alert('Failed to update option');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (optionId: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      const response = await fetch(`/api/options/${optionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to delete option');
      }
    } catch (error) {
      console.error('Error deleting option:', error);
      alert('Failed to delete option');
    }
  };

  const openEditModal = (option: Option) => {
    setEditingOption(option);
    setFormData({
      option_text: option.option_text || '',
      next_scenario_id: option.next_scenario_id || '',
      feedback_beginner: option.feedback_beginner || '',
      feedback_intermediate: option.feedback_intermediate || '',
      feedback_advanced: option.feedback_advanced || '',
      feedback_video_url_beginner: option.feedback_video_url_beginner || '',
      feedback_video_url_intermediate: option.feedback_video_url_intermediate || '',
      feedback_video_url_advanced: option.feedback_video_url_advanced || '',
    });
  };

  const resetForm = () => {
    setFormData({
      option_text: '',
      next_scenario_id: '',
      feedback_beginner: '',
      feedback_intermediate: '',
      feedback_advanced: '',
      feedback_video_url_beginner: '',
      feedback_video_url_intermediate: '',
      feedback_video_url_advanced: '',
    });
  };

  const getScenarioName = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    return scenario?.scenario_name || 'Unknown Scenario';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {options.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No options yet. Add response choices for learners.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Option
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {option.option_text}
                    </p>
                  </div>

                  <div className="ml-10 space-y-1">
                    {option.next_scenario_id && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ArrowRight className="w-3 h-3" />
                        <span>Leads to: {getScenarioName(option.next_scenario_id)}</span>
                      </div>
                    )}
                    {option.feedback_beginner && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Feedback:</span> {option.feedback_beginner.substring(0, 100)}
                        {option.feedback_beginner.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(option)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit Option"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Another Option
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingOption) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingOption ? 'Edit Option' : 'Create New Option'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingOption(null);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Option Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Option Text *
                </label>
                <textarea
                  value={formData.option_text}
                  onChange={(e) =>
                    setFormData({ ...formData, option_text: e.target.value })
                  }
                  rows={2}
                  placeholder="e.g., I would approach them calmly and ask if everything is okay"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Next Scenario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Next Scenario (Optional)
                </label>
                <select
                  value={formData.next_scenario_id}
                  onChange={(e) =>
                    setFormData({ ...formData, next_scenario_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- End simulation --</option>
                  {scenarios
                    .filter((s) => s.id !== scenarioId)
                    .map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.scenario_name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Which scenario should play next if this option is selected?
                </p>
              </div>

              {/* Feedback Beginner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback (Beginner Level)
                </label>
                <textarea
                  value={formData.feedback_beginner}
                  onChange={(e) =>
                    setFormData({ ...formData, feedback_beginner: e.target.value })
                  }
                  rows={3}
                  placeholder="Provide feedback for this choice at beginner difficulty..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Feedback Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback Video URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.feedback_video_url_beginner}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      feedback_video_url_beginner: e.target.value,
                    })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Expandable Advanced Settings */}
              <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                  Advanced: Difficulty-Specific Feedback
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Intermediate Feedback
                    </label>
                    <textarea
                      value={formData.feedback_intermediate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          feedback_intermediate: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Leave blank to use beginner feedback"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Advanced Feedback
                    </label>
                    <textarea
                      value={formData.feedback_advanced}
                      onChange={(e) =>
                        setFormData({ ...formData, feedback_advanced: e.target.value })
                      }
                      rows={2}
                      placeholder="Leave blank to use beginner feedback"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </details>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingOption(null);
                  resetForm();
                }}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={editingOption ? handleUpdate : handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingOption ? 'Update' : 'Create'} Option
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      {options.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> Each option represents a choice the learner can make. Add feedback
            to guide learning and connect options to build branching scenarios.
          </p>
        </div>
      )}
    </div>
  );
}
