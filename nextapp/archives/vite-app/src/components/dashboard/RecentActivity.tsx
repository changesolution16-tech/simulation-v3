import React from 'react';
import { useSimulationStore } from '../../store';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle2 } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, getScenarioById } = useSimulationStore(state => ({
    currentUser: state.currentUser,
    getScenarioById: state.getScenarioById
  }));

  if (!currentUser || !currentUser.progress.completedScenarios.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.noActivity')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('dashboard.completeToSeeActivity')}</p>
      </div>
    );
  }
  
  // Get the most recent 5 activities
  const recentActivities = [...currentUser.progress.completedScenarios]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
  
  return (
    <div className="space-y-4">
      {recentActivities.map((activity, index) => {
        const scenario = getScenarioById(activity.scenarioId);
        if (!scenario) return null;
        
        const selectedOption = scenario.options.find(o => o.id === activity.selectedOptionId);
        
        return (
          <div 
            key={index} 
            className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {scenario.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {selectedOption ? selectedOption.text.substring(0, 50) + (selectedOption.text.length > 50 ? '...' : '') : t('dashboard.unknownResponse')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivity;