import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ClipboardList, BarChart3, Sliders, BookOpen, Settings } from 'lucide-react';
import { useSimulationStore } from '../../store';
import { useLanguage } from '../../contexts/LanguageContext';
import CohortManager from './CohortManager';
import AssignmentManager from './AssignmentManager';
import ScenarioManager from '../admin/ScenarioManager';

type TabType = 'assignments' | 'cohorts' | 'scenarios' | 'analytics' | 'metrics';

const TeacherDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<TabType>('assignments');

  const tabs = [
    { id: 'assignments' as TabType, label: t('navigation.assignments'), icon: ClipboardList, description: t('teacher.manageAssignments') },
    { id: 'cohorts' as TabType, label: t('admin.cohorts'), icon: Users, description: t('teacher.manageCohorts') },
    { id: 'scenarios' as TabType, label: t('admin.scenarios'), icon: BookOpen, description: t('admin.createScenarios') },
    { id: 'analytics' as TabType, label: t('admin.analytics'), icon: BarChart3, description: t('teacher.viewAnalytics') },
    { id: 'metrics' as TabType, label: t('admin.metrics'), icon: Sliders, description: t('admin.configureMetrics') }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assignments':
        return <AssignmentManager />;
      case 'cohorts':
        return <CohortManager />;
      case 'scenarios':
        return <ScenarioManager />;
      case 'analytics':
        return <AnalyticsPlaceholder />;
      case 'metrics':
        return <MetricsPlaceholder />;
      default:
        return <AssignmentManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-brand-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">{t('teacher.dashboard')}</h1>
                <p className="text-white opacity-90 mt-1">{t('dashboard.welcomeBack', { name: currentUser?.name })}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm font-medium bg-white bg-opacity-20 text-white rounded-full">
                  {currentUser?.role === 'admin' ? t('navigation.admin') : t('navigation.teacher')}
                </span>
              </div>
            </div>

            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-brand-primary shadow-lg'
                        : 'text-white opacity-90 hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

const AnalyticsPlaceholder: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('teacher.analyticsComingSoon')}</h3>
      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
        {t('teacher.analyticsDescription')}
      </p>
    </div>
  );
};

const MetricsPlaceholder: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <Sliders className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('teacher.metricsComingSoon')}</h3>
      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
        {t('teacher.metricsDescription')}
      </p>
    </div>
  );
};

export default TeacherDashboard;
