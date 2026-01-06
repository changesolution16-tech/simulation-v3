import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useSimulationStore } from '../../store';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { useLanguage } from '../../contexts/LanguageContext';

const TransitionPage: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { activeSession, currentUser, updateSessionScenarioIndex } = useSimulationStore();
  const { language, t } = useLanguage();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);

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

    if (currentSimScenario?.is_exit_point || !selectedOption?.nextScenarioId) {
      if (simulation.closing_page_enabled && simulation.closing_page_show_before_results) {
        navigate(`/simulation/${simulationId}/closing`);
      } else {
        navigate(`/simulation/results/${simulationId}`);
      }
      return;
    }

    const nextScenarioIndex = simulation.scenarios?.findIndex(
      s => s.scenario_id === selectedOption.nextScenarioId
    );

    if (nextScenarioIndex !== undefined && nextScenarioIndex >= 0) {
      updateSessionScenarioIndex(nextScenarioIndex);
      navigate(`/simulation/${simulationId}/scenario/${nextScenarioIndex}/introduction`);
    } else {
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.transition.preparing')}</p>
        </div>
      </div>
    );
  }

  if (!simulation || !activeSession || !activeSession.selectedOptionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.landing.simulationNotFound')}</p>
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

  const transitionVideoUrl = selectedOption.transitionVideoUrl || currentScenario.transitionVideoUrl;
  const isLastScenario = currentSimScenario?.is_exit_point || !selectedOption.nextScenarioId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
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

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span>
                {t('simulation.question.levelOf', { current: (currentScenario?.hierarchyLevel ?? 0) + 1, total: (simulation.max_level ?? 0) + 1 })}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {transitionVideoUrl && (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={transitionVideoUrl}
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
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center"
                >
                  {isLastScenario ? (
                    <>{t('assignments.viewResults')} <ChevronRight className="w-5 h-5 ml-2" /></>
                  ) : (
                    <>{t('simulation.transition.nextScenario')} <ChevronRight className="w-5 h-5 ml-2" /></>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TransitionPage;
