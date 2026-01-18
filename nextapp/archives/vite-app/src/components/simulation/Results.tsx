import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSimulationStore } from '../../store';
import { BarChart3, ArrowLeft, Award, BookOpen, GraduationCap } from 'lucide-react';
import CompetencyResults from './CompetencyResults';
import BravinResults from './BravinResults';
import MetricsSummary from './MetricsSummary';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { SimulationCompletionService } from '../../lib/simulationCompletion';
import { SessionKeepaliveManager } from '../../lib/sessionKeepalive';

interface SimulationInstanceData {
  instance_id: string;
  attempt_number: number;
  max_stage: number;
  stages_completed: number;
  decision_count: number;
  total_scenarios_completed: number;
  final_score: number;
  bravin_overall_score: number;
  metrics_average_score: number;
  is_best_attempt: boolean;
  started_at: string;
  completed_at: string;
  total_decision_time_seconds: number;
}

interface AttemptSummary {
  instance_id: string;
  attempt_number: number;
  final_score: number;
  completed_at: string;
  is_best_attempt: boolean;
}

const Results: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const { currentUser, resetSimulation, getUserProgress, activeSession } = useSimulationStore(state => ({
    currentUser: state.currentUser,
    resetSimulation: state.resetSimulation,
    getUserProgress: state.getUserProgress,
    activeSession: state.activeSession
  }));

  const navigate = useNavigate();
  const { t } = useLanguage();
  const progress = getUserProgress();
  const [activeTab, setActiveTab] = useState<'bravin' | 'competencies' | 'metrics' | 'skills'>('bravin');
  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(true);
  const [instanceData, setInstanceData] = useState<SimulationInstanceData | null>(null);
  const [allAttempts, setAllAttempts] = useState<AttemptSummary[]>([]);
  const [showAttemptHistory, setShowAttemptHistory] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (simulationId) {
      loadSimulation();
      loadInstanceData();
    } else {
      setLoadingSimulation(false);
    }

    // Stop session keepalive when reaching results page
    // Simulation is complete, no need to keep refreshing
    return () => {
      SessionKeepaliveManager.stop();
    };
  }, [simulationId]);

  const loadSimulation = async () => {
    if (!simulationId) return;

    setLoadingSimulation(true);
    try {
      const data = await SimulationService.getSimulation(simulationId);
      setSimulation(data);
    } catch (error) {
      console.error('Error loading simulation for results:', error);
    } finally {
      setLoadingSimulation(false);
    }
  };

  const loadInstanceData = async () => {
    if (!simulationId || !currentUser) return;

    try {
      console.log('[Results] Loading instance data for:', {
        simulationId,
        learnerId: currentUser.id,
        activeSessionInstanceId: activeSession?.instanceId
      });

      // Load all attempts for history
      const attempts = await SimulationCompletionService.getAllAttempts(currentUser.id, simulationId);
      console.log('[Results] Found attempts:', attempts.length);

      if (attempts && attempts.length > 0) {
        const attemptSummaries: AttemptSummary[] = attempts.map((attempt: any) => ({
          instance_id: attempt.instance_id,
          attempt_number: attempt.attempt_number,
          final_score: attempt.final_score || 0,
          completed_at: attempt.completed_at,
          is_best_attempt: attempt.is_best_attempt || false
        }));
        setAllAttempts(attemptSummaries);
      }

      // First try to use the active session's instance ID if it's completed
      if (activeSession?.instanceId) {
        console.log('[Results] Checking active session instance:', activeSession.instanceId);

        const { data, error } = await supabase
          .from('simulation_instances')
          .select(`
            id,
            attempt_number,
            max_stage,
            stages_completed,
            decision_count,
            final_score,
            bravin_overall_score,
            metrics_average_score,
            is_best_attempt,
            started_at,
            completed_at,
            total_decision_time_seconds,
            status
          `)
          .eq('id', activeSession.instanceId)
          .maybeSingle();

        if (!error && data) {
          // If this instance is completed, use it
          if (data.status === 'completed') {
            console.log('[Results] Using completed active session instance:', data);
            setInstanceData({
              instance_id: data.id,
              attempt_number: data.attempt_number || 1,
              max_stage: data.max_stage || 0,
              stages_completed: data.stages_completed || 0,
              decision_count: data.decision_count || 0,
              total_scenarios_completed: data.decision_count || 0,
              final_score: data.final_score || 0,
              bravin_overall_score: data.bravin_overall_score || 0,
              metrics_average_score: data.metrics_average_score || 0,
              is_best_attempt: data.is_best_attempt || false,
              started_at: data.started_at,
              completed_at: data.completed_at,
              total_decision_time_seconds: data.total_decision_time_seconds || 0
            });
            setSelectedAttemptId(data.id);
            return;
          } else {
            console.log('[Results] Active session instance is not completed yet, status:', data.status);
          }
        } else if (error) {
          console.error('[Results] Error fetching active session instance:', error);
        }
      }

      // Get the best (highest scoring) attempt
      console.log('[Results] Fetching best attempt for learner-simulation pair');
      const bestAttempt = await SimulationCompletionService.getBestAttempt(currentUser.id, simulationId);

      if (bestAttempt) {
        console.log('[Results] Best attempt loaded:', {
          attemptNumber: bestAttempt.attempt_number,
          finalScore: bestAttempt.final_score,
          isBest: bestAttempt.is_best_attempt
        });

        setInstanceData({
          instance_id: bestAttempt.instance_id,
          attempt_number: bestAttempt.attempt_number || 1,
          max_stage: bestAttempt.max_stage || 0,
          stages_completed: bestAttempt.stages_completed || 0,
          decision_count: bestAttempt.decision_count || 0,
          total_scenarios_completed: bestAttempt.decision_count || 0,
          final_score: bestAttempt.final_score || 0,
          bravin_overall_score: bestAttempt.bravin_overall_score || 0,
          metrics_average_score: bestAttempt.metrics_average_score || 0,
          is_best_attempt: bestAttempt.is_best_attempt || false,
          started_at: bestAttempt.started_at,
          completed_at: bestAttempt.completed_at,
          total_decision_time_seconds: bestAttempt.total_decision_time_seconds || 0
        });
        setSelectedAttemptId(bestAttempt.instance_id);
      } else {
        console.warn('[Results] No completed attempts found');
      }
    } catch (error) {
      console.error('[Results] Error loading instance data:', error);
    }
  };
  
  if (!currentUser || !progress) {
    navigate('/dashboard');
    return null;
  }
  
  // Calculate recent skill changes
  const recentSkillChanges: Record<string, number> = {};
  
  if (progress.completedScenarios.length > 0) {
    const latestScenario = progress.completedScenarios[progress.completedScenarios.length - 1];
    const scenarioOption = useSimulationStore.getState().getScenarioById(latestScenario.scenarioId)?.options.find(
      o => o.id === latestScenario.selectedOptionId
    );
    
    if (scenarioOption) {
      Object.entries(scenarioOption.skillImpact).forEach(([skill, impact]) => {
        recentSkillChanges[skill] = impact;
      });
    }
  }
  
  const handleNewSimulation = () => {
    resetSimulation();
    navigate('/simulation');
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-blue-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>{t('simulation.results.backToDashboard')}</span>
      </button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white text-center mb-8">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
            <Award className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {simulation?.closing_title || t('simulation.results.simulationCompleteTitle')}
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto">
            {simulation?.display_name ? t('simulation.results.completedMessage', { name: simulation.display_name }) : t('simulation.results.simulationComplete')} {t('simulation.results.reviewPerformance')}
          </p>

          <div className="flex justify-center mt-6 space-x-2 flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('bravin')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'bravin'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {t('simulation.results.bravinAssessment')}
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'metrics'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {t('simulation.results.performanceMetrics')}
            </button>
            <button
              onClick={() => setActiveTab('competencies')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'competencies'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {t('simulation.results.competencies')}
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'skills'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {t('simulation.results.skillsProgress')}
            </button>
          </div>
        </div>

        {/* Attempt Info and History */}
        {instanceData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Attempt #{instanceData.attempt_number}
                    {instanceData.is_best_attempt && (
                      <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        <Award className="w-4 h-4 mr-1" />
                        Best Score
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Completed on {new Date(instanceData.completed_at).toLocaleDateString()} at {new Date(instanceData.completed_at).toLocaleTimeString()}
                  </p>
                </div>
                {allAttempts.length > 1 && (
                  <button
                    onClick={() => setShowAttemptHistory(!showAttemptHistory)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    {showAttemptHistory ? 'Hide' : 'View'} All Attempts ({allAttempts.length})
                  </button>
                )}
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Final Score</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(instanceData.final_score)}%
                  </p>
                </div>

                {instanceData.bravin_overall_score > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">BRAVIN Score</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {Math.round(instanceData.bravin_overall_score)}%
                    </p>
                  </div>
                )}

                {instanceData.metrics_average_score > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Metrics Score</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {Math.round(instanceData.metrics_average_score)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Attempt History */}
              {showAttemptHistory && allAttempts.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
                >
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Previous Attempts</h4>
                  <div className="space-y-2">
                    {allAttempts.map((attempt) => (
                      <div
                        key={attempt.instance_id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAttemptId === attempt.instance_id
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          // TODO: Load selected attempt data
                          setSelectedAttemptId(attempt.instance_id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                            #{attempt.attempt_number}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              Attempt {attempt.attempt_number}
                              {attempt.is_best_attempt && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                  Best
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(attempt.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {Math.round(attempt.final_score)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              {t('simulation.results.performanceSummary')}
            </h2>

            {/* Completion Status Badge */}
            {instanceData && instanceData.decision_count > 0 && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-green-900 dark:text-green-100 font-semibold">{t('simulation.results.simulationCompleteStatus')}</p>
                  <p className="text-green-700 dark:text-green-300 text-sm">{t('simulation.results.completedAllStages', { count: instanceData.decision_count })}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{t('simulation.results.stagesCompleted')}</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {instanceData ? `${instanceData.decision_count}` : `${progress.completedScenarios.length}`}
                </p>
                {instanceData && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('simulation.results.fullPathCompletion')}</p>
                )}
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">{t('simulation.results.decisionsMade')}</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {instanceData?.decision_count ?? progress.completedScenarios.length}
                </p>
                {instanceData && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('simulation.results.choicePointsNavigated')}</p>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">{t('simulation.results.simulationType')}</p>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  {t('simulation.results.branching')}
                </p>
                {instanceData && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('simulation.results.multiplePathsAvailable')}</p>
                )}
              </div>
            </div>

            {/* Decision Progression Indicator */}
            {instanceData && instanceData.decision_count > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('simulation.results.stageProgression')}</p>
                <div className="flex items-center gap-2">
                  {Array.from({ length: instanceData.decision_count }, (_, i) => (
                    <div key={i} className="flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-green-500 text-white"
                        >
                          {i + 1}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{t('simulation.results.stage')} {i + 1}</p>
                      </div>
                      {i < instanceData.decision_count - 1 && (
                        <div className="h-1 bg-gray-200 dark:bg-gray-700 mt-5 -mx-1">
                          <div className="h-full bg-green-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Branching Simulation Explanation */}
        {instanceData && instanceData.decision_count > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">{t('simulation.results.aboutBranchingSimulations')}</h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed mb-3">
              {t('simulation.results.branchingExplanation', { stages: instanceData.decision_count, decisions: instanceData.decision_count })}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Metrics:</p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li><span className="font-medium">{instanceData.decision_count} Stages</span> - Decision points you navigated</li>
                <li><span className="font-medium">5 BRAVIN Metrics</span> - Leadership dimensions evaluated at each stage</li>
                <li><span className="font-medium">Comprehensive Assessment</span> - Each decision evaluated across multiple metrics for detailed feedback</li>
              </ul>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-3 italic">
              {t('simulation.results.stagesExplained')}
            </p>
          </div>
        )}

        {/* Recent Skill Changes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
              {t('simulation.results.recentSkillChanges')}
            </h2>

            {Object.keys(recentSkillChanges).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(recentSkillChanges).map(([skill, impact]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {skill.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      impact > 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : impact < 0
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      {impact > 0 ? `+${impact}` : impact}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('simulation.results.noRecentSkillChanges')}</p>
            )}
          </div>
        </div>
        
        {activeTab === 'bravin' && currentUser && (
          <div className="mb-8">
            <BravinResults
              learnerId={currentUser.id}
              simulationInstanceId={selectedAttemptId || instanceData?.instance_id || activeSession?.instanceId}
              showDetailedBreakdown={true}
            />
          </div>
        )}

        {activeTab === 'metrics' && currentUser && (
          <div className="mb-8">
            <MetricsSummary
              learnerId={currentUser.id}
              simulationInstanceId={selectedAttemptId || instanceData?.instance_id || activeSession?.instanceId}
            />
          </div>
        )}

        {activeTab === 'competencies' && currentUser && (
          <div className="mb-8">
            <CompetencyResults
              learnerId={currentUser.id}
              simulationId={progress.completedScenarios[0]?.scenarioId || ''}
            />
          </div>
        )}

        {activeTab === 'skills' && (
          <>
            {/* Recent Skill Changes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Skill Changes
                </h2>

                {Object.keys(recentSkillChanges).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(recentSkillChanges).map(([skill, impact]) => (
                      <div key={skill} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {skill.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          impact > 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : impact < 0
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                        }`}>
                          {impact > 0 ? `+${impact}` : impact}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('simulation.results.noRecentSkillChanges')}</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  {t('simulation.results.recommendations')}
                </h2>

                <div className="prose text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  <p>{t('simulation.results.recommendationsIntro')}</p>
                  <ul>
                    <li>{t('simulation.results.recommendationPractice')}</li>
                    <li>{t('simulation.results.recommendationReview')}</li>
                    <li>{t('simulation.results.recommendationDifficulty')}</li>
                    <li>{t('simulation.results.recommendationApply')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleNewSimulation}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
          >
            {t('simulation.results.startNewSimulation')}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {t('simulation.results.returnToDashboard')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Results;