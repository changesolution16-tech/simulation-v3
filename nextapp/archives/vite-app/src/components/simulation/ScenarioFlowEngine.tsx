import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, ChevronRight, MessageSquare, Clock, User, Check } from 'lucide-react';
import { Scenario, SimulationWithScenarios } from '../../types';
import { useSimulationStore } from '../../store';
import { CompetencyService } from '../../lib/competencies';
import { CompetencyCalculationService, MetricScores } from '../../lib/competencyCalculation';
import { AnalyticsService } from '../../lib/analytics';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { supabase } from '../../lib/supabase';

interface ScenarioFlowEngineProps {
  simulation: SimulationWithScenarios;
  onComplete: () => void;
}

type FlowPhase = 'INTRODUCTION' | 'PROMPT' | 'DECISION' | 'FEEDBACK' | 'TRANSITION';

const ScenarioFlowEngine: React.FC<ScenarioFlowEngineProps> = ({ simulation, onComplete }) => {
  const navigate = useNavigate();
  const { currentUser } = useSimulationStore();

  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<FlowPhase>('INTRODUCTION');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<Array<{
    scenarioId: string;
    optionId: string;
    timestamp: number;
  }>>([]);
  const [competencyScores, setCompetencyScores] = useState<Record<string, number>>({});
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [previousHierarchyLevel, setPreviousHierarchyLevel] = useState<number | null>(null);

  const currentSimScenario = simulation.scenarios?.[currentScenarioIndex];
  const currentScenario = currentSimScenario?.scenarios as Scenario;

  const getFeedbackText = (option: any, level: string): string => {
    if (!option || !option.feedback) return 'Feedback not available';

    if (typeof option.feedback === 'string') {
      console.error('Feedback is a string instead of an object:', option.feedback);
      return 'Feedback formatting error. Please contact administrator.';
    }

    if (typeof option.feedback !== 'object') {
      console.error('Feedback is not an object:', typeof option.feedback);
      return 'Feedback not available';
    }

    const feedbackText = option.feedback[level];

    if (typeof feedbackText !== 'string') {
      console.error(`Feedback for level ${level} is not a string:`, feedbackText);
      return option.feedback.beginner || 'Feedback not available';
    }

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidPattern.test(feedbackText)) {
      console.error(`WARNING: Feedback contains UUID pattern for ${level}:`, feedbackText);
      return 'Feedback data error detected. Please edit this scenario to fix the feedback text.';
    }

    return feedbackText;
  };

  useEffect(() => {
    console.log('=== ScenarioFlowEngine Initialization ===');
    console.log('Simulation ID:', simulation.id);
    console.log('Simulation name:', simulation.display_name);
    console.log('Total scenarios in array:', simulation.scenarios?.length);
    console.log('Current scenario index:', currentScenarioIndex);

    if (simulation.scenarios && simulation.scenarios.length > 0) {
      console.log('Scenarios list:', simulation.scenarios.map((s, i) => ({
        index: i,
        id: s.scenario_id,
        title: s.scenarios?.title,
        isEntry: s.is_entry_point,
        isExit: s.is_exit_point,
        sequence: s.sequence_order
      })));

      const entryPoint = simulation.scenarios.find(s => s.is_entry_point);
      console.log('Entry point scenario:', entryPoint ? {
        id: entryPoint.scenario_id,
        title: entryPoint.scenarios?.title,
        index: simulation.scenarios.indexOf(entryPoint)
      } : 'NOT FOUND');
    }

    console.log('Current SimScenario object:', currentSimScenario);
    console.log('Current Scenario (nested):', currentScenario);
    console.log('Video URLs in current scenario:', {
      introduction: currentScenario?.introductionVideoUrl,
      prompt: currentScenario?.promptVideoUrl,
      transition: currentScenario?.transitionVideoUrl
    });
    console.log('Has options?:', currentScenario?.options?.length);
    if (currentScenario?.options && currentScenario.options.length > 0) {
      console.log('First option feedback videos:', currentScenario.options[0].feedbackVideos);
    }
    console.log('=== End Debug ===');
  }, [simulation, currentScenarioIndex, currentSimScenario, currentScenario]);

  if (!simulation.scenarios || simulation.scenarios.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/learner')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Simulations</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Scenarios Available</h2>
          <p className="text-gray-600 mb-6">
            This simulation doesn't have any scenarios configured yet. An administrator needs to add scenarios to this simulation before it can be played.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">For Administrators:</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Go to Admin Dashboard</li>
              <li>Select Simulations</li>
              <li>Click Edit on "{simulation.display_name}"</li>
              <li>Go to the "Scenario Flow" tab</li>
              <li>Add scenarios to this simulation</li>
              <li>Mark one scenario as the entry point</li>
              <li>Connect scenarios with options</li>
              <li>Save and publish the simulation</li>
            </ol>
          </div>
          <button
            onClick={() => navigate('/learner')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!currentUser || !simulation) return;

    const initializeInstance = async () => {
      try {
        let maxStage = simulation.max_level ?? 0;

        if (!maxStage && simulation.scenarios && simulation.scenarios.length > 0) {
          const stages = simulation.scenarios
            .map(s => s.scenarios?.hierarchyLevel)
            .filter(s => s !== null && s !== undefined) as number[];

          if (stages.length > 0) {
            maxStage = Math.max(...stages);
          }
        }

        const { data, error } = await supabase
          .from('simulation_instances')
          .insert({
            learner_id: currentUser.id,
            simulation_id: simulation.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            max_stage: maxStage,
            stages_completed: 0,
            decision_count: 0
          })
          .select()
          .single();

        if (!error && data) {
          setInstanceId(data.id);
          console.log(`[ScenarioFlowEngine] Instance created with max_stage: ${maxStage}`);
        }
      } catch (error) {
        console.error('Error creating simulation instance:', error);
      }
    };

    initializeInstance();
  }, [currentUser, simulation]);

  useEffect(() => {
    setPhase('INTRODUCTION');
    setSelectedOptionId(null);
    setVideoWatched(false);

    if (instanceId && currentScenario) {
      const currentStage = currentScenario.hierarchyLevel ?? 0;

      if (previousHierarchyLevel === null) {
        AnalyticsService.updateStageProgress(instanceId, currentStage);
        console.log(`[ScenarioFlowEngine] Initial stage set: ${currentStage}`);
        setPreviousHierarchyLevel(currentStage);
      } else if (currentStage > previousHierarchyLevel) {
        AnalyticsService.updateStageProgress(instanceId, currentStage);
        console.log(`[ScenarioFlowEngine] Stage transition: ${previousHierarchyLevel} → ${currentStage}`);
        setPreviousHierarchyLevel(currentStage);
      }
    }
  }, [currentScenarioIndex, instanceId, currentScenario]);

  const handleVideoComplete = () => {
    setVideoWatched(true);
  };

  const handleVideoSkip = () => {
    setVideoWatched(true);
  };

  const handleStartScenario = () => {
    if (currentScenario?.promptVideoUrl) {
      setPhase('PROMPT');
    } else {
      setPhase('DECISION');
    }
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const handleSubmitDecision = async () => {
    if (!selectedOptionId || !currentScenario || !currentUser) return;

    const option = currentScenario.options.find(o => o.id === selectedOptionId);
    if (!option) return;

    const historyEntry = {
      scenarioId: currentScenario.id,
      optionId: selectedOptionId,
      timestamp: Date.now()
    };
    setDecisionHistory([...decisionHistory, historyEntry]);

    if (instanceId) {
      try {
        await supabase
          .from('learner_attempts')
          .insert({
            learner_id: currentUser.id,
            instance_id: instanceId,
            scenario_id: currentScenario.id,
            option_id: selectedOptionId,
            decision_timestamp: new Date().toISOString()
          });

        const { data: metricScores, error: metricsError } = await supabase
          .from('scenario_option_metrics')
          .select(`
            metric_id,
            score_value,
            metric:assessment_metrics(metric_type)
          `)
          .eq('scenario_id', currentScenario.id)
          .eq('option_id', selectedOptionId);

        if (!metricsError && metricScores && metricScores.length > 0) {
          const scores: MetricScores = {};

          metricScores.forEach((ms: any) => {
            const metricType = ms.metric?.metric_type;
            if (metricType) {
              switch (metricType) {
                case 'bravin_alignment':
                  scores.bravin_alignment = ms.score_value;
                  break;
                case 'trust_impact':
                  scores.trust_impact = ms.score_value;
                  break;
                case 'emotional_intelligence_index':
                  scores.emotional_intelligence_index = ms.score_value;
                  break;
                case 'ethical_decision_quality':
                  scores.ethical_decision_quality = ms.score_value;
                  break;
              }
            }
          });

          await CompetencyCalculationService.recordAssessment(
            currentUser.id,
            instanceId,
            currentScenario.id,
            selectedOptionId,
            simulation.id,
            scores
          );

          console.log('[ScenarioFlowEngine] Competency scores calculated and recorded', scores);
        }
      } catch (error) {
        console.error('Error saving decision:', error);
      }
    }

    const updatedScores = { ...competencyScores };
    if (option.skillImpact) {
      Object.entries(option.skillImpact).forEach(([skill, impact]) => {
        updatedScores[skill] = (updatedScores[skill] || 0) + impact;
      });
    }

    if (option.competency_impacts) {
      const impacts = typeof option.competency_impacts === 'string'
        ? JSON.parse(option.competency_impacts)
        : option.competency_impacts;

      Object.entries(impacts).forEach(async ([competencyId, impact]) => {
        await CompetencyService.updateLearnerCompetency(
          currentUser.id,
          competencyId,
          impact as number
        );
      });
    }

    setCompetencyScores(updatedScores);
    setPhase('FEEDBACK');
    setVideoWatched(false);
  };

  const handleContinueFromFeedback = () => {
    const selectedOption = currentScenario?.options.find(o => o.id === selectedOptionId);

    if (!selectedOption) {
      console.error('[ScenarioFlowEngine] Selected option not found in handleContinueFromFeedback');
      handleComplete();
      return;
    }

    if (selectedOption.transitionVideoUrl || currentScenario?.transitionVideoUrl) {
      setPhase('TRANSITION');
      setVideoWatched(false);
    } else if (currentScenario?.isEndScenario || !selectedOption.nextScenarioId) {
      console.log('[ScenarioFlowEngine] End of simulation reached after feedback');
      handleComplete();
    } else {
      handleNextScenario();
    }
  };

  const handleNextScenario = () => {
    if (!selectedOptionId || !currentScenario) return;

    const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);

    if (!selectedOption) {
      console.error('[ScenarioFlowEngine] Selected option not found:', selectedOptionId);
      console.error('[ScenarioFlowEngine] Available options:', currentScenario.options.map(o => o.id));
      handleComplete();
      return;
    }

    console.log('[ScenarioFlowEngine] handleNextScenario called:', {
      currentScenario: currentScenario.title,
      currentScenarioId: currentScenario.id,
      isEndScenario: currentScenario.isEndScenario,
      selectedOption: selectedOption.text,
      selectedOptionId: selectedOption.id,
      nextScenarioId: selectedOption.nextScenarioId
    });

    if (currentScenario.isEndScenario) {
      console.log('[ScenarioFlowEngine] End scenario reached, completing simulation');
      handleComplete();
      return;
    }

    if (!selectedOption.nextScenarioId) {
      console.warn('[ScenarioFlowEngine] WARNING: No next scenario ID configured for this option!');
      console.warn('[ScenarioFlowEngine] Current scenario:', currentScenario.title);
      console.warn('[ScenarioFlowEngine] Selected option:', selectedOption.text);
      console.warn('[ScenarioFlowEngine] This scenario needs to be connected in the Flow Builder.');
      console.warn('[ScenarioFlowEngine] Completing simulation as there is nowhere to go.');
      handleComplete();
      return;
    }

    console.log('[ScenarioFlowEngine] Looking for next scenario with ID:', selectedOption.nextScenarioId);
    console.log('[ScenarioFlowEngine] Available scenarios in simulation:', simulation.scenarios.map(s => ({
      id: s.scenario_id,
      title: s.scenarios?.title
    })));

    const nextScenarioIndex = simulation.scenarios.findIndex(
      s => s.scenario_id === selectedOption.nextScenarioId
    );

    if (nextScenarioIndex >= 0) {
      const nextScenario = simulation.scenarios[nextScenarioIndex];
      console.log('[ScenarioFlowEngine] ✓ Found next scenario at index', nextScenarioIndex);
      console.log('[ScenarioFlowEngine] Next scenario details:', {
        id: nextScenario.scenario_id,
        title: nextScenario.scenarios?.title,
        hasOptions: nextScenario.scenarios?.options?.length || 0
      });
      setCurrentScenarioIndex(nextScenarioIndex);
      setPhase('INTRODUCTION');
      setVideoWatched(false);
      setSelectedOptionId(null);
    } else {
      console.error('[ScenarioFlowEngine] ✗ Next scenario NOT found in simulation!');
      console.error('[ScenarioFlowEngine] Looking for scenario_id:', selectedOption.nextScenarioId);
      console.error('[ScenarioFlowEngine] This scenario exists but is not added to this simulation.');
      console.error('[ScenarioFlowEngine] Admin needs to add this scenario to the simulation in the Flow Builder.');
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (instanceId) {
      try {
        console.log('[ScenarioFlowEngine] Starting completion process for instance:', instanceId);

        // Step 1: Validate all metrics are correct before marking complete
        try {
          const { data: validationResult, error: validationError } = await supabase
            .rpc('validate_and_fix_instance_metrics', {
              p_instance_id: instanceId
            });

          if (!validationError && validationResult) {
            console.log('[ScenarioFlowEngine] Validation result:', validationResult);
          }
        } catch (validationError) {
          console.warn('[ScenarioFlowEngine] Validation function not available, skipping:', validationError);
        }

        // Step 2: Calculate stages completed based on decision history
        const allStages = [
          ...decisionHistory.map(decision => {
            const scenario = simulation.scenarios.find(s => s.scenario_id === decision.scenarioId);
            return scenario?.scenarios?.hierarchyLevel ?? 0;
          }),
          currentScenario?.hierarchyLevel ?? 0
        ];

        const uniqueStages = new Set(allStages);
        const stagesCompleted = uniqueStages.size > 0 ? Math.max(...Array.from(uniqueStages)) : 0;

        console.log('[ScenarioFlowEngine] Completion metrics:', {
          instanceId,
          decisionCount: decisionHistory.length,
          stagesVisited: Array.from(uniqueStages).sort(),
          maxStageReached: stagesCompleted,
          simulationMaxStage: simulation.max_level
        });

        // Step 3: Mark as completed (do NOT update decision_count or stages_completed here
        // as they should already be correct from real-time updates)
        const { data, error } = await supabase
          .from('simulation_instances')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            competency_scores: competencyScores
          })
          .eq('id', instanceId)
          .eq('status', 'in_progress') // Only update if still in progress
          .select();

        if (error) {
          console.error('[ScenarioFlowEngine] CRITICAL: Error marking as completed:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn('[ScenarioFlowEngine] No rows updated - simulation may already be completed');
        } else {
          console.log('[ScenarioFlowEngine] ✓ Completion saved successfully');
          console.log('[ScenarioFlowEngine] Final state:', data[0]);
        }
      } catch (error) {
        console.error('[ScenarioFlowEngine] CRITICAL ERROR completing simulation:', error);
        // Continue to completion page even if save fails - data should be in database from real-time updates
      }
    } else {
      console.error('[ScenarioFlowEngine] CRITICAL: No instanceId available for completion');
    }

    onComplete();
  };

  if (!currentScenario) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/learner')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Simulations</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Scenario Not Found</h2>
          <p className="text-gray-600 mb-6">
            The current scenario could not be loaded. This might happen if the scenario was deleted or the simulation flow is not properly configured.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-md mx-auto mb-6">
            <h3 className="font-semibold text-amber-900 mb-2">What happened:</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Current scenario index: {currentScenarioIndex + 1}</li>
              <li>Total scenarios in simulation: {simulation.scenarios?.length || 0}</li>
              <li>Simulation ID: {simulation.id}</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/learner')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    );
  }

  const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);
  const difficulty = simulation.difficulty || 'beginner';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/learner')}
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Exit Simulation</span>
        </button>

        <div className="mx-3 text-gray-400 dark:text-gray-500">/</div>

        <div className="flex items-center">
          <span className="text-gray-800 dark:text-gray-100">{simulation.display_name}</span>
          <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
          <span className="text-sm text-gray-600">
            Level {(currentScenario?.hierarchyLevel ?? 0) + 1} of {(simulation.max_level ?? 0) + 1}
          </span>
        </div>
      </div>

      <div className="mb-6 bg-white border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 border-b border-blue-200">
          <h3 className="text-sm font-semibold text-gray-700">Scenario Progress</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-2 ${phase === 'INTRODUCTION' ? 'text-blue-600 font-semibold' : 'text-green-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${phase === 'INTRODUCTION' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-green-600 text-white'}`}>
                {phase === 'INTRODUCTION' ? '1' : <Check className="w-4 h-4" />}
              </div>
              <span className="whitespace-nowrap">Introduction</span>
            </div>
            <div className={`flex-1 h-1 rounded ${phase === 'INTRODUCTION' ? 'bg-gray-200' : 'bg-green-600'}`}></div>
            <div className={`flex items-center gap-2 ${phase === 'PROMPT' || phase === 'DECISION' ? 'text-blue-600 font-semibold' : phase === 'FEEDBACK' || phase === 'TRANSITION' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${phase === 'PROMPT' || phase === 'DECISION' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : phase === 'FEEDBACK' || phase === 'TRANSITION' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {phase === 'PROMPT' || phase === 'DECISION' ? '2' : (phase === 'FEEDBACK' || phase === 'TRANSITION') ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="whitespace-nowrap">Question</span>
            </div>
            <div className={`flex-1 h-1 rounded ${phase === 'INTRODUCTION' || phase === 'PROMPT' || phase === 'DECISION' ? 'bg-gray-200' : 'bg-green-600'}`}></div>
            <div className={`flex items-center gap-2 ${phase === 'FEEDBACK' ? 'text-blue-600 font-semibold' : phase === 'TRANSITION' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${phase === 'FEEDBACK' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : phase === 'TRANSITION' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {phase === 'FEEDBACK' ? '3' : phase === 'TRANSITION' ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <span className="whitespace-nowrap">Feedback</span>
            </div>
            {(selectedOption?.transitionVideoUrl || currentScenario?.transitionVideoUrl) && (
              <>
                <div className={`flex-1 h-1 rounded ${phase === 'TRANSITION' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center gap-2 ${phase === 'TRANSITION' ? 'text-blue-600 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${phase === 'TRANSITION' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-200 text-gray-500'}`}>
                    4
                  </div>
                  <span className="whitespace-nowrap">Transition</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Level {(currentScenario?.hierarchyLevel ?? 0) + 1} of {(simulation.max_level ?? 0) + 1}</span>
            <span className="capitalize">{phase.toLowerCase().replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'INTRODUCTION' && (
          <motion.div
            key="introduction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-7 h-7 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-3">{currentScenario.title}</h2>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{currentScenario.description}</p>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <User className="w-4 h-4 mr-1" />
                  <span>Scenario {currentScenarioIndex + 1}</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4 mr-1" />
                  <span>2-5 minutes</span>
                </div>
              </div>
            </div>

            {currentScenario.introductionVideoUrl && (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={currentScenario.introductionVideoUrl}
                  videoType="introduction"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  autoPlay={true}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            )}

            {(videoWatched || !currentScenario.introductionVideoUrl) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleStartScenario}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium flex items-center text-lg"
                >
                  <PlayCircle className="w-6 h-6 mr-2" />
                  Start Scenario
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'PROMPT' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {currentScenario.promptVideoUrl && (
              <div className="mb-8">
                <SynthesiaPlayer
                  videoUrl={currentScenario.promptVideoUrl}
                  videoType="prompt"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  autoPlay={true}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            )}

            {videoWatched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => setPhase('DECISION')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  Continue to Decision <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'DECISION' && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">How would you respond?</h3>

            <div className="space-y-4">
              {currentScenario.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <button
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left p-5 rounded-lg border ${
                      selectedOptionId === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 dark:border-gray-700 bg-white hover:border-blue-200 hover:bg-blue-50'
                    } transition-colors`}
                  >
                    <div className="flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        selectedOptionId === option.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      } flex items-center justify-center font-semibold text-sm`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-800 dark:text-gray-100">{option.text}</p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {selectedOptionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <button
                  onClick={handleSubmitDecision}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  Submit Response <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'FEEDBACK' && selectedOption && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {selectedOption.feedbackVideos?.[difficulty] ? (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={selectedOption.feedbackVideos[difficulty]!}
                  videoType="feedback"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  autoPlay={true}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Feedback</h3>
                <p className="text-blue-700">
                  {getFeedbackText(selectedOption, difficulty)}
                </p>
              </div>
            )}

            {(videoWatched || !selectedOption.feedbackVideos?.[difficulty]) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                {(currentScenario.isEndScenario || !selectedOption.nextScenarioId) &&
                 !selectedOption.transitionVideoUrl && !currentScenario.transitionVideoUrl ? (
                  <button
                    onClick={handleComplete}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium flex items-center"
                  >
                    View Results <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleContinueFromFeedback}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    Continue <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'TRANSITION' && selectedOption && (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {(selectedOption.transitionVideoUrl || currentScenario.transitionVideoUrl) && (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={selectedOption.transitionVideoUrl || currentScenario.transitionVideoUrl!}
                  videoType="transition"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  autoPlay={true}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            )}

            {videoWatched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                {currentScenario.isEndScenario || !selectedOption.nextScenarioId ? (
                  <button
                    onClick={handleComplete}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium flex items-center"
                  >
                    View Results <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleNextScenario}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    Continue to Next Scenario <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScenarioFlowEngine;
