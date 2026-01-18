import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useSimulationStore } from '../../store';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import { supabase } from '../../lib/supabase';
import { CompetencyService } from '../../lib/competencies';
import { MetricScoreService } from '../../lib/metricScores';
import { BravinMetricsIntegration } from '../../lib/bravinMetricsIntegration';
import { DecisionTimer, getElapsedSeconds } from './DecisionTimer';
import { useLanguage } from '../../contexts/LanguageContext';
import { getScenarioQuestionText, getScenarioOptionText } from '../../lib/translationHelpers';
import { SessionPersistenceService } from '../../lib/sessionPersistence';
import { SessionKeepaliveManager } from '../../lib/sessionKeepalive';

const QuestionPage: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const {
    activeSession,
    currentUser,
    updateSessionSelectedOption,
    addSessionDecision,
    updateSessionCompetencyScores
  } = useSimulationStore();
  const { language, t } = useLanguage();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      // First check if we have an active Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && !currentUser) {
        // Only redirect if we truly have no session
        console.warn('No active session found, redirecting to login');
        navigate('/login', { state: { message: 'Your session expired. Please log in again.' } });
        return;
      }

      if (!simulationId || !activeSession) {
        navigate('/learner');
        return;
      }

      if (activeSession.simulationId !== simulationId) {
        navigate('/learner');
        return;
      }

      questionStartTime.current = Date.now();
      loadSimulation();
    };

    checkSessionAndLoad();
  }, [simulationId, currentUser, activeSession, navigate]);

  const loadSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const data = await SimulationService.getSimulation(simulationId);
      if (data) {
        setSimulation(data);
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

  const handleOptionSelect = async (optionId: string) => {
    console.log('[QuestionPage] Option selected:', optionId);

    // CRITICAL: Ensure valid session before saving (with automatic refresh if needed)
    console.log('[QuestionPage] Validating session...');
    const sessionValid = await SessionKeepaliveManager.ensureValidSession();
    console.log('[QuestionPage] Session validation result:', sessionValid);

    if (!sessionValid) {
      console.error('[QuestionPage] Unable to establish valid session');
      alert('Your session has expired. Please log in again. Your response will not be saved.');
      navigate('/login', { state: { message: 'Your session expired. Please log in again.' } });
      return;
    }

    console.log('[QuestionPage] Session valid, proceeding with save...');

    if (!simulation || !activeSession || !currentUser) {
      console.warn('Missing required data for option selection');
      return;
    }

    const currentSimScenario = simulation.scenarios?.[activeSession.currentScenarioIndex];
    const currentScenario = currentSimScenario?.scenarios;

    if (!currentScenario) return;

    const option = currentScenario.options.find(o => o.id === optionId);
    if (!option) return;

    const decisionTimeSeconds = getElapsedSeconds(questionStartTime.current);
    // Pass the current decision count - SQL function will cap at max_stage
    const currentStage = activeSession.decisionHistory.length + 1;

    // Update local state immediately for UI responsiveness
    updateSessionSelectedOption(optionId);
    addSessionDecision(currentScenario.id, optionId);

    // CRITICAL: Save to database IMMEDIATELY - this is the primary source of truth
    if (activeSession.instanceId) {
      try {
        const responseData = {
          instance_id: activeSession.instanceId,
          scenario_id: currentScenario.id,
          option_id: optionId,
          response_order: activeSession.decisionHistory.length + 1,
          time_to_decision_seconds: decisionTimeSeconds,
          viewed_videos: false,
          video_watch_time_seconds: 0,
          responded_at: new Date().toISOString()
        };

        console.log('[QuestionPage] Saving response to database...', responseData);

        // Step 1: Record the learner response (this triggers automatic metric updates via database trigger)
        const { error: responseError } = await supabase
          .from('learner_responses')
          .insert(responseData);

        if (responseError) {
          console.error('[QuestionPage] CRITICAL: Failed to save learner response:', responseError);
          console.error('[QuestionPage] Error details:', {
            code: responseError.code,
            message: responseError.message,
            details: responseError.details,
            hint: responseError.hint
          });

          // Check if it's an auth-related error
          if (responseError.code === 'PGRST301' || responseError.message?.includes('JWT') || responseError.message?.includes('permission')) {
            // Try one more time with fresh session
            const { data: { session: newSession }, error: refreshErr } = await supabase.auth.refreshSession();
            if (newSession) {
              console.log('[QuestionPage] Retrying save with refreshed session...');
              const { error: retryError } = await supabase
                .from('learner_responses')
                .insert({
                  instance_id: activeSession.instanceId,
                  scenario_id: currentScenario.id,
                  option_id: optionId,
                  response_order: activeSession.decisionHistory.length + 1,
                  time_to_decision_seconds: decisionTimeSeconds,
                  viewed_videos: false,
                  video_watch_time_seconds: 0,
                  responded_at: new Date().toISOString()
                });

              if (retryError) {
                console.error('[QuestionPage] Retry also failed:', retryError);
                throw retryError;
              }
              console.log('[QuestionPage] ✓ Retry successful - response saved');
            } else {
              throw responseError;
            }
          } else {
            throw responseError;
          }
        }

        console.log('[QuestionPage] ✓ Saved learner response with decision time:', decisionTimeSeconds, 'seconds');

        // Step 2: Update current position for resume functionality
        const { error: progressError } = await supabase.rpc('update_simulation_progress', {
          p_instance_id: activeSession.instanceId,
          p_current_scenario_id: currentScenario.id,
          p_current_stage: currentStage
        });

        if (progressError) {
          console.error('[QuestionPage] Warning: Failed to update progress:', progressError);
          // Non-critical - continue anyway
        } else {
          console.log('[QuestionPage] ✓ Updated simulation progress to stage:', currentStage);
        }
      } catch (error: any) {
        console.error('[QuestionPage] CRITICAL ERROR saving decision:', error);
        console.error('[QuestionPage] Full error object:', JSON.stringify(error, null, 2));

        // Provide specific error message based on error type
        let errorMessage = 'Warning: Your response may not have been saved.';

        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          errorMessage += ' Please check your internet connection.';
        } else if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          errorMessage += ' Authentication issue detected. Please try refreshing the page.';
        } else if (error.code === '23505') {
          // Duplicate key - response already saved
          console.log('[QuestionPage] Response appears to already be saved (duplicate key)');
          return; // Don't show error, continue silently
        } else if (error.details || error.hint) {
          errorMessage += ` Error: ${error.message || 'Unknown database error'}`;
        }

        alert(errorMessage);
        // Don't return - let user continue to feedback even if save failed
        // The response might have been saved despite the error
      }
    } else {
      console.error('[QuestionPage] CRITICAL: No instance ID available - cannot save response!');
    }

    // Step 3: Update competency scores in real-time
    const updatedScores = { ...activeSession.competencyScores };
    if (option.skillImpact) {
      Object.entries(option.skillImpact).forEach(([skill, impact]) => {
        updatedScores[skill] = (updatedScores[skill] || 0) + impact;
      });
    }

    // Step 4: Process competency impacts (saved to database immediately)
    if (option.competency_impacts && activeSession.instanceId) {
      try {
        const impacts = typeof option.competency_impacts === 'string'
          ? JSON.parse(option.competency_impacts)
          : option.competency_impacts;

        const competencyUpdates = Object.entries(impacts).map(([competencyId, impactData]) => {
          const impactValue = typeof impactData === 'object' && impactData !== null && 'impact' in impactData
            ? (impactData as any).impact
            : typeof impactData === 'number' ? impactData : 0;

          return CompetencyService.updateLearnerCompetency(
            currentUser.id,
            competencyId,
            impactValue
          );
        });

        await Promise.all(competencyUpdates);
        console.log('[QuestionPage] ✓ Updated competency scores');
      } catch (error) {
        console.error('[QuestionPage] Error updating competencies:', error);
      }
    }

    updateSessionCompetencyScores(updatedScores);

    // Step 5: Record metric assessments (critical for scoring)
    if (activeSession.instanceId && currentScenario.id) {
      try {
        // Record standard metric assessments
        await MetricScoreService.recordMetricAssessments(
          currentUser.id,
          activeSession.instanceId,
          currentScenario.id,
          optionId
        );
        console.log('[QuestionPage] ✓ Recorded metric assessments');

        // Record Bravin metrics
        await BravinMetricsIntegration.recordBravinMetricAssessments({
          learnerId: currentUser.id,
          scenarioId: currentScenario.id,
          optionId: optionId,
          simulationInstanceId: activeSession.instanceId
        });
        console.log('[QuestionPage] ✓ Recorded Bravin metrics');

        // Step 6: Save complete session state for recovery
        const savedSuccessfully = await SessionPersistenceService.saveSessionState(activeSession);
        if (savedSuccessfully) {
          console.log('[QuestionPage] ✓ Saved complete session state to database');
        } else {
          console.warn('[QuestionPage] Warning: Session state save returned false');
        }
      } catch (error) {
        console.error('[QuestionPage] CRITICAL ERROR recording assessments:', error);
        // Continue to feedback page even if metrics fail - user can retry from results
      }
    } else {
      console.error('[QuestionPage] Cannot record metrics: missing instanceId or scenario id');
    }

    navigate(`/simulation/${simulationId}/scenario/${activeSession.currentScenarioIndex}/feedback`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.question.loadingQuestion')}</p>
        </div>
      </div>
    );
  }

  if (!simulation || !activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.question.questionNotFound')}</p>
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

  if (!currentScenario) {
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

  const shouldShowTimer = currentScenario?.timerEnabled &&
                          currentScenario?.timerVisible &&
                          (currentScenario?.timerDisplayLocation === 'question_page' ||
                           currentScenario?.timerDisplayLocation === 'all');

  console.log('[QuestionPage Timer Debug]', {
    scenarioId: currentScenario?.id,
    scenarioTitle: currentScenario?.title,
    timerEnabled: currentScenario?.timerEnabled,
    timerVisible: currentScenario?.timerVisible,
    timerDisplayLocation: currentScenario?.timerDisplayLocation,
    timerType: currentScenario?.timerType,
    shouldShowTimer,
    message: shouldShowTimer ? 'Timer WILL display' : 'Timer will NOT display'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/learner')}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>{t('simulation.introduction.exitSimulation')}</span>
            </button>

            <div className="flex items-center gap-4">
              {shouldShowTimer && (
                <DecisionTimer
                  startTime={questionStartTime.current}
                  timerType={currentScenario.timerType || 'count_up'}
                  timerLimitSeconds={currentScenario.timerLimitSeconds}
                  timerWarningThresholdSeconds={currentScenario.timerWarningThresholdSeconds}
                  visible={true}
                  compact={true}
                />
              )}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span>
                  {t('simulation.question.levelOf', { current: (currentScenario?.hierarchyLevel ?? 0) + 1, total: (simulation.max_level ?? 0) + 1 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-green-600 dark:bg-green-500 text-white">
                  ✓
                </div>
                <span>{t('simulation.question.stepIntroduction')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-blue-600 dark:bg-blue-500 text-white">
                  2
                </div>
                <span>{t('simulation.question.stepDecision')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-300 dark:bg-gray-600 text-white">
                  3
                </div>
                <span>{t('simulation.question.stepFeedback')}</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                {(() => {
                  const questionText = getScenarioQuestionText(currentScenario, language);
                  console.log('[QuestionPage] Question text:', questionText, 'Language:', language, 'Scenario:', currentScenario?.id);
                  console.log('[QuestionPage] Scenario question fields:', {
                    question_text: currentScenario?.question_text,
                    question_text_en: currentScenario?.question_text_en,
                    question_text_es: currentScenario?.question_text_es
                  });
                  return questionText || t('simulation.question.selectOption');
                })()}
              </h3>

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
                      className="w-full text-left p-5 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center font-semibold text-sm">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="ml-4">
                          <p className="text-gray-800 dark:text-gray-100 dark:text-gray-200">{getScenarioOptionText(option, language)}</p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;
