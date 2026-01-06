import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSimulationStore } from '../../store';
import { useLanguage } from '../../contexts/LanguageContext';
import SkillsProgress from './SkillsProgress';
import RecentActivity from './RecentActivity';
import { PlayCircle, BookOpen, Trophy, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser, getTopics } = useSimulationStore(state => ({
    currentUser: state.currentUser,
    getTopics: state.getTopics
  }));

  const topics = getTopics();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-xl p-8 shadow-md">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              {t('dashboard.welcomeBack', { name: currentUser.name })}
            </h1>
            <p className="text-blue-100 mb-6">
              {t('dashboard.learningJourney')}
            </p>
            <button
              onClick={() => navigate('/simulation')}
              className="px-6 py-3 bg-white text-blue-700 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center font-medium"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {t('simulation.landing.begin')}
            </button>
          </motion.div>
        </div>
      </section>
      
      {/* Stats Overview */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.completed')}</p>
              <p className="text-2xl font-semibold dark:text-gray-100">{currentUser.progress.completedScenarios.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('navigation.simulations')}</p>
              <p className="text-2xl font-semibold dark:text-gray-100">{topics.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.lastActivity')}</p>
              <p className="text-2xl font-semibold dark:text-gray-100">
                {currentUser.progress.completedScenarios.length > 0
                  ? new Date(
                    Math.max(
                      ...currentUser.progress.completedScenarios.map(s => s.timestamp)
                    )
                  ).toLocaleDateString()
                  : t('common.none')}
              </p>
            </div>
          </div>
        </div>
      </motion.section>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skills Progress */}
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

        {/* Recent Activity */}
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