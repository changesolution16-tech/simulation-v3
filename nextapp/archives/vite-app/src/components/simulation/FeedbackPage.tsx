import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { useSimulationStore } from '../../store';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { supabase } from '../../lib/supabase';
import AlignmentMeetingResults from './AlignmentMeetingResults';
import { useLanguage } from '../../contexts/LanguageContext';
import { getScenarioOptionFeedback } from '../../lib/translationHelpers';
import { SimulationCompletionService } from '../../lib/simulationCompletion';

const FeedbackPage: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { activeSession, currentUser, updateSessionScenarioIndex } = useSimulationStore();
  const { language, t } = useLanguage();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [decisionTimeSeconds, setDecisionTimeSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!simulationId || !currentUser || !activeSession) {
      navigate('/learner');
      return;
    }

    if (activeSession.simulationId !== simulationId) {
      navigate('/learner');
      return;
    }

    if (!activeSession.selectedOptionId) {
      navigate(`/simulation/${simulationId}/scenario/${activeSession.currentScenarioIndex}/question`);
      return;
    }

    loadSimulation();
  }, [simulationId, currentUser, activeSession, navigate]);

  const loadSimulation = async () => {
    if (!simulationId || !activeSession) return;

    setLoading(true);
    try {
      const data = await SimulationService.getSimulation(simulationId);
      if (data) {
        setSimulation(data);
        await loadCompetencyChanges(data);
      } else {
        navigate('/learner');
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
      navigate('/learner');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetencyChanges = async (sim: SimulationWithScenarios) => {
    if (!activeSession || !currentUser) return;

    const currentSimScenario = sim.scenarios?.[activeSession.currentScenarioIndex];
    const currentScenario = currentSimScenario?.scenarios;
    const selectedOption = currentScenario?.options.find(o => o.id === activeSession.selectedOptionId);

    if (!selectedOption) return;

    if (activeSession.instanceId && currentScenario?.id && selectedOption.id) {
      try {
        const { data: responseData } = await supabase
          .from('learner_responses')
          .select('time_to_decision_seconds')
          .eq('instance_id', activeSession.instanceId)
          .eq('scenario_id', currentScenario.id)
          .eq('option_id', selectedOption.id)
          .order('responded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (responseData && responseData.time_to_decision_seconds !== null) {
          setDecisionTimeSeconds(responseData.time_to_decision_seconds);
        }
      } catch (error) {
        console.error('Error loading decision time:', error);
      }
    }
  };

  const handleVideoComplete = () => {
    setVideoWatched(true);
  };

  const handleVideoSkip = () => {
    setVideoWatched(true);
  };

  const handleContinue = () => {
    if (!simulation || !activeSession || !simulationId) return;

    const currentSimScenario = simulation.scenarios?.[activeSession.currentScenarioIndex];
    const currentScenario = currentSimScenario?.scenarios;
    const selectedOption = currentScenario?.options.find(o => o.id === activeSession.selectedOptionId);

    if (selectedOption?.transitionVideoUrl || currentScenario?.transitionVideoUrl) {
      navigate(`/simulation/${simulationId}/scenario/${activeSession.currentScenarioIndex}/transition`);
    } else {
      handleNextScenario();
    }
  };

  const handleNextScenario = async () => {
    if (!simulation || !activeSession || !simulationId) return;

    const currentSimScenario = simulation.scenarios?.[activeSession.currentScenarioIndex];
    const currentScenario = currentSimScenario?.scenarios;
    const selectedOption = currentScenario?.options.find(o => o.id === activeSession.selectedOptionId);

    // Check if this is the end of the simulation
    const isSimulationComplete = currentSimScenario?.is_exit_point || !selectedOption?.nextScenarioId;

    if (isSimulationComplete) {
      // Mark simulation as completed and calculate scores
      if (activeSession.instanceId) {
        console.log('[FeedbackPage] Simulation completed, marking instance as complete:', activeSession.instanceId);

        const result = await SimulationCompletionService.completeSimulation(activeSession.instanceId);

        if (result.success) {
          console.log('[FeedbackPage] Simulation marked as completed with scores:', result.scores);
        } else {
          console.error('[FeedbackPage] Failed to mark simulation as completed:', result.error);
          // Continue anyway - user can see partial results
        }
      } else {
        console.warn('[FeedbackPage] No instance ID available to mark as completed');
      }

      // Navigate to closing page or results
      if (simulation.closing_page_enabled && simulation.closing_page_show_before_results) {
        navigate(`/simulation/${simulationId}/closing`);
      } else {
        navigate(`/simulation/results/${simulationId}`);
      }
      return;
    }

    // Not complete - find next scenario
    const nextScenarioIndex = simulation.scenarios?.findIndex(
      s => s.scenario_id === selectedOption.nextScenarioId
    );

    if (nextScenarioIndex !== undefined && nextScenarioIndex >= 0) {
      updateSessionScenarioIndex(nextScenarioIndex);
      navigate(`/simulation/${simulationId}/scenario/${nextScenarioIndex}/introduction`);
    } else {
      // No next scenario found - treat as completion
      if (activeSession.instanceId) {
        console.log('[FeedbackPage] No next scenario found, marking as complete:', activeSession.instanceId);
        await SimulationCompletionService.completeSimulation(activeSession.instanceId);
      }

      if (simulation.closing_page_enabled && simulation.closing_page_show_before_results) {
        navigate(`/simulation/${simulationId}/closing`);
      } else {
        navigate(`/simulation/results/${simulationId}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.feedback.loadingFeedback')}</p>
        </div>
      </div>
    );
  }

  if (!simulation || !activeSession || !activeSession.selectedOptionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.feedback.feedbackNotAvailable')}</p>
          <button
            onClick={() => navigate('/learner')}
            className="mt-4 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {t('simulation.landing.backToSimulations')}
          </button>
        </div>
      </div>
    );
  }

  const currentSimScenario = simulation.scenarios?.[activeSession.currentScenarioIndex];
  const currentScenario = currentSimScenario?.scenarios;
  const selectedOption = currentScenario?.options.find(o => o.id === activeSession.selectedOptionId);
  const difficulty = simulation.difficulty || 'beginner';

  const getFeedbackText = (option: typeof selectedOption, level: typeof difficulty): string => {
    if (!option) return t('simulation.feedback.feedbackNotAvailable');

    // Try translation helper first
    const translatedFeedback = getScenarioOptionFeedback(option, level, language);
    if (translatedFeedback && translatedFeedback.trim()) {
      // Check for UUID pattern
      const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      if (uuidPattern.test(translatedFeedback)) {
        console.error(`WARNING: Feedback contains UUID pattern for ${level}:`, translatedFeedback);
        return t('errors.generic');
      }
      return translatedFeedback;
    }

    // Fallback to old logic for backward compatibility
    if (!option.feedback) return t('simulation.feedback.feedbackNotAvailable');

    if (typeof option.feedback === 'string') {
      console.error('Feedback is a string instead of an object:', option.feedback);
      return t('errors.generic');
    }

    if (typeof option.feedback !== 'object') {
      console.error('Feedback is not an object:', typeof option.feedback);
      return t('simulation.feedback.feedbackNotAvailable');
    }

    const feedbackText = option.feedback[level];

    if (typeof feedbackText !== 'string') {
      console.error(`Feedback for level ${level} is not a string:`, feedbackText);
      return option.feedback.beginner || t('simulation.feedback.feedbackNotAvailable');
    }

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidPattern.test(feedbackText)) {
      console.error(`WARNING: Feedback contains UUID pattern for ${level}:`, feedbackText);
      return t('errors.generic');
    }

    return feedbackText;
  };

  if (!currentScenario || !selectedOption) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.introduction.scenarioDataNotAvailable')}</p>
          <button
            onClick={() => navigate('/learner')}
            className="mt-4 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {t('simulation.landing.backToSimulations')}
          </button>
        </div>
      </div>
    );
  }

  const hasFeedbackVideo = selectedOption.feedbackVideos?.[difficulty];
  const canContinue = !hasFeedbackVideo || videoWatched;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/learner')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>{t('simulation.introduction.exitSimulation')}</span>
            </button>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span>
                {t('simulation.feedback.levelOf', { current: (currentScenario?.hierarchyLevel ?? 0) + 1, total: (simulation.max_level ?? 0) + 1 })}
              </span>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-green-600 text-white">
                  ✓
                </div>
                <span>{t('simulation.feedback.stepIntroduction')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-green-600 text-white">
                  ✓
                </div>
                <span>{t('simulation.feedback.stepDecision')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-blue-600 text-white">
                  3
                </div>
                <span>{t('simulation.feedback.stepFeedback')}</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {hasFeedbackVideo ? (
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">{t('simulation.feedback.feedback')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {getFeedbackText(selectedOption, difficulty)}
                </p>
              </div>
            )}

            {currentScenario &&
             (currentScenario.title === 'The Alignment Meeting' ||
              currentScenario.title === 'Level 1: The Alignment Meeting') &&
             selectedOption && (
              <div className="mb-6">
                <AlignmentMeetingResults
                  scenarioId={currentScenario.id}
                  optionId={selectedOption.id}
                  learnerId={currentUser?.id}
                  simulationInstanceId={activeSession?.instanceId || undefined}
                />
              </div>
            )}

            {currentScenario && currentScenario.showTimerInFeedback && decisionTimeSeconds !== null &&
             (currentScenario.timerDisplayLocation === 'feedback_page' || currentScenario.timerDisplayLocation === 'all') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('simulation.feedback.decisionTime')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {Math.floor(decisionTimeSeconds / 60)}:{(decisionTimeSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('common.minutes')}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {decisionTimeSeconds < 30 ? (
                      t('simulation.feedback.decisionTimeFast')
                    ) : decisionTimeSeconds < 90 ? (
                      t('simulation.feedback.decisionTimeModerate')
                    ) : (
                      t('simulation.feedback.decisionTimeSlow')
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {canContinue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center"
                >
                  {t('common.continue')} <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
