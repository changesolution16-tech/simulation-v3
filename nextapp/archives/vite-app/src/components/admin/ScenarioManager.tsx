import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store';
import { Edit2, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, X, Eye, Copy, Target } from 'lucide-react';
import ScenarioCreationModal from './ScenarioCreationModal';
import ScenarioEditModal from './ScenarioEditModal';
import ScenarioPreview from './ScenarioPreview';
import { supabase } from '../../lib/supabase';

const ScenarioManager: React.FC = () => {
  const { scenarios, loadScenarios, deleteScenario, startPreview } = useSimulationStore();
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    loadScenarios().finally(() => setLoading(false));
  }, [loadScenarios]);
  
  const handleEdit = (scenarioId: string) => {
    setEditingScenario(scenarioId);
  };
  
  const handleDelete = async (scenarioId: string) => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      await deleteScenario(scenarioId);
    }
  };

  const handleDuplicate = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    try {
      setLoading(true);
      setError(null);

      const scenarioInsert: any = {
        topic_id: scenario.topicId,
        title: `${scenario.title} (Copy)`,
        description: scenario.description,
        difficulty: scenario.difficulty,
        is_end_scenario: scenario.isEndScenario,
        is_published: false,
        is_video_required: scenario.isVideoRequired,
        introduction_video_url: scenario.introductionVideoUrl || null,
        prompt_video_url: scenario.promptVideoUrl || null,
        transition_video_url: scenario.transitionVideoUrl || null,
        timer_enabled: scenario.timerEnabled || false,
        timer_visible: scenario.timerVisible || false,
        timer_display_location: scenario.timerDisplayLocation || 'hidden',
        timer_type: scenario.timerType || 'count_up',
        timer_limit_seconds: scenario.timerLimitSeconds || null,
        show_timer_in_feedback: scenario.showTimerInFeedback !== undefined ? scenario.showTimerInFeedback : true,
        timer_warning_threshold_seconds: scenario.timerWarningThresholdSeconds || 30,
        hierarchy_level: scenario.hierarchyLevel || null,
        auto_calculate_level: scenario.autoCalculateLevel !== undefined ? scenario.autoCalculateLevel : true,
        metadata: scenario.videoPrompt ? { videoPrompt: scenario.videoPrompt } : {}
      };

      const { data: newScenario, error: scenarioError } = await supabase
        .from('scenarios')
        .insert(scenarioInsert)
        .select()
        .single();

      if (scenarioError) throw scenarioError;

      if (scenario.options && scenario.options.length > 0) {
        const optionsToInsert = scenario.options.map((opt, index) => ({
          scenario_id: newScenario.id,
          option_text: opt.text,
          option_order: index,
          next_scenario_id: null,
          feedback_beginner: opt.feedback?.beginner || '',
          feedback_intermediate: opt.feedback?.intermediate || opt.feedback?.beginner || '',
          feedback_advanced: opt.feedback?.advanced || opt.feedback?.beginner || '',
          feedback_video_url_beginner: opt.feedbackVideos?.beginner || null,
          feedback_video_url_intermediate: opt.feedbackVideos?.intermediate || null,
          feedback_video_url_advanced: opt.feedbackVideos?.advanced || null,
          transition_video_url: opt.transitionVideoUrl || null,
          skill_impacts: opt.skillImpact || {},
          competency_impacts: opt.competency_impacts || {}
        }));

        const { data: insertedOptions, error: optionsError } = await supabase
          .from('scenario_options')
          .insert(optionsToInsert)
          .select();

        if (optionsError) throw optionsError;

        if (insertedOptions && scenario.options.some(o => o.metricScores && o.metricScores.length > 0)) {
          const metricScoresToInsert: any[] = [];

          scenario.options.forEach((opt, index) => {
            if (opt.metricScores && opt.metricScores.length > 0) {
              const insertedOption = insertedOptions[index];
              opt.metricScores.forEach((score: any) => {
                metricScoresToInsert.push({
                  scenario_id: newScenario.id,
                  option_id: insertedOption.id,
                  metric_id: score.metricId,
                  score_value: score.scoreValue,
                  score_description: score.scoreDescription || null,
                  is_primary_metric: score.isPrimaryMetric
                });
              });
            }
          });

          if (metricScoresToInsert.length > 0) {
            const { error: metricsError } = await supabase
              .from('scenario_option_metrics')
              .insert(metricScoresToInsert);

            if (metricsError) {
              console.error('Error duplicating metric scores:', metricsError);
            }
          }
        }
      }

      const { data: targetedCompetencies } = await supabase
        .from('scenario_targeted_competencies')
        .select('competency_id, target_weight, is_primary, development_priority, notes')
        .eq('scenario_id', scenarioId);

      if (targetedCompetencies && targetedCompetencies.length > 0) {
        const competenciesToInsert = targetedCompetencies.map(comp => ({
          scenario_id: newScenario.id,
          competency_id: comp.competency_id,
          target_weight: comp.target_weight,
          is_primary: comp.is_primary,
          development_priority: comp.development_priority,
          notes: comp.notes
        }));

        const { error: competenciesError } = await supabase
          .from('scenario_targeted_competencies')
          .insert(competenciesToInsert);

        if (competenciesError) {
          console.error('Error duplicating targeted competencies:', competenciesError);
        }
      }

      await loadScenarios();
      setSuccess(`Scenario "${scenario.title}" duplicated successfully!`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      console.error('Error duplicating scenario:', error);
      setError(error.message || 'Failed to duplicate scenario. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      startPreview(scenarioId, scenario.difficulty, scenario.topicId);
    }
  };

  const toggleExpand = (scenarioId: string) => {
    setExpandedScenario(expandedScenario === scenarioId ? null : scenarioId);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Scenarios</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Scenario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start justify-between z-50 relative">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start justify-between z-50 relative">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {scenarios.map((scenario) => (
            <li key={scenario.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleExpand(scenario.id)}
                      className="mr-4 text-gray-400 dark:text-gray-500 hover:text-gray-500"
                    >
                      {expandedScenario === scenario.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {scenario.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Topic: {scenario.topicId} • Difficulty: {scenario.difficulty} • Options: {scenario.options?.length || 0} • Level: {scenario.hierarchyLevel !== null && scenario.hierarchyLevel !== undefined ? (
                          <span className={`inline-flex items-center gap-1 ${scenario.autoCalculateLevel ? 'text-green-600' : 'text-blue-600'}`}>
                            {scenario.autoCalculateLevel && <RefreshCw className="inline w-3 h-3" />}
                            {!scenario.autoCalculateLevel && <Target className="inline w-3 h-3" />}
                            {scenario.hierarchyLevel} {scenario.autoCalculateLevel ? '(Auto)' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Not set</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePreview(scenario.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Preview scenario"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(scenario.id)}
                      className="text-purple-600 hover:text-purple-800"
                      title="Duplicate scenario"
                      disabled={loading}
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(scenario.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit scenario"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(scenario.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {expandedScenario === scenario.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="prose max-w-none">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</h4>
                      <p className="mt-1 text-sm text-gray-600">{scenario.description}</p>

                      {scenario.videoPrompt && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Video Prompt</h4>
                          <p className="mt-1 text-sm text-gray-600">{scenario.videoPrompt}</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Hierarchy Level</h4>
                        <div className="mt-1 flex items-center gap-2">
                          {scenario.hierarchyLevel !== null && scenario.hierarchyLevel !== undefined ? (
                            <>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                scenario.autoCalculateLevel
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {scenario.autoCalculateLevel ? (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                ) : (
                                  <Target className="w-3.5 h-3.5" />
                                )}
                                Level {scenario.hierarchyLevel}
                              </span>
                              <span className="text-xs text-gray-500">
                                {scenario.autoCalculateLevel ? 'Auto-calculated from connections' : 'Manually set'}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">No level assigned</span>
                          )}
                        </div>
                      </div>

                      <h4 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">Response Options</h4>
                      <div className="mt-2 space-y-3">
                        {scenario.options?.map((option, index) => (
                          <div key={option.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-start">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.text}</p>
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 font-medium">Beginner Feedback:</p>
                                  <p className="text-xs text-gray-600">{option.feedback?.beginner}</p>
                                </div>
                                {option.skillImpact && Object.keys(option.skillImpact).length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 font-medium">Skill Impact:</p>
                                    <div className="flex gap-2 mt-1">
                                      {Object.entries(option.skillImpact).map(([skill, points]) => (
                                        <span
                                          key={skill}
                                          className={`text-xs px-2 py-1 rounded ${
                                            points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {skill}: {points > 0 ? '+' : ''}{points}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showCreateModal && (
        <ScenarioCreationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(message) => {
            setSuccess(message);
            setShowCreateModal(false);
            loadScenarios();
            setTimeout(() => setSuccess(null), 5000);
          }}
          onError={(message) => {
            setError(message);
            setTimeout(() => setError(null), 5000);
          }}
        />
      )}

      {editingScenario && (
        <ScenarioEditModal
          scenario={scenarios.find(s => s.id === editingScenario)!}
          onClose={() => setEditingScenario(null)}
          onSuccess={(message) => {
            setSuccess(message);
            setEditingScenario(null);
            loadScenarios();
            setTimeout(() => setSuccess(null), 5000);
          }}
          onError={(message) => {
            setError(message);
            setTimeout(() => setError(null), 5000);
          }}
        />
      )}

      <ScenarioPreview />
    </div>
  );
};

export default ScenarioManager;