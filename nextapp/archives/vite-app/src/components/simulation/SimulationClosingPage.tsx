import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Target, ArrowRight, Info } from 'lucide-react';
import { useSimulationStore } from '../../store';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { SimulationService } from '../../lib/simulations';
import { MetricScoreService, MetricAssessment } from '../../lib/metricScores';
import { SimulationWithScenarios } from '../../types';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { getSimulationClosingTitle } from '../../lib/translationHelpers';
import { CompetencyService, LearnerCompetency } from '../../lib/competencies';
import { CompetencyFeedbackService, SimulationFeedbackSummary } from '../../lib/competencyFeedback';
import { SimulationCompletionService } from '../../lib/simulationCompletion';
import BravinFeedbackSummary from './BravinFeedbackSummary';

type PerformanceTier = 'excellent' | 'good' | 'developing';

interface InstanceData {
  max_stage: number;
  stages_completed: number;
  decision_count: number;
}

const SimulationClosingPage: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { currentUser, activeSession } = useSimulationStore();
  const { language } = useLanguage();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [assessments, setAssessments] = useState<MetricAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('developing');
  const [percentageScore, setPercentageScore] = useState<number>(0);
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);
  const [learnerCompetencies, setLearnerCompetencies] = useState<LearnerCompetency[]>([]);
  const [bravinFeedback, setBravinFeedback] = useState<SimulationFeedbackSummary | null>(null);
  const [showBravinFeedback, setShowBravinFeedback] = useState(false);

  useEffect(() => {
    if (!simulationId || !currentUser) {
      navigate('/learner');
      return;
    }

    loadData();
  }, [simulationId, currentUser, navigate]);

  const loadData = async () => {
    if (!simulationId || !currentUser) return;

    setLoading(true);
    try {
      // Load all data in parallel for performance
      const [simData, metricsData, competenciesData] = await Promise.all([
        SimulationService.getSimulation(simulationId),
        MetricScoreService.getLearnerMetricAssessments(currentUser.id, activeSession?.instanceId),
        CompetencyService.getLearnerCompetencies(currentUser.id)
      ]);

      if (simData) {
        setSimulation(simData);
        setAssessments(metricsData);
        setLearnerCompetencies(competenciesData);

        console.log('[SimulationClosingPage] Loaded assessments:', {
          count: metricsData.length,
          instanceId: activeSession?.instanceId,
          assessments: metricsData.map(a => ({
            metric: a.metric?.name,
            score: a.score_achieved,
            maxScore: a.metric_max_score
          }))
        });

        console.log('[SimulationClosingPage] assessments.length =', metricsData.length);

        // Calculate performance tier and percentage score
        const tier = calculatePerformanceTier(metricsData, simData);
        setPerformanceTier(tier);

        const totalScore = metricsData.reduce((sum, a) => sum + a.score_achieved, 0);
        const maxPossibleScore = metricsData.reduce((sum, a) => sum + a.metric_max_score, 0);
        const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

        // Generate feedback summary
        const feedback = await CompetencyFeedbackService.generateSimulationFeedback(
          competenciesData,
          metricsData,
          tier,
          Math.round(percentage)
        );
        setBravinFeedback(feedback);

        // Load instance data and ensure metrics are up to date
        if (activeSession?.instanceId) {
          console.log('[SimulationClosingPage] Fetching instance data for:', activeSession.instanceId);

          // First, validate and fix any metric inconsistencies
          try {
            const { data: validationData, error: validationError } = await supabase
              .rpc('validate_and_fix_instance_metrics', {
                p_instance_id: activeSession.instanceId
              });

            if (!validationError && validationData) {
              console.log('[SimulationClosingPage] Validation result:', validationData);
            }
          } catch (validationError) {
            console.warn('[SimulationClosingPage] Validation function not available:', validationError);
            // Continue anyway - this is a nice-to-have
          }

          // Then load the instance data
          const { data: instData, error: instError } = await supabase
            .from('simulation_instances')
            .select('max_stage, stages_completed, decision_count')
            .eq('id', activeSession.instanceId)
            .maybeSingle();

          if (instError) {
            console.error('[SimulationClosingPage] Error fetching instance data:', instError);
          } else if (instData) {
            console.log('[SimulationClosingPage] Instance data loaded:', instData);
            console.log('[SimulationClosingPage] decision_count from DB:', instData.decision_count);
            console.log('[SimulationClosingPage] stages_completed from DB:', instData.stages_completed);
            setInstanceData(instData);
          } else {
            console.warn('[SimulationClosingPage] No instance data found for:', activeSession.instanceId);
          }
        } else {
          console.warn('[SimulationClosingPage] No activeSession.instanceId available');
        }
      } else {
        console.error('Simulation not found');
        navigate('/learner');
      }
    } catch (error) {
      console.error('Error loading simulation closing data:', error);
      navigate('/learner');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceTier = (
    assessments: MetricAssessment[],
    simulation: SimulationWithScenarios
  ): PerformanceTier => {
    if (assessments.length === 0) {
      console.log('[SimulationClosingPage] No assessments found');
      setPercentageScore(0);
      return 'developing';
    }

    const totalScore = assessments.reduce((sum, a) => sum + a.score_achieved, 0);
    const maxPossibleScore = assessments.reduce((sum, a) => sum + a.metric_max_score, 0);

    console.log('[SimulationClosingPage] Score calculation:', {
      totalScore,
      maxPossibleScore,
      assessmentCount: assessments.length
    });

    if (maxPossibleScore === 0) {
      console.log('[SimulationClosingPage] Max possible score is 0');
      setPercentageScore(0);
      return 'developing';
    }

    const percentage = (totalScore / maxPossibleScore) * 100;
    console.log('[SimulationClosingPage] Final percentage:', percentage);
    setPercentageScore(Math.round(percentage));

    const excellentThreshold = simulation.closing_excellent_threshold || 85;
    const goodThreshold = simulation.closing_good_threshold || 70;

    if (percentage >= excellentThreshold) {
      return 'excellent';
    } else if (percentage >= goodThreshold) {
      return 'good';
    } else {
      return 'developing';
    }
  };

  const getVideoUrl = (): string | null => {
    if (!simulation) return null;

    switch (performanceTier) {
      case 'excellent':
        return simulation.closing_video_excellent_url || simulation.closing_video_url || null;
      case 'good':
        return simulation.closing_video_good_url || simulation.closing_video_url || null;
      case 'developing':
        return simulation.closing_video_developing_url || simulation.closing_video_url || null;
      default:
        return simulation.closing_video_url || null;
    }
  };

  const getVideoType = (): string => {
    if (!simulation) return 'synthesia';

    switch (performanceTier) {
      case 'excellent':
        return simulation.closing_video_excellent_type || simulation.closing_video_type || 'synthesia';
      case 'good':
        return simulation.closing_video_good_type || simulation.closing_video_type || 'synthesia';
      case 'developing':
        return simulation.closing_video_developing_type || simulation.closing_video_type || 'synthesia';
      default:
        return simulation.closing_video_type || 'synthesia';
    }
  };

  const getTierDisplay = () => {
    switch (performanceTier) {
      case 'excellent':
        return {
          label: 'Excellent Performance',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          icon: Award,
          message: 'Outstanding work! You demonstrated exceptional understanding and decision-making.'
        };
      case 'good':
        return {
          label: 'Good Performance',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          icon: Target,
          message: 'Well done! You showed solid understanding and made effective decisions.'
        };
      case 'developing':
        return {
          label: 'Developing Skills',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
          icon: TrendingUp,
          message: 'You\'re on your way! Keep practicing to strengthen your skills.'
        };
    }
  };

  const handleContinue = async () => {
    if (!simulationId || !activeSession?.instanceId) {
      navigate(`/simulation/results/${simulationId}`);
      return;
    }

    // Use the database function to properly complete the simulation and calculate all scores
    try {
      console.log('[SimulationClosingPage] Completing simulation via database function');

      const result = await SimulationCompletionService.completeSimulation(activeSession.instanceId);

      if (result.success) {
        console.log('[SimulationClosingPage] ✓ Simulation completed successfully:', result.scores);

        if (result.scores) {
          console.log('[SimulationClosingPage] Final scores:', {
            overall: result.scores.final_score,
            bravin: result.scores.bravin_score,
            metrics: result.scores.metrics_score
          });
        }
      } else {
        console.error('[SimulationClosingPage] Error completing simulation:', result.error);
        // Continue anyway - user can still view results
      }
    } catch (error) {
      console.error('[SimulationClosingPage] Exception completing simulation:', error);
      // Continue anyway - user can still view results
    }

    navigate(`/simulation/results/${simulationId}`);
  };

  const handleVideoComplete = () => {
    setVideoWatched(true);
  };

  const handleVideoSkip = () => {
    setVideoWatched(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Simulation not found</p>
          <button
            onClick={() => navigate('/learner')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tierDisplay = getTierDisplay();
  const TierIcon = tierDisplay.icon;
  const videoUrl = getVideoUrl();
  const videoType = getVideoType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={`border-2 ${tierDisplay.borderColor} ${tierDisplay.bgColor} rounded-2xl p-8`}>
            <div className="flex items-center justify-center mb-6">
              <div className={`p-4 ${tierDisplay.bgColor} rounded-full`}>
                <TierIcon className={`w-12 h-12 ${tierDisplay.color}`} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
              {getSimulationClosingTitle(simulation, language)}
            </h1>

            <div className="text-center mb-4">
              <div className={`inline-flex items-center px-6 py-3 rounded-full ${tierDisplay.bgColor} border-2 ${tierDisplay.borderColor}`}>
                <span className={`text-2xl font-bold ${tierDisplay.color}`}>
                  {percentageScore}%
                </span>
                <span className="mx-3 text-gray-400 dark:text-gray-500">|</span>
                <span className={`text-lg font-semibold ${tierDisplay.color}`}>
                  {tierDisplay.label}
                </span>
              </div>
            </div>

            <p className="text-center text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto">
              {tierDisplay.message}
            </p>
          </div>

          {videoUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Closing Message
                </h2>
                <SynthesiaPlayer
                  videoUrl={videoUrl}
                  videoType="supplementary"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance Summary</h3>
              <button
                onClick={() => setShowAssessmentDetails(!showAssessmentDetails)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
                {showAssessmentDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-1">Stages Completed</p>
                <p className="text-2xl font-bold text-blue-900">
                  {(() => {
                    // First try to use decision_count from instance data (most reliable)
                    if (instanceData?.decision_count !== undefined && instanceData?.decision_count !== null) {
                      console.log('[SimulationClosingPage] Using decision_count from instance:', instanceData.decision_count);
                      return instanceData.decision_count;
                    }

                    // Fallback: Count unique decisions from assessments
                    // Each decision can have multiple metric assessments (e.g., 5 BRAVIN metrics per decision)
                    // We need to count unique scenario+option pairs, filtering out any with missing IDs
                    const validAssessments = assessments.filter(a => a.scenario_id && a.option_id);
                    const uniqueDecisions = new Set(
                      validAssessments.map(a => `${a.scenario_id}_${a.option_id}`)
                    );
                    const count = uniqueDecisions.size;

                    console.log('[SimulationClosingPage] Calculated from assessments:', {
                      totalAssessments: assessments.length,
                      validAssessments: validAssessments.length,
                      uniqueDecisions: count,
                      uniqueKeys: Array.from(uniqueDecisions),
                      instanceData
                    });

                    return count;
                  })()}
                </p>
                <p className="text-xs text-blue-600 mt-1">Decisions made in your path</p>
              </div>

              <div className={`${tierDisplay.bgColor} rounded-lg p-4`}>
                <p className={`text-sm ${tierDisplay.color} mb-1`}>Overall Score</p>
                <p className={`text-2xl font-bold ${tierDisplay.color}`}>
                  {percentageScore}%
                </p>
                <p className="text-xs ${tierDisplay.color} mt-1 opacity-75">Performance rating</p>
              </div>
            </div>

            {showAssessmentDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Assessment Metrics Breakdown</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Total Assessments</p>
                    <p className="text-3xl font-bold text-blue-700">{assessments.length}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      Individual metric evaluations across all decisions
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-900 mb-2">Metrics per Decision</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {instanceData?.decision_count
                        ? (assessments.length / instanceData.decision_count).toFixed(1)
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-purple-600 mt-2">
                      Average assessment metrics evaluated per choice
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">How Assessment Metrics Work</h5>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Total Assessments</span> = Number of decisions you made × Metrics evaluated per decision
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">
                      Each decision you make is evaluated across multiple assessment metrics. These include:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-2 mt-1 space-y-1">
                      <li>Standard metrics configured for each option (varies by scenario)</li>
                      <li>5 BRAVIN framework metrics (evaluated on every decision)</li>
                      <li>Leadership competency indicators</li>
                    </ul>
                    <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-3">
                      <span className="font-medium">Your simulation:</span> You made {instanceData?.decision_count || 0} decisions,
                      with an average of {instanceData?.decision_count
                        ? (assessments.length / instanceData.decision_count).toFixed(1)
                        : 'N/A'} metrics evaluated per decision.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 mb-3">
                    <span className="font-semibold">Understanding Your Results:</span>
                  </p>
                  <ul className="text-sm text-blue-900 space-y-2 list-disc list-inside">
                    <li>
                      <span className="font-semibold">Stages Completed: {instanceData?.decision_count || 0}</span> -
                      The number of decision points you navigated in your unique path
                    </li>
                    <li>
                      <span className="font-semibold">5 BRAVIN Metrics per Stage</span> -
                      Each decision is evaluated across 5 leadership culture metrics (BRAVIN Alignment, Trust Impact, Ethical Decision Quality, Emotional Intelligence, Cultural Stewardship)
                    </li>
                    <li>
                      <span className="font-semibold">Total Assessments: {assessments.length}</span> -
                      This equals {instanceData?.decision_count || 0} stages × approximately 5-7 metrics per stage
                    </li>
                    <li>
                      <span className="font-semibold">Branching Simulation</span> -
                      While this simulation has {simulation.scenarios?.length || 0} total scenarios across all possible paths,
                      you completed {instanceData?.decision_count || 0} stages in your chosen path
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>

          {bravinFeedback && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">BRAVIN Framework Feedback</h3>
                <button
                  onClick={() => setShowBravinFeedback(!showBravinFeedback)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Info className="w-4 h-4" />
                  {showBravinFeedback ? 'Hide' : 'Show'} Detailed Feedback
                </button>
              </div>
              {showBravinFeedback && (
                <BravinFeedbackSummary feedback={bravinFeedback} />
              )}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleContinue}
              disabled={videoUrl ? !videoWatched : false}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View Detailed Results
              <ArrowRight className="w-6 h-6 ml-2" />
            </button>
          </div>

          {videoUrl && !videoWatched && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Watch the video to continue to detailed results
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationClosingPage;
