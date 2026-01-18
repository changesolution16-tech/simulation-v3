'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSimulation } from '@/hooks/useSimulations';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Target,
  PlayCircle,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import SkeletonLoader from '../ui/SkeletonLoader';
import VideoPlayer from '../simulation/VideoPlayer';

interface SimulationLandingProps {
  simulationId: string;
}

const SimulationLanding: React.FC<SimulationLandingProps> = ({ simulationId }) => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { data: simulation, isLoading, error } = useSimulation(simulationId);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  const handleStartSimulation = () => {
    router.push(`/simulations/${simulationId}/play`);
  };

  const handleVideoComplete = () => {
    setVideoWatched(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700';
      case 'intermediate':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  const getLandingTitle = () => {
    if (language === 'es' && simulation?.landing_title_es) {
      return simulation.landing_title_es;
    }
    return simulation?.landing_title || simulation?.display_name || simulation?.name;
  };

  const getLandingDescription = () => {
    if (language === 'es' && simulation?.landing_description_es) {
      return simulation.landing_description_es;
    }
    return simulation?.landing_description || simulation?.description;
  };

  const getLandingRoleDescription = () => {
    if (language === 'es' && simulation?.landing_role_description_es) {
      return simulation.landing_role_description_es;
    }
    return simulation?.landing_role_description;
  };

  const getLandingObjectives = () => {
    let objectives = [];

    if (language === 'es' && simulation?.landing_objectives_es) {
      objectives = simulation.landing_objectives_es;
    } else if (simulation?.landing_objectives) {
      objectives = simulation.landing_objectives;
    }

    // Ensure objectives is always an array
    if (!Array.isArray(objectives)) {
      if (typeof objectives === 'string') {
        try {
          objectives = JSON.parse(objectives);
        } catch {
          return [];
        }
      } else {
        return [];
      }
    }

    return objectives;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <SkeletonLoader width="200px" height="24px" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-100 dark:border-gray-700">
            <SkeletonLoader width="100%" height="300px" className="mb-6" />
            <SkeletonLoader width="80%" height="36px" className="mb-4" />
            <SkeletonLoader width="100%" height="60px" className="mb-6" />
            <div className="grid lg:grid-cols-2 gap-6">
              <SkeletonLoader width="100%" height="200px" />
              <SkeletonLoader width="100%" height="200px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('simulation.landing.simulationNotFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error?.message || 'The simulation you are looking for could not be found.'}
          </p>
          <button
            onClick={() => router.push('/simulations')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            {t('simulation.landing.backToSimulations')}
          </button>
        </div>
      </div>
    );
  }

  const objectives = getLandingObjectives();
  const roleDescription = getLandingRoleDescription();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/simulations')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">{t('simulation.landing.backToSimulations')}</span>
            </button>

            {simulation.difficulty && (
              <>
                <div className="text-gray-300 dark:text-gray-600">|</div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(simulation.difficulty)}`}>
                  {simulation.difficulty}
                </span>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            {simulation.landing_image_url && (
              <div className="relative w-full h-80 overflow-hidden bg-gray-100 dark:bg-gray-700">
                {!imageLoaded && !imageError && (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                )}
                {imageError && (
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('simulation.landing.imageUnavailable')}</p>
                  </div>
                )}
                {!imageError && (
                  <img
                    src={simulation.landing_image_url}
                    alt={simulation.landing_image_alt || getLandingTitle()}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            )}

            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-8">
                {simulation.estimated_duration_minutes && (
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full px-3 py-1.5 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {simulation.estimated_duration_minutes} {t('common.minutes')}
                    </div>
                  </div>
                )}

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                  {getLandingTitle()}
                </h1>

                {getLandingDescription() && (
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl">
                    {getLandingDescription()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {simulation.landing_intro_video_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('simulation.landing.introductionVideo')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('simulation.landing.introductionVideoDesc')}</p>
                  </div>
                </div>
                <VideoPlayer
                  videoUrl={simulation.landing_intro_video_url}
                  videoType={simulation.landing_intro_video_type || 'youtube'}
                  onComplete={handleVideoComplete}
                  allowSkip
                />
              </div>
            </motion.div>
          )}

          {(objectives.length > 0 || roleDescription) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {objectives.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('simulation.landing.learningObjectives')}</h2>
                  </div>
                  <div className="space-y-3">
                    {objectives.map((objective: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {typeof objective === 'string' ? objective : objective.text || objective}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {roleDescription && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('simulation.landing.yourRole')}</h2>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {roleDescription}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <button
              onClick={handleStartSimulation}
              className="flex-1 px-8 py-4 rounded-lg shadow-lg font-bold text-lg flex items-center justify-center transition-all transform bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 hover:shadow-xl hover:scale-105"
            >
              <PlayCircle className="w-6 h-6 mr-2" />
              {t('simulation.landing.startSimulation')}
            </button>
            <button
              onClick={() => router.push('/simulations')}
              className="sm:w-48 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {t('common.back')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationLanding;
