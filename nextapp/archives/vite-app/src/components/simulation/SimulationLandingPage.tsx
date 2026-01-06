import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Target, PlayCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';
import { SimulationCardSkeleton } from '../ui/SkeletonLoader';
import { getSimulationDisplayName, getSimulationLandingTitle, getSimulationLandingDescription, getSimulationLandingRoleDescription, getDifficultyTranslationKey } from '../../lib/translationHelpers';

const SimulationLandingPage: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!simulationId) {
      navigate('/learner');
      return;
    }

    loadSimulation();
  }, [simulationId, navigate]);

  useEffect(() => {
    if (simulation?.landing_image_url) {
      console.log('[SimulationLandingPage] Landing image URL:', simulation.landing_image_url);
    }
  }, [simulation]);

  const loadSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const data = await SimulationService.getSimulation(simulationId);
      if (data) {
        setSimulation(data);
      } else {
        console.error('Simulation not found');
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

  const handleStartSimulation = () => {
    if (!simulationId) return;
    navigate(`/simulation/play/${simulationId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 flex items-center">
            <button
              onClick={() => navigate('/learner')}
              className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">{t('simulation.landing.backToSimulations')}</span>
            </button>
          </div>
          <SimulationCardSkeleton />
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Simulation not found</p>
          <button
            onClick={() => navigate('/learner')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/learner')}
              className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">{t('simulation.landing.backToSimulations')}</span>
            </button>

            {simulation.difficulty && (
              <>
                <div className="mx-3 text-gray-300 dark:text-gray-600">/</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyColor(simulation.difficulty)}`}>
                  {t(getDifficultyTranslationKey(simulation.difficulty))}
                </span>
              </>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-4 lg:p-6">
              {simulation.landing_image_url && (
                <div className="mb-6 -mx-4 lg:-mx-6">
                  {!imageLoaded && !imageError && (
                    <div className="w-full h-64 lg:h-80 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  )}
                  {imageError && (
                    <div className="w-full h-64 lg:h-80 bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('simulation.landing.imageUnavailable')}</p>
                    </div>
                  )}
                  {!imageError && (
                    <img
                      src={simulation.landing_image_url}
                      alt={simulation.landing_image_alt || simulation.display_name}
                      className={`w-full h-64 lg:h-80 object-cover transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                      }`}
                      onLoad={() => {
                        console.log('[SimulationLandingPage] Image loaded successfully:', simulation.landing_image_url);
                        setImageLoaded(true);
                      }}
                      onError={(e) => {
                        console.error('[SimulationLandingPage] Image failed to load:', simulation.landing_image_url);
                        console.error('[SimulationLandingPage] Error event:', e);
                        setImageError(true);
                      }}
                    />
                  )}
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                {simulation.estimated_duration_minutes && (
                  <div className="inline-flex items-center gap-1.5 mb-3">
                    <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full px-2.5 py-1 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {simulation.estimated_duration_minutes} min
                    </div>
                  </div>
                )}

                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                  {getSimulationLandingTitle(simulation, language)}
                </h1>

                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl text-justify">
                  {getSimulationLandingDescription(simulation, language)}
                </p>
              </div>
            </div>
          </div>

          {simulation.landing_intro_video_url && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('simulation.landing.introductionVideo')}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('simulation.landing.introductionVideoDesc')}</p>
                  </div>
                </div>
                <SynthesiaPlayer
                  videoUrl={simulation.landing_intro_video_url}
                  videoType="introduction"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  autoPlay={false}
                  requireFullWatch={false}
                  minWatchPercentage={0}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {simulation.landing_objectives && simulation.landing_objectives.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('simulation.landing.learningObjectives')}</h2>
                </div>
                <div className="space-y-1.5">
                  {simulation.landing_objectives.map((objective: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{objective.text || objective}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {getSimulationLandingRoleDescription(simulation, language) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('simulation.landing.yourRole')}</h2>
                </div>
                <div className="prose prose-blue max-w-none">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {getSimulationLandingRoleDescription(simulation, language)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              onClick={handleStartSimulation}
              className="flex-1 px-6 py-3 rounded-lg shadow-lg font-bold text-base flex items-center justify-center transition-all transform bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 hover:shadow-xl hover:scale-105"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {t('simulation.landing.startSimulation')}
            </button>
            <button
              onClick={() => navigate('/learner')}
              className="sm:w-40 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {t('common.back')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationLandingPage;
