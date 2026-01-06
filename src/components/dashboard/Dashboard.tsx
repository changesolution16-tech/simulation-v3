'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSimulations } from '@/hooks/useSimulations';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useUserAssignments } from '@/hooks/useAssignments';
import SkillsProgress from './SkillsProgress';
import RecentActivity from './RecentActivity';
import { PlayCircle, BookOpen, Trophy, Clock } from 'lucide-react';
import SkeletonLoader from '../ui/SkeletonLoader';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { data: simulations, isLoading: simulationsLoading } = useSimulations();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { data: assignments, isLoading: assignmentsLoading } = useUserAssignments();

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  const isLoading = simulationsLoading || progressLoading;

  const handleStartSimulation = () => {
    if (assignments && assignments.length > 0) {
      router.push(`/simulations/${assignments[0].simulation_id}/play`);
    } else if (simulations && simulations.length > 0) {
      const publishedSim = simulations.find(s => s.is_published);
      if (publishedSim) {
        router.push(`/simulations/${publishedSim.id}/play`);
      }
    }
  };

  const completedCount = progress?.completedSimulations || 0;
  const availableSimulations = simulations?.filter(s => s.is_published).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-xl p-8 shadow-md">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              {t('dashboard.welcomeBack', { name: session.user.name || 'User' })}
            </h1>
            <p className="text-blue-100 mb-6">
              {t('dashboard.learningJourney')}
            </p>
            <button
              onClick={handleStartSimulation}
              disabled={availableSimulations === 0}
              className="px-6 py-3 bg-white text-blue-700 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {t('simulation.landing.begin')}
            </button>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.completed')}</p>
              {isLoading ? (
                <SkeletonLoader width="60px" height="32px" />
              ) : (
                <p className="text-2xl font-semibold dark:text-gray-100">{completedCount}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('navigation.simulations')}</p>
              {isLoading ? (
                <SkeletonLoader width="60px" height="32px" />
              ) : (
                <p className="text-2xl font-semibold dark:text-gray-100">{availableSimulations}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.lastActivity')}</p>
              {isLoading ? (
                <SkeletonLoader width="100px" height="32px" />
              ) : (
                <p className="text-2xl font-semibold dark:text-gray-100">
                  {progress?.recentActivity && progress.recentActivity.length > 0
                    ? new Date(progress.recentActivity[0].created_at).toLocaleDateString()
                    : t('common.none')}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">{t('dashboard.skillsProgress')}</h2>
            <SkillsProgress />
          </div>
        </motion.section>

        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 h-full">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">{t('dashboard.recentActivity')}</h2>
            <RecentActivity />
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Dashboard;
