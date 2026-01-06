import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, MessageSquare, User, Clock, FolderOpen } from 'lucide-react';
import { useSimulationStore } from '../../store';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { getScenarioTitle, getScenarioDescription, getCategoryName } from '../../lib/translationHelpers';
import { SessionKeepaliveManager } from '../../lib/sessionKeepalive';

const IntroductionPage: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { activeSession, currentUser } = useSimulationStore();
  const { language, t } = useLanguage();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
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

    // Start session keepalive when entering simulation
    SessionKeepaliveManager.start();

    loadSimulation();

    // Cleanup: stop keepalive when leaving simulation
    return () => {
      // Don't stop here - let it continue through the simulation
      // Will be stopped in Results or when explicitly exiting
    };
  }, [simulationId, currentUser, activeSession, navigate]);

  const loadSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const data = await SimulationService.getSimulation(simulationId);
      if (data) {
        setSimulation(data);

        // Fetch category name if category_id exists
        if (data.category_id && supabase) {
          const { data: category } = await supabase
            .from('simulation_categories')
            .select('name, name_en, name_es')
            .eq('id', data.category_id)
            .maybeSingle();

          if (category) {
            setCategoryName(category.name);
          }
        }
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
    if (!simulationId || !activeSession) return;
    navigate(`/simulation/${simulationId}/scenario/${activeSession.currentScenarioIndex}/question`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.introduction.loadingScenario')}</p>
        </div>
      </div>
    );
  }

  if (!simulation || !activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">{t('simulation.introduction.scenarioNotFound')}</p>
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

  const canContinue = !currentScenario.introductionVideoUrl || videoWatched;

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

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-3">
                {getScenarioTitle(currentScenario, language)}
              </h1>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-blue-600 text-white">
                  1
                </div>
                <span>{t('simulation.introduction.stepIntroduction')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-300 text-white">
                  2
                </div>
                <span>{t('simulation.introduction.stepDecision')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-300 text-white">
                  3
                </div>
                <span>{t('simulation.introduction.stepFeedback')}</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {getScenarioDescription(currentScenario, language)}
                  </p>
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {categoryName && (
                    <>
                      <FolderOpen className="w-4 h-4 mr-1" />
                      <span>{categoryName}</span>
                      <span className="mx-2">•</span>
                    </>
                  )}
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{t('simulation.introduction.estimatedTime', { minutes: simulation?.max_level ? (simulation.max_level + 1) * 2 : 10 })}</span>
                </div>
              </div>
            </div>

            {canContinue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center text-lg"
                >
                  {t('common.continue')}
                  <PlayCircle className="w-6 h-6 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;
