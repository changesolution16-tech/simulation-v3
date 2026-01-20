'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Save, Video } from 'lucide-react';
import TabNavigation, { Tab } from './TabNavigation';
import ScenarioMetricSelector from './ScenarioMetricSelector';
import AutoMappingPreview from './AutoMappingPreview';
import type { CompetencySuggestion } from '@/lib/autoMapping';
import OptionAccordion, { OptionAccordionData } from './OptionAccordion';
import VideoInputSelector from '../video/VideoInputSelector';
import HierarchyLevelSelector from './HierarchyLevelSelector';
import type { VideoInput } from '@/types';

interface ScenarioCreationModalProps {
  simulationId?: string;
  onClose: () => void;
  onSuccess: (message: string, scenarioId?: string) => void;
  onError: (message: string) => void;
}

interface Topic {
  id: string;
  title: string;
  description?: string;
}

const buildDefaultOption = (): OptionAccordionData => ({
  text: '',
  feedback_beginner: '',
  feedback_intermediate: '',
  feedback_advanced: '',
  feedback_video_beginner: null,
  feedback_video_intermediate: null,
  feedback_video_advanced: null,
  transition_video: null,
  skillImpact: { communication: 5 },
  competency_impacts: {},
  metricScores: []
});

const ScenarioCreationModal: React.FC<ScenarioCreationModalProps> = ({
  simulationId,
  onClose,
  onSuccess,
  onError
}) => {
  const [activeTab, setActiveTab] = useState('introduction');
  const [openAccordions, setOpenAccordions] = useState<number[]>([0]);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topicId: '',
    difficulty: 'beginner',
    isEndScenario: false,
    questionText: 'How would you respond?',
    timerEnabled: false,
    timerVisible: false,
    timerDisplayLocation: 'hidden' as const,
    timerType: 'count_up' as const,
    timerLimitSeconds: 60,
    showTimerInFeedback: true,
    timerWarningThresholdSeconds: 30,
    hierarchyLevel: 1,
    autoCalculateLevel: true
  });

  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<CompetencySuggestion[]>([]);
  const [showAutoMapping, setShowAutoMapping] = useState(false);
  const [introductionVideo, setIntroductionVideo] = useState<VideoInput>({ source: 'url' });
  const [promptVideo, setPromptVideo] = useState<VideoInput>({ source: 'url' });
  const [transitionVideo, setTransitionVideo] = useState<VideoInput>({ source: 'url' });

  const [options, setOptions] = useState<OptionAccordionData[]>([
    buildDefaultOption(),
    buildDefaultOption()
  ]);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      if (!response.ok) {
        throw new Error('Failed to load topics');
      }
      const data = await response.json();
      setTopics(data);
      if (data.length > 0 && !formData.topicId) {
        setFormData(prev => ({ ...prev, topicId: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      onError('Failed to load topics. Please try again.');
    }
  };

  const addOption = () => {
    if (options.length >= 4) {
      onError('Maximum 4 options allowed per scenario');
      return;
    }
    setOptions(prev => [...prev, buildDefaultOption()]);
    setOpenAccordions(prev => [...prev, options.length]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      onError('Minimum 2 options required per scenario');
      return;
    }
    setOptions(prev => prev.filter((_, i) => i !== index));
    setOpenAccordions(prev => prev.filter(i => i !== index).map(i => (i > index ? i - 1 : i)));
  };

  const updateOption = (index: number, field: string, value: any) => {
    setOptions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const isIntroductionValid = () => {
    return formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.topicId !== '';
  };

  const isOptionValid = (index: number) => {
    return options[index].text.trim() !== '' &&
      options[index].feedback_beginner.trim() !== '';
  };

  const getTabs = (): Tab[] => {
    const allOptionsValid = options.every((_, index) => isOptionValid(index));

    return [
      {
        id: 'introduction',
        label: '1. Introduction',
        isValid: isIntroductionValid(),
        isRequired: true
      },
      {
        id: 'questions',
        label: '2. Questions & Options',
        isValid: allOptionsValid,
        isRequired: true
      },
      {
        id: 'timer',
        label: '3. Decision Timer',
        isValid: true,
        isRequired: false
      }
    ];
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      onError('Please enter a scenario title');
      return false;
    }
    if (!formData.description.trim()) {
      onError('Please enter a scenario description');
      return false;
    }
    if (!formData.topicId) {
      onError('Please select a topic');
      return false;
    }

    for (let i = 0; i < options.length; i++) {
      if (!options[i].text.trim()) {
        onError(`Please enter text for option ${String.fromCharCode(65 + i)}`);
        return false;
      }
      if (!options[i].feedback_beginner.trim()) {
        onError(`Please enter beginner feedback for option ${String.fromCharCode(65 + i)}`);
        return false;
      }
    }

    return true;
  };

  const toVideoPayload = (input?: VideoInput | null) => ({
    url: input?.url || null,
    source: input?.source || null,
    fileId: input?.fileId || null,
    embedCode: input?.embedCode || null
  });

  const createScenario = async () => {
    const payload = {
      title: formData.title,
      description: formData.description,
      question_text: formData.questionText,
      topic_id: formData.topicId,
      difficulty: formData.difficulty,
      is_end_scenario: formData.isEndScenario,
      prompt_video_url: toVideoPayload(promptVideo).url,
      prompt_video_source: toVideoPayload(promptVideo).source,
      prompt_video_file_id: toVideoPayload(promptVideo).fileId,
      introduction_video_url: toVideoPayload(introductionVideo).url,
      introduction_video_source: toVideoPayload(introductionVideo).source,
      introduction_video_file_id: toVideoPayload(introductionVideo).fileId,
      transition_video_url: toVideoPayload(transitionVideo).url,
      transition_video_source: toVideoPayload(transitionVideo).source,
      transition_video_file_id: toVideoPayload(transitionVideo).fileId,
      timer_enabled: formData.timerEnabled,
      timer_visible: formData.timerVisible,
      timer_display_location: formData.timerDisplayLocation,
      timer_type: formData.timerType,
      timer_limit_seconds: formData.timerEnabled ? formData.timerLimitSeconds : null,
      show_timer_in_feedback: formData.showTimerInFeedback,
      timer_warning_threshold_seconds: formData.timerWarningThresholdSeconds,
      hierarchy_level: formData.hierarchyLevel,
      auto_calculate_level: formData.autoCalculateLevel
    };

    const endpoint = simulationId
      ? `/api/simulations/${simulationId}/scenarios`
      : '/api/scenarios';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create scenario');
    }

    const data = await response.json();
    return data.scenario?.id || data.id;
  };

  const createOptions = async (scenarioId: string) => {
    const createdOptionIds: string[] = [];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const response = await fetch(`/api/scenarios/${scenarioId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          option_text: opt.text,
          option_order: i,
          feedback_beginner: opt.feedback_beginner,
          feedback_intermediate: opt.feedback_intermediate,
          feedback_advanced: opt.feedback_advanced,
          feedback_video_url_beginner: opt.feedback_video_beginner?.url || null,
          feedback_video_source_beginner: opt.feedback_video_beginner?.source || null,
          feedback_video_file_id_beginner: opt.feedback_video_beginner?.fileId || null,
          feedback_video_url_intermediate: opt.feedback_video_intermediate?.url || null,
          feedback_video_source_intermediate: opt.feedback_video_intermediate?.source || null,
          feedback_video_file_id_intermediate: opt.feedback_video_intermediate?.fileId || null,
          feedback_video_url_advanced: opt.feedback_video_advanced?.url || null,
          feedback_video_source_advanced: opt.feedback_video_advanced?.source || null,
          feedback_video_file_id_advanced: opt.feedback_video_advanced?.fileId || null,
          transition_video_url: opt.transition_video?.url || null,
          transition_video_source: opt.transition_video?.source || null,
          transition_video_file_id: opt.transition_video?.fileId || null,
          skill_impacts: opt.skillImpact || {},
          competency_impacts: opt.competency_impacts || {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create option');
      }

      const created = await response.json();
      createdOptionIds.push(created.id);
    }

    return createdOptionIds;
  };

  const saveMetricScores = async (scenarioId: string, optionIds: string[]) => {
    if (selectedMetricIds.length === 0) return;

    for (let i = 0; i < optionIds.length; i++) {
      const optionId = optionIds[i];
      const opt = options[i];
      const metricsPayload = (opt.metricScores || []).map((score) => ({
        metricId: score.metricId,
        scoreValue: score.scoreValue,
        scoreDescription: score.scoreDescription,
        isPrimaryMetric: score.isPrimaryMetric
      }));

      if (metricsPayload.length === 0) continue;

      await fetch(`/api/scenarios/${scenarioId}/options/${optionId}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsPayload)
      });
    }
  };

  const saveTargetedCompetencies = async (scenarioId: string) => {
    if (acceptedSuggestions.length === 0) return;

    await fetch(`/api/scenarios/${scenarioId}/competencies`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        acceptedSuggestions.map((suggestion) => ({
          competency_id: suggestion.competency_id,
          target_weight: suggestion.target_weight,
          is_primary: suggestion.is_primary,
          development_priority: suggestion.development_priority,
          notes: suggestion.rationale
        }))
      )
    });
  };

  const handleSave = async () => {
    setInlineError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const scenarioId = await createScenario();
      const optionIds = await createOptions(scenarioId);
      await saveMetricScores(scenarioId, optionIds);
      await saveTargetedCompetencies(scenarioId);

      onSuccess(`Scenario "${formData.title}" created successfully!`, scenarioId);
      onClose();
    } catch (error: any) {
      console.error('Error creating scenario:', error);
      const errorMessage = error.message || 'Failed to create scenario. Please try again.';
      setInlineError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderIntroductionTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scenario Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Handling a Difficult Conversation"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the scenario situation and context..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic *
          </label>
          <select
            value={formData.topicId}
            onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is-end-scenario"
          type="checkbox"
          checked={formData.isEndScenario}
          onChange={(e) => setFormData({ ...formData, isEndScenario: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is-end-scenario" className="text-sm text-gray-700">
          End Scenario (shows results)
        </label>
      </div>

      <HierarchyLevelSelector
        value={formData.hierarchyLevel}
        autoCalculate={formData.autoCalculateLevel}
        calculatedLevel={formData.hierarchyLevel}
        onChange={(value) => setFormData({ ...formData, hierarchyLevel: value || 0 })}
        onAutoCalculateChange={(auto) => setFormData({ ...formData, autoCalculateLevel: auto })}
      />

      <div className="space-y-4">
        <VideoInputSelector
          label="Introduction Video"
          value={introductionVideo}
          onChange={setIntroductionVideo}
          videoType="introduction"
          category="introductions"
        />

        <VideoInputSelector
          label="Prompt Video"
          value={promptVideo}
          onChange={setPromptVideo}
          videoType="prompt"
          category="prompts"
        />

        <VideoInputSelector
          label="Transition Video"
          value={transitionVideo}
          onChange={setTransitionVideo}
          videoType="transition"
          category="transitions"
        />
      </div>
    </div>
  );

  const renderQuestionsTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text *
        </label>
        <textarea
          value={formData.questionText}
          onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="How would you respond?"
        />
      </div>

      <ScenarioMetricSelector
        selectedMetricIds={selectedMetricIds}
        onMetricsChange={(ids) => {
          setSelectedMetricIds(ids);
          if (ids.length > 0 && !showAutoMapping) {
            setShowAutoMapping(true);
          }
        }}
      />

      {selectedMetricIds.length > 0 && showAutoMapping && (
        <div className="border-t pt-4">
          <AutoMappingPreview
            metricIds={selectedMetricIds}
            existingCompetencyIds={selectedCompetencyIds}
            onAcceptSuggestions={(suggestions) => {
              setAcceptedSuggestions(suggestions);
              setSelectedCompetencyIds(suggestions.map((s) => s.competency_id));
              setShowAutoMapping(false);
            }}
            onRejectSuggestions={() => {
              setShowAutoMapping(false);
            }}
            showCompetencySuggestions
            showMappingPreview={false}
          />
        </div>
      )}

      {acceptedSuggestions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2">
            ✓ {acceptedSuggestions.length} Competenc
            {acceptedSuggestions.length === 1 ? 'y' : 'ies'} Selected
          </h4>
          <div className="space-y-1">
            {acceptedSuggestions.map((suggestion) => (
              <div key={suggestion.competency_id} className="text-xs text-green-800">
                • {suggestion.competency_code} - {suggestion.competency_name} (
                {suggestion.confidence} confidence)
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAutoMapping(true)}
            className="mt-2 text-xs text-green-700 hover:text-green-900 font-medium"
          >
            Review and modify selections
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Response Options
          </h3>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Option
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <OptionAccordion
              key={`option-${index}`}
              option={option}
              index={index}
              isOpen={openAccordions.includes(index)}
              onToggle={() =>
                setOpenAccordions((prev) =>
                  prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
                )
              }
              onChange={(field, value) => updateOption(index, field, value)}
              onRemove={() => removeOption(index)}
              canRemove={options.length > 2}
              selectedMetricIds={selectedMetricIds}
              topicId={formData.topicId}
              scenarioTitle={formData.title}
              scenarioDifficulty={formData.difficulty}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimerTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input
          id="timer-enabled"
          type="checkbox"
          checked={formData.timerEnabled}
          onChange={(e) => setFormData({ ...formData, timerEnabled: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="timer-enabled" className="text-sm text-gray-700">
          Enable Decision Timer
        </label>
      </div>

      {formData.timerEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timer Type
              </label>
              <select
                value={formData.timerType}
                onChange={(e) => setFormData({ ...formData, timerType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="count_up">Count Up</option>
                <option value="count_down">Count Down</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                value={formData.timerLimitSeconds}
                onChange={(e) => setFormData({ ...formData, timerLimitSeconds: parseInt(e.target.value, 10) || 60 })}
                min="10"
                max="600"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="timer-visible"
              type="checkbox"
              checked={formData.timerVisible}
              onChange={(e) => setFormData({ ...formData, timerVisible: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="timer-visible" className="text-sm text-gray-700">
              Show Timer to Learner
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="timer-feedback"
              type="checkbox"
              checked={formData.showTimerInFeedback}
              onChange={(e) => setFormData({ ...formData, showTimerInFeedback: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="timer-feedback" className="text-sm text-gray-700">
              Show Decision Time in Feedback
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warning Threshold (seconds)
            </label>
            <input
              type="number"
              value={formData.timerWarningThresholdSeconds}
              onChange={(e) => setFormData({ ...formData, timerWarningThresholdSeconds: parseInt(e.target.value, 10) || 30 })}
              min="5"
              max="300"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Scenario</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Build a scenario with guided steps.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <TabNavigation tabs={getTabs()} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto p-6">
          {inlineError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
              {inlineError}
            </div>
          )}

          {activeTab === 'introduction' && renderIntroductionTab()}
          {activeTab === 'questions' && renderQuestionsTab()}
          {activeTab === 'timer' && renderTimerTab()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {getTabs().map((tab) => (
              <span key={tab.id} className={`px-2 py-1 rounded ${tab.isValid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {tab.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Scenario
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioCreationModal;
