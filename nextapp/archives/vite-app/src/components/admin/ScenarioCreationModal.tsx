import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Difficulty, VideoInput, VideoSource } from '../../types';
import VideoInputSelectorWithLibrary from '../video/VideoInputSelectorWithLibrary';
import TabNavigation, { Tab } from './TabNavigation';
import ScenarioMetricSelector from './ScenarioMetricSelector';
import OptionAccordion, { OptionAccordionData } from './OptionAccordion';
import AutoMappingPreview from './AutoMappingPreview';
import { AutoMappingService, CompetencySuggestion } from '../../lib/autoMapping';
import { ScenarioCompetencyService } from '../../lib/scenarioCompetencies';

interface ScenarioCreationModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface Topic {
  id: string;
  title: string;
  description: string;
}

interface OptionForm {
  text: string;
  feedback_beginner: string;
  feedback_intermediate: string;
  feedback_advanced: string;
  feedback_video_beginner: VideoInput | null;
  feedback_video_intermediate: VideoInput | null;
  feedback_video_advanced: VideoInput | null;
  transition_video: VideoInput | null;
  skillImpact: { [key: string]: number };
  metricScores: OptionMetricScoreData[];
}

const ScenarioCreationModal: React.FC<ScenarioCreationModalProps> = ({ onClose, onSuccess, onError }) => {
  const [activeTab, setActiveTab] = useState('introduction');
  const [openAccordions, setOpenAccordions] = useState<number[]>([0]);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topicId: '',
    difficulty: 'beginner' as Difficulty,
    videoPrompt: '',
    isVideoRequired: false,
    isEndScenario: false,
    timerEnabled: false,
    timerVisible: false,
    timerDisplayLocation: 'hidden' as const,
    timerType: 'count_up' as const,
    timerLimitSeconds: 60,
    showTimerInFeedback: true,
    timerWarningThresholdSeconds: 30,
    questionText: 'How would you respond?',
  });

  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<CompetencySuggestion[]>([]);
  const [showAutoMapping, setShowAutoMapping] = useState(false);

  const [introductionVideo, setIntroductionVideo] = useState<VideoInput>({ source: 'url' });
  const [promptVideo, setPromptVideo] = useState<VideoInput>({ source: 'url' });
  const [transitionVideo, setTransitionVideo] = useState<VideoInput>({ source: 'url' });

  const [options, setOptions] = useState<OptionForm[]>([
    {
      text: '',
      feedback_beginner: '',
      feedback_intermediate: '',
      feedback_advanced: '',
      feedback_video_beginner: null,
      feedback_video_intermediate: null,
      feedback_video_advanced: null,
      transition_video: null,
      skillImpact: { communication: 10 },
      metricScores: []
    },
    {
      text: '',
      feedback_beginner: '',
      feedback_intermediate: '',
      feedback_advanced: '',
      feedback_video_beginner: null,
      feedback_video_intermediate: null,
      feedback_video_advanced: null,
      transition_video: null,
      skillImpact: { communication: 5 },
      metricScores: []
    }
  ]);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, description')
        .order('title');

      if (error) throw error;
      if (data && data.length > 0) {
        setTopics(data);
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
    setOptions([...options, {
      text: '',
      feedback_beginner: '',
      feedback_intermediate: '',
      feedback_advanced: '',
      feedback_video_beginner: null,
      feedback_video_intermediate: null,
      feedback_video_advanced: null,
      transition_video: null,
      skillImpact: { communication: 0 },
      metricScores: []
    }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      onError('Minimum 2 options required per scenario');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updated = [...options];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...(updated[index] as any)[parent],
          [child]: value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOptions(updated);
  };

  const isIntroductionValid = () => {
    return formData.title.trim() !== '' &&
           formData.description.trim() !== '' &&
           formData.topicId !== '';
  };

  const isQuestionsValid = () => {
    return true;
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
        isValid: isQuestionsValid() && allOptionsValid,
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

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    for (let i = 0; i < options.length; i++) {
      if (!options[i].text.trim()) {
        onError(`Please enter text for option ${String.fromCharCode(65 + i)}`);
        return false;
      }
      if (!options[i].feedback_beginner.trim()) {
        onError(`Please enter beginner feedback for option ${String.fromCharCode(65 + i)}`);
        return false;
      }

      if (uuidPattern.test(options[i].feedback_beginner)) {
        onError(`Option ${String.fromCharCode(65 + i)} beginner feedback contains invalid data (UUID detected). Please enter proper feedback text.`);
        return false;
      }
      if (options[i].feedback_intermediate && uuidPattern.test(options[i].feedback_intermediate)) {
        onError(`Option ${String.fromCharCode(65 + i)} intermediate feedback contains invalid data (UUID detected). Please enter proper feedback text.`);
        return false;
      }
      if (options[i].feedback_advanced && uuidPattern.test(options[i].feedback_advanced)) {
        onError(`Option ${String.fromCharCode(65 + i)} advanced feedback contains invalid data (UUID detected). Please enter proper feedback text.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const scenarioInsert: any = {
        topic_id: formData.topicId,
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        is_end_scenario: formData.isEndScenario,
        is_published: false,
        introduction_video_url: introductionVideo.url || null,
        prompt_video_url: promptVideo.url || null,
        transition_video_url: transitionVideo.url || null,
        is_video_required: formData.isVideoRequired,
        timer_enabled: formData.timerEnabled,
        timer_visible: formData.timerVisible,
        timer_display_location: formData.timerDisplayLocation,
        timer_type: formData.timerType,
        timer_limit_seconds: formData.timerType === 'countdown' ? formData.timerLimitSeconds : null,
        show_timer_in_feedback: formData.showTimerInFeedback,
        timer_warning_threshold_seconds: formData.timerType === 'countdown' ? formData.timerWarningThresholdSeconds : null,
        question_text: formData.questionText || 'How would you respond?',
        metadata: {
          videoPrompt: formData.videoPrompt
        }
      };

      if (introductionVideo.libraryId) {
        scenarioInsert.introduction_video_library_id = introductionVideo.libraryId;
      }
      if (promptVideo.libraryId) {
        scenarioInsert.prompt_video_library_id = promptVideo.libraryId;
      }
      if (transitionVideo.libraryId) {
        scenarioInsert.transition_video_library_id = transitionVideo.libraryId;
      }

      const { data: scenarioData, error: scenarioError } = await supabase
        .from('scenarios')
        .insert(scenarioInsert)
        .select()
        .single();

      if (scenarioError) throw scenarioError;

      if (introductionVideo.libraryId) {
        await supabase.rpc('increment_video_usage', { video_id_param: introductionVideo.libraryId });
      }
      if (promptVideo.libraryId) {
        await supabase.rpc('increment_video_usage', { video_id_param: promptVideo.libraryId });
      }
      if (transitionVideo.libraryId) {
        await supabase.rpc('increment_video_usage', { video_id_param: transitionVideo.libraryId });
      }

      const optionsToInsert = options.map((opt, index) => ({
        scenario_id: scenarioData.id,
        option_text: opt.text,
        option_order: index,
        feedback_beginner: opt.feedback_beginner,
        feedback_intermediate: opt.feedback_intermediate || opt.feedback_beginner,
        feedback_advanced: opt.feedback_advanced || opt.feedback_beginner,
        feedback_video_url_beginner: opt.feedback_video_beginner?.url || null,
        feedback_video_url_intermediate: opt.feedback_video_intermediate?.url || null,
        feedback_video_url_advanced: opt.feedback_video_advanced?.url || null,
        feedback_video_source_beginner: opt.feedback_video_beginner?.source || null,
        feedback_video_source_intermediate: opt.feedback_video_intermediate?.source || null,
        feedback_video_source_advanced: opt.feedback_video_advanced?.source || null,
        feedback_video_library_id_beginner: opt.feedback_video_beginner?.libraryId || null,
        feedback_video_library_id_intermediate: opt.feedback_video_intermediate?.libraryId || null,
        feedback_video_library_id_advanced: opt.feedback_video_advanced?.libraryId || null,
        feedback_video_file_id_beginner: opt.feedback_video_beginner?.fileId || null,
        feedback_video_file_id_intermediate: opt.feedback_video_intermediate?.fileId || null,
        feedback_video_file_id_advanced: opt.feedback_video_advanced?.fileId || null,
        feedback_video_embed_code_beginner: opt.feedback_video_beginner?.embedCode || null,
        feedback_video_embed_code_intermediate: opt.feedback_video_intermediate?.embedCode || null,
        feedback_video_embed_code_advanced: opt.feedback_video_advanced?.embedCode || null,
        transition_video_url: opt.transition_video?.url || null,
        transition_video_source: opt.transition_video?.source || null,
        transition_video_library_id: opt.transition_video?.libraryId || null,
        transition_video_file_id: opt.transition_video?.fileId || null,
        transition_video_embed_code: opt.transition_video?.embedCode || null,
        skill_impacts: opt.skillImpact,
        is_optimal_choice: index === 0
      }));

      const { data: insertedOptions, error: optionsError } = await supabase
        .from('scenario_options')
        .insert(optionsToInsert)
        .select();

      if (optionsError) throw optionsError;
      if (!insertedOptions) throw new Error('Failed to get inserted option IDs');

      for (const opt of options) {
        if (opt.feedback_video_beginner?.libraryId) {
          await supabase.rpc('increment_video_usage', { video_id_param: opt.feedback_video_beginner.libraryId });
        }
        if (opt.feedback_video_intermediate?.libraryId) {
          await supabase.rpc('increment_video_usage', { video_id_param: opt.feedback_video_intermediate.libraryId });
        }
        if (opt.feedback_video_advanced?.libraryId) {
          await supabase.rpc('increment_video_usage', { video_id_param: opt.feedback_video_advanced.libraryId });
        }
        if (opt.transition_video?.libraryId) {
          await supabase.rpc('increment_video_usage', { video_id_param: opt.transition_video.libraryId });
        }
      }

      if (acceptedSuggestions.length > 0) {
        const success = await ScenarioCompetencyService.setTargetedCompetencies(
          scenarioData.id,
          acceptedSuggestions.map(s => ({
            competency_id: s.competency_id,
            target_weight: s.target_weight,
            is_primary: s.is_primary,
            development_priority: s.development_priority,
            notes: s.rationale
          }))
        );

        if (!success) {
          console.warn('Failed to create targeted competencies, but continuing...');
        }
      }

      if (selectedMetricIds.length > 0) {
        const metricInserts = [];
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          const insertedOption = insertedOptions[i];

          for (const metricScore of opt.metricScores) {
            metricInserts.push({
              scenario_id: scenarioData.id,
              option_id: insertedOption.id,
              metric_id: metricScore.metricId,
              score_value: metricScore.scoreValue,
              score_description: metricScore.scoreDescription || null,
              is_primary_metric: metricScore.isPrimaryMetric,
              weight: 1.0
            });
          }
        }

        if (metricInserts.length > 0) {
          const { error: metricsError } = await supabase
            .from('scenario_option_metrics')
            .insert(metricInserts);

          if (metricsError) {
            console.error('Error inserting metric scores:', metricsError);
          }
        }
      }

      onSuccess(`Scenario "${formData.title}" created successfully!`);
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
            Difficulty *
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <VideoInputSelectorWithLibrary
          label="Introduction Video"
          value={introductionVideo}
          onChange={setIntroductionVideo}
          videoType="introduction"
          helpText="Video shown first to introduce the scenario"
          filterByTopic={formData.topicId}
          scenarioName={formData.title}
          scenarioDifficulty={formData.difficulty}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Video className="inline w-4 h-4 mr-1" />
          Video Prompt (Optional)
        </label>
        <textarea
          value={formData.videoPrompt}
          onChange={(e) => setFormData({ ...formData, videoPrompt: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe what the AI presenter should say in the video..."
        />
        <p className="mt-1 text-xs text-gray-500">This will be used to generate a video narration using Synthesia</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isEndScenario"
            checked={formData.isEndScenario}
            onChange={(e) => setFormData({ ...formData, isEndScenario: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isEndScenario" className="ml-2 block text-sm text-gray-700">
            This is an end scenario (shows results summary)
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isVideoRequired"
            checked={formData.isVideoRequired}
            onChange={(e) => setFormData({ ...formData, isVideoRequired: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isVideoRequired" className="ml-2 block text-sm text-gray-700">
            Require videos to be watched (production mode)
          </label>
          <span className="ml-2 text-xs text-gray-500">(Uncheck for testing)</span>
        </div>
      </div>
    </div>
  );

  const toggleAccordion = (index: number) => {
    setOpenAccordions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const renderQuestionsTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">Scenario Context</h4>
        <p className="text-sm text-blue-800"><strong>Title:</strong> {formData.title || 'Not set'}</p>
        <p className="text-sm text-blue-800 mt-1"><strong>Description:</strong> {formData.description || 'Not set'}</p>
      </div>

      <div>
        <VideoInputSelectorWithLibrary
          label="Prompt Video"
          value={promptVideo}
          onChange={setPromptVideo}
          videoType="prompt"
          helpText="Video shown after introduction with scenario details"
          filterByTopic={formData.topicId}
          scenarioName={formData.title}
          scenarioDifficulty={formData.difficulty}
        />
      </div>

      <div className="border-t pt-4">
        <VideoInputSelectorWithLibrary
          label="Transition Video (Optional)"
          value={transitionVideo}
          onChange={setTransitionVideo}
          videoType="transition"
          helpText="Default video shown when transitioning to next scenario (can be overridden per option)"
          filterByTopic={formData.topicId}
          scenarioName={formData.title}
          scenarioDifficulty={formData.difficulty}
        />
      </div>

      <div className="border-t pt-4">
        <ScenarioMetricSelector
          selectedMetricIds={selectedMetricIds}
          onMetricsChange={(ids) => {
            setSelectedMetricIds(ids);
            if (ids.length > 0 && !showAutoMapping) {
              setShowAutoMapping(true);
            }
          }}
        />
      </div>

      {selectedMetricIds.length > 0 && showAutoMapping && (
        <div className="border-t pt-4">
          <AutoMappingPreview
            metricIds={selectedMetricIds}
            existingCompetencyIds={selectedCompetencyIds}
            onAcceptSuggestions={(suggestions) => {
              setAcceptedSuggestions(suggestions);
              setSelectedCompetencyIds(suggestions.map(s => s.competency_id));
              setShowAutoMapping(false);
            }}
            onRejectSuggestions={() => {
              setShowAutoMapping(false);
            }}
            showCompetencySuggestions={true}
            showMappingPreview={false}
          />
        </div>
      )}

      {acceptedSuggestions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2">
            ✓ {acceptedSuggestions.length} Competenc{acceptedSuggestions.length === 1 ? 'y' : 'ies'} Selected
          </h4>
          <div className="space-y-1">
            {acceptedSuggestions.map(s => (
              <div key={s.competency_id} className="text-xs text-green-800">
                • {s.competency_code} - {s.competency_name} ({s.confidence} confidence)
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

      <div className="border-t pt-4">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text *
          </label>
          <input
            type="text"
            value={formData.questionText}
            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="How would you respond?"
          />
          <p className="mt-1 text-xs text-gray-500">
            This question will be displayed to learners before they see the response options.
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Response Options</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure {options.length} option{options.length !== 1 ? 's' : ''} (minimum 2, maximum 4)
            </p>
          </div>
          {options.length < 4 && (
            <button
              onClick={addOption}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option {String.fromCharCode(65 + options.length)}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <OptionAccordion
              key={index}
              option={option}
              index={index}
              isOpen={openAccordions.includes(index)}
              onToggle={() => toggleAccordion(index)}
              onChange={(field, value) => updateOption(index, field, value)}
              onRemove={options.length > 2 ? () => removeOption(index) : undefined}
              canRemove={options.length > 2}
              selectedMetricIds={selectedMetricIds}
              topicId={formData.topicId}
              scenarioTitle={formData.title}
              scenarioDifficulty={formData.difficulty}
            />
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-md p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Tips for Great Questions</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Present a realistic workplace scenario</li>
          <li>Include enough context for informed decision-making</li>
          <li>Make the situation relatable to your learners</li>
          <li>Ensure the question has multiple valid approaches</li>
        </ul>
      </div>
    </div>
  );


  const renderTimerTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Decision Timer Configuration</h3>
          <p className="text-sm text-gray-600 mb-6">
            Configure how decision time is tracked and displayed to learners. This helps analyze decision-making speed and add time pressure when needed.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="timerEnabled"
              checked={formData.timerEnabled}
              onChange={(e) => setFormData({ ...formData, timerEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="timerEnabled" className="ml-2 block text-sm font-medium text-gray-700">
              Enable decision time tracking
            </label>
          </div>

          {formData.timerEnabled && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="timerVisible"
                  checked={formData.timerVisible}
                  onChange={(e) => setFormData({ ...formData, timerVisible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="timerVisible" className="ml-2 block text-sm font-medium text-gray-700">
                  Make timer visible to learners
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timer Type
                </label>
                <select
                  value={formData.timerType}
                  onChange={(e) => setFormData({ ...formData, timerType: e.target.value as 'count_up' | 'countdown' | 'none' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="count_up">Count Up - Shows elapsed time</option>
                  <option value="countdown">Countdown - Creates time pressure</option>
                  <option value="none">None - Track silently without display</option>
                </select>
              </div>

              {formData.timerType === 'countdown' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="600"
                      value={formData.timerLimitSeconds}
                      onChange={(e) => setFormData({ ...formData, timerLimitSeconds: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 30-120 seconds for most scenarios
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warning Threshold (seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={formData.timerWarningThresholdSeconds}
                      onChange={(e) => setFormData({ ...formData, timerWarningThresholdSeconds: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Timer will change color when time remaining reaches this threshold
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Location
                </label>
                <select
                  value={formData.timerDisplayLocation}
                  onChange={(e) => setFormData({ ...formData, timerDisplayLocation: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hidden">Hidden - Track only, don't display</option>
                  <option value="question_page">Question Page - Show during decision</option>
                  <option value="feedback_page">Feedback Page - Show after decision</option>
                  <option value="results_page">Results Page - Show in final summary</option>
                  <option value="all">All Locations - Show everywhere</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTimerInFeedback"
                  checked={formData.showTimerInFeedback}
                  onChange={(e) => setFormData({ ...formData, showTimerInFeedback: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showTimerInFeedback" className="ml-2 block text-sm font-medium text-gray-700">
                  Include decision time insights in feedback
                </label>
              </div>
            </>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Timer Benefits</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Track how long learners take to make decisions</li>
            <li>• Analyze decision-making patterns across cohorts</li>
            <li>• Add time pressure for high-stakes scenarios</li>
            <li>• Provide personalized feedback based on decision speed</li>
            <li>• Decision time is always tracked for analytics, regardless of visibility</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === 'introduction') return renderIntroductionTab();
    if (activeTab === 'questions') return renderQuestionsTab();
    if (activeTab === 'timer') return renderTimerTab();
    return null;
  };

  const goToPreviousTab = () => {
    const tabs = getTabs();
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const goToNextTab = () => {
    const tabs = getTabs();
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const isLastTab = () => {
    const tabs = getTabs();
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    return currentIndex === tabs.length - 1;
  };

  const isFirstTab = () => {
    return activeTab === 'introduction';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Scenario</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in the details across the tabs below</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <TabNavigation
          tabs={getTabs()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="px-6 py-6 overflow-y-auto flex-1">
          {inlineError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{inlineError}</p>
                </div>
                <button
                  onClick={() => setInlineError(null)}
                  className="ml-3 text-red-400 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          {renderActiveTab()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <button
              onClick={isFirstTab() ? onClose : goToPreviousTab}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {isFirstTab() ? 'Cancel' : 'Previous'}
            </button>

            <div className="flex gap-2">
              {!isLastTab() ? (
                <button
                  onClick={goToNextTab}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Scenario'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioCreationModal;
