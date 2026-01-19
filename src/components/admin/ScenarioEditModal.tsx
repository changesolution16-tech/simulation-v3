'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Save, Video } from 'lucide-react';
import TabNavigation, { Tab } from './TabNavigation';
import ScenarioMetricSelector from './ScenarioMetricSelector';
import ScenarioCompetencySelector from './ScenarioCompetencySelector';
import OptionAccordion, { OptionAccordionData } from './OptionAccordion';
import VideoInputSelector from '../video/VideoInputSelector';
import HierarchyLevelSelector from './HierarchyLevelSelector';
import type { VideoInput } from '@/types';

interface ScenarioEditModalProps {
  scenarioId: string;
  simulationId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
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

const ScenarioEditModal: React.FC<ScenarioEditModalProps> = ({
  scenarioId,
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
  const [removedOptionIds, setRemovedOptionIds] = useState<string[]>([]);

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
  const [introductionVideo, setIntroductionVideo] = useState<VideoInput>({ source: 'url' });
  const [promptVideo, setPromptVideo] = useState<VideoInput>({ source: 'url' });
  const [transitionVideo, setTransitionVideo] = useState<VideoInput>({ source: 'url' });

  const [options, setOptions] = useState<OptionAccordionData[]>([]);

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    loadScenario();
  }, [scenarioId]);

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      if (!response.ok) {
        throw new Error('Failed to load topics');
      }
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
      onError('Failed to load topics. Please try again.');
    }
  };

  const toVideoInput = (data: any): VideoInput | null => {
    if (!data?.url && !data?.file_id && !data?.source) return null;
    return {
      source: data.source || 'url',
      url: data.url || undefined,
      fileId: data.file_id || undefined
    };
  };

  const loadScenario = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`);
      if (!response.ok) {
        throw new Error('Failed to load scenario');
      }
      const scenario = await response.json();

      setFormData({
        title: scenario.title || '',
        description: scenario.description || '',
        topicId: scenario.topic_id || '',
        difficulty: scenario.difficulty || 'beginner',
        isEndScenario: scenario.is_end_scenario || false,
        questionText: scenario.question_text || 'How would you respond?',
        timerEnabled: scenario.timer_enabled || false,
        timerVisible: scenario.timer_visible || false,
        timerDisplayLocation: scenario.timer_display_location || 'hidden',
        timerType: scenario.timer_type || 'count_up',
        timerLimitSeconds: scenario.timer_limit_seconds || 60,
        showTimerInFeedback: scenario.show_timer_in_feedback ?? true,
        timerWarningThresholdSeconds: scenario.timer_warning_threshold_seconds || 30,
        hierarchyLevel: scenario.hierarchy_level || 1,
        autoCalculateLevel: scenario.auto_calculate_level ?? true
      });

      setIntroductionVideo(toVideoInput({
        url: scenario.introduction_video_url,
        source: scenario.introduction_video_source,
        file_id: scenario.introduction_video_file_id
      }) || { source: 'url' });

      setPromptVideo(toVideoInput({
        url: scenario.prompt_video_url,
        source: scenario.prompt_video_source,
        file_id: scenario.prompt_video_file_id
      }) || { source: 'url' });

      setTransitionVideo(toVideoInput({
        url: scenario.transition_video_url,
        source: scenario.transition_video_source,
        file_id: scenario.transition_video_file_id
      }) || { source: 'url' });

      const optionData = scenario.options || [];

      const optionWithMetrics = await Promise.all(
        optionData.map(async (opt: any) => {
          const metricsResponse = await fetch(`/api/scenarios/${scenarioId}/options/${opt.id}/metrics`);
          const metrics = metricsResponse.ok ? await metricsResponse.json() : [];

          return {
            id: opt.id,
            text: opt.option_text || '',
            feedback_beginner: opt.feedback_beginner || '',
            feedback_intermediate: opt.feedback_intermediate || '',
            feedback_advanced: opt.feedback_advanced || '',
            feedback_video_beginner: toVideoInput({
              url: opt.feedback_video_url_beginner,
              source: opt.feedback_video_source_beginner,
              file_id: opt.feedback_video_file_id_beginner
            }),
            feedback_video_intermediate: toVideoInput({
              url: opt.feedback_video_url_intermediate,
              source: opt.feedback_video_source_intermediate,
              file_id: opt.feedback_video_file_id_intermediate
            }),
            feedback_video_advanced: toVideoInput({
              url: opt.feedback_video_url_advanced,
              source: opt.feedback_video_source_advanced,
              file_id: opt.feedback_video_file_id_advanced
            }),
            transition_video: toVideoInput({
              url: opt.transition_video_url,
              source: opt.transition_video_source,
              file_id: opt.transition_video_file_id
            }),
            skillImpact: opt.skill_impacts || {},
            competency_impacts: opt.competency_impacts || {},
            metricScores: (metrics || []).map((metric: any) => ({
              metricId: metric.metric_id,
              scoreValue: metric.score_value,
              scoreDescription: metric.score_description || '',
              isPrimaryMetric: metric.is_primary_metric
            }))
          } as OptionAccordionData;
        })
      );

      const metricIdSet = new Set<string>();
      optionWithMetrics.forEach((opt) => {
        opt.metricScores?.forEach((score) => metricIdSet.add(score.metricId));
      });

      setOptions(optionWithMetrics.length > 0 ? optionWithMetrics : [buildDefaultOption(), buildDefaultOption()]);
      setSelectedMetricIds(Array.from(metricIdSet));
    } catch (error: any) {
      console.error('Error loading scenario:', error);
      onError(error.message || 'Failed to load scenario');
    } finally {
      setLoading(false);
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
    const option = options[index];
    if (option.id) {
      setRemovedOptionIds(prev => [...prev, option.id as string]);
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
        id: 'competencies',
        label: '2. Competencies',
        isValid: true,
        isRequired: false
      },
      {
        id: 'questions',
        label: '3. Questions & Options',
        isValid: allOptionsValid,
        isRequired: true
      },
      {
        id: 'timer',
        label: '4. Decision Timer',
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

  const updateScenario = async () => {
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

    const response = await fetch(`/api/scenarios/${scenarioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update scenario');
    }
  };

  const upsertOptions = async () => {
    const optionIdMap = new Map<number, string>();
    const updatedOptions = [...options];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (opt.id) {
        const response = await fetch(`/api/options/${opt.id}`, {
          method: 'PATCH',
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
          throw new Error(error.error || 'Failed to update option');
        }

        optionIdMap.set(i, opt.id as string);
      } else {
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
        optionIdMap.set(i, created.id);
        updatedOptions[i] = { ...opt, id: created.id };
      }
    }

    setOptions(updatedOptions);
    return optionIdMap;
  };

  const saveMetricScores = async (optionIdMap: Map<number, string>) => {
    if (selectedMetricIds.length === 0) return;

    for (let i = 0; i < options.length; i++) {
      const optionId = optionIdMap.get(i);
      if (!optionId) continue;

      const opt = options[i];
      const metricsPayload = (opt.metricScores || []).map((score) => ({
        metricId: score.metricId,
        scoreValue: score.scoreValue,
        scoreDescription: score.scoreDescription,
        isPrimaryMetric: score.isPrimaryMetric
      }));

      await fetch(`/api/scenarios/${scenarioId}/options/${optionId}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsPayload)
      });
    }
  };

  const removeDeletedOptions = async () => {
    for (const optionId of removedOptionIds) {
      await fetch(`/api/options/${optionId}`, {
        method: 'DELETE'
      });
    }
    setRemovedOptionIds([]);
  };

  const handleSave = async () => {
    setInlineError(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateScenario();
      const optionIdMap = await upsertOptions();
      await saveMetricScores(optionIdMap);
      await removeDeletedOptions();
      onSuccess(`Scenario "${formData.title}" updated successfully!`);
      onClose();
    } catch (error: any) {
      console.error('Error updating scenario:', error);
      const errorMessage = error.message || 'Failed to update scenario. Please try again.';
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
          referenceId={scenarioId}
        />

        <VideoInputSelector
          label="Prompt Video"
          value={promptVideo}
          onChange={setPromptVideo}
          videoType="prompt"
          category="prompts"
          referenceId={scenarioId}
        />

        <VideoInputSelector
          label="Transition Video"
          value={transitionVideo}
          onChange={setTransitionVideo}
          videoType="transition"
          category="transitions"
          referenceId={scenarioId}
        />
      </div>
    </div>
  );

  const renderCompetenciesTab = () => (
    <ScenarioCompetencySelector scenarioId={scenarioId} />
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
        onMetricsChange={setSelectedMetricIds}
      />

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
              key={`option-${option.id || index}`}
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
              isEditMode
              simulationId={simulationId}
              scenarioId={scenarioId}
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

  if (loading && options.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Scenario</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Update scenario content and options.</p>
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
          {activeTab === 'competencies' && renderCompetenciesTab()}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioEditModal;
