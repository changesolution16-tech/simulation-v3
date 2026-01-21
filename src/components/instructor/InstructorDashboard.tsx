'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ClipboardList, BarChart3, Sliders, BookOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import AssignmentManager from './AssignmentManager';
import CohortManager from './CohortManager';
import ScenarioManager from '@/components/admin/ScenarioManager';

type TabType = 'assignments' | 'cohorts' | 'scenarios' | 'analytics' | 'metrics';

const InstructorDashboard: React.FC = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('assignments');

  const tabs = [
    {
      id: 'assignments' as TabType,
      label: 'Assignments',
      icon: ClipboardList,
      description: 'Manage learner assignments and track progress'
    },
    {
      id: 'cohorts' as TabType,
      label: 'Cohorts',
      icon: Users,
      description: 'Organize learners into cohorts and groups'
    },
    {
      id: 'scenarios' as TabType,
      label: 'Scenarios',
      icon: BookOpen,
      description: 'Browse and manage scenarios'
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart3,
      description: 'View performance analytics and reports'
    },
    {
      id: 'metrics' as TabType,
      label: 'Metrics',
      icon: Sliders,
      description: 'Configure assessment metrics'
    }
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Instructor Dashboard</h1>
                <p className="text-white opacity-90 mt-1">
                  Welcome back, {session?.user?.name || 'Instructor'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm font-medium bg-white bg-opacity-20 text-white rounded-full">
                  {session?.user?.role === 'admin' ? 'Admin' : 'Instructor'}
                </span>
              </div>
            </div>

            <div className="flex space-x-1 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-lg'
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const AnalyticsPlaceholder: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Analytics Coming Soon</h3>
    <p className="text-gray-500 dark:text-gray-400">
      Performance analytics and cohort-level reporting will appear here.
    </p>
  </div>
);

const MetricsPlaceholder: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <Sliders className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Metrics Coming Soon</h3>
    <p className="text-gray-500 dark:text-gray-400">
      Metric configuration tools will appear here.
    </p>
  </div>
);

export default InstructorDashboard;
