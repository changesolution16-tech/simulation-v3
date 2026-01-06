import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Settings, UsersRound, Workflow, BarChart3, ChevronDown, Award, Target, ClipboardList, Palette } from 'lucide-react';
import { useSimulationStore } from '../../store';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import OfflineModeNotice from '../OfflineModeNotice';
import UserManager from './UserManager';
import ScenarioManager from './ScenarioManager';
import VideoManager from './VideoManager';
import CohortManager from '../teacher/CohortManager';
import AssignmentManager from '../teacher/AssignmentManager';
import ScenarioFlowBuilder from './ScenarioFlowBuilder';
import PathAnalyticsDashboard from './PathAnalyticsDashboard';
import CategoryManager from './CategoryManager';
import CompetencyManager from './CompetencyManager';
import MetricsManager from './MetricsManager';
import BrandingSettings from './BrandingSettings';

type TabType = 'users' | 'cohorts' | 'assignments' | 'scenarios' | 'flowbuilder' | 'analytics' | 'videos' | 'categories' | 'competencies' | 'metrics' | 'settings' | 'branding';

interface TabSection {
  id: string;
  title: string;
  icon: React.ElementType;
  tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ElementType;
    description: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useSimulationStore();
  const offlineMode = useOfflineMode();
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const tabSections: TabSection[] = [
    {
      id: 'user-management',
      title: t('admin.userManagement'),
      icon: Users,
      tabs: [
        { id: 'users' as TabType, label: t('admin.users'), icon: Users, description: t('admin.manageUsers') },
        { id: 'cohorts' as TabType, label: t('admin.cohorts'), icon: UsersRound, description: t('admin.manageCohorts') },
        { id: 'assignments' as TabType, label: t('navigation.assignments'), icon: ClipboardList, description: t('admin.manageAssignments') }
      ]
    },
    {
      id: 'simulations',
      title: t('navigation.simulations'),
      icon: BookOpen,
      tabs: [
        { id: 'categories' as TabType, label: t('admin.categories'), icon: BookOpen, description: t('admin.organizeSimulations') },
        { id: 'scenarios' as TabType, label: t('admin.scenarios'), icon: BookOpen, description: t('admin.createScenarios') },
        { id: 'flowbuilder' as TabType, label: t('admin.flowBuilder'), icon: Workflow, description: t('admin.connectScenarios') },
        { id: 'videos' as TabType, label: t('admin.videos'), icon: GraduationCap, description: t('admin.manageVideos') }
      ]
    },
    {
      id: 'assessment',
      title: t('admin.assessment'),
      icon: Target,
      tabs: [
        { id: 'competencies' as TabType, label: t('admin.competencies'), icon: Award, description: t('admin.defineCompetencies') },
        { id: 'metrics' as TabType, label: t('admin.metrics'), icon: Target, description: t('admin.configureMetrics') }
      ]
    },
    {
      id: 'system',
      title: t('admin.system'),
      icon: Settings,
      tabs: [
        { id: 'analytics' as TabType, label: t('admin.analytics'), icon: BarChart3, description: t('admin.viewPathAnalytics') },
        { id: 'branding' as TabType, label: t('admin.branding'), icon: Palette, description: t('admin.customizeBranding') },
        { id: 'settings' as TabType, label: t('navigation.settings'), icon: Settings, description: t('admin.systemConfiguration') }
      ]
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside = Object.values(dropdownRefs.current).every(
        ref => ref && !ref.contains(target)
      );
      if (isOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabSelect = (tabId: TabType) => {
    setActiveTab(tabId);
    setOpenDropdown(null);
  };

  const toggleDropdown = (sectionId: string) => {
    setOpenDropdown(openDropdown === sectionId ? null : sectionId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManager />;
      case 'cohorts':
        return <CohortManager />;
      case 'assignments':
        return <AssignmentManager />;
      case 'categories':
        return <CategoryManager />;
      case 'scenarios':
        return <ScenarioManager />;
      case 'flowbuilder':
        return <ScenarioFlowBuilder />;
      case 'competencies':
        return <CompetencyManager />;
      case 'metrics':
        return <MetricsManager />;
      case 'analytics':
        return <PathAnalyticsDashboard />;
      case 'videos':
        return <VideoManager />;
      case 'branding':
        return <BrandingSettings />;
      case 'settings':
        return <SettingsPlaceholder />;
      default:
        return <UserManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">{t('admin.dashboard')}</h1>
                <p className="text-white opacity-90 mt-1">{t('dashboard.welcomeBack', { name: currentUser?.name })}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-4 py-2 text-sm font-medium bg-white bg-opacity-20 rounded-full">
                  {t('navigation.admin')}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              {tabSections.map((section) => {
                const SectionIcon = section.icon;
                const isActive = section.tabs.some(tab => tab.id === activeTab);

                return (
                  <div
                    key={section.id}
                    ref={el => dropdownRefs.current[section.id] = el}
                    className="relative"
                  >
                    <button
                      onClick={() => toggleDropdown(section.id)}
                      className={`flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-brand-primary shadow-lg'
                          : 'text-white opacity-90 hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      <SectionIcon className="w-5 h-5 mr-2" />
                      {section.title}
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${
                        openDropdown === section.id ? 'rotate-180' : ''
                      }`} />
                    </button>

                    <AnimatePresence>
                      {openDropdown === section.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                        >
                          {section.tabs.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleTabSelect(tab.id)}
                                className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                                  activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900'
                                }`}
                              >
                                <TabIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                                <div className="text-left">
                                  <div className="font-medium">{tab.label}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">{tab.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!offlineMode.canUseDatabase && (
          <OfflineModeNotice className="mb-6" />
        )}
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

const SettingsPlaceholder: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">System Settings</h3>
      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
        System configuration options will be available here, including LTI settings,
        institution details, and platform preferences.
      </p>
    </div>
  );
};

export default AdminDashboard;
