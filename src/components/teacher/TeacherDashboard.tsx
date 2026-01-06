'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ClipboardList, BarChart3, Sliders, BookOpen } from 'lucide-react';

type TabType = 'assignments' | 'cohorts' | 'simulations' | 'analytics' | 'metrics';

interface TeacherDashboardProps {
  userName?: string;
  userRole?: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  userName = 'Teacher',
  userRole = 'instructor'
}) => {
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
      id: 'simulations' as TabType,
      label: 'Simulations',
      icon: BookOpen,
      description: 'Browse and assign simulations'
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
        return <AssignmentsPanel />;
      case 'cohorts':
        return <CohortsPanel />;
      case 'simulations':
        return <SimulationsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'metrics':
        return <MetricsPanel />;
      default:
        return <AssignmentsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
                <p className="text-white opacity-90 mt-1">Welcome back, {userName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm font-medium bg-white bg-opacity-20 text-white rounded-full">
                  {userRole === 'admin' ? 'Admin' : 'Instructor'}
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

const AssignmentsPanel: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <ClipboardList className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Assignment Management</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      Create and manage assignments for your learners. Track submission status, view results, and provide feedback.
    </p>
    <div className="mt-6">
      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Create New Assignment
      </button>
    </div>
  </div>
);

const CohortsPanel: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <Users className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Cohort Management</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      Organize learners into cohorts and groups. Manage membership, assign simulations, and track group progress.
    </p>
    <div className="mt-6">
      <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        Create New Cohort
      </button>
    </div>
  </div>
);

const SimulationsPanel: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Simulation Library</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      Browse available simulations and assign them to your cohorts. View simulation details and learner outcomes.
    </p>
    <div className="mt-6">
      <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        Browse Simulations
      </button>
    </div>
  </div>
);

const AnalyticsPanel: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Performance Analytics</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      View detailed analytics on learner performance, completion rates, competency development, and BRAVIN scores.
    </p>
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">85%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Completion</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">78%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Score</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">42</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Learners</div>
        </div>
      </div>
    </div>
  </div>
);

const MetricsPanel: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <Sliders className="w-16 h-16 mx-auto mb-4 text-orange-600 dark:text-orange-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Metrics Configuration</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
      Configure assessment metrics and competency weights. Customize how learner performance is measured and evaluated.
    </p>
    <div className="mt-6">
      <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
        Configure Metrics
      </button>
    </div>
  </div>
);

export default TeacherDashboard;
