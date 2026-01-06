'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProgress } from '@/hooks/useUserProgress';
import { CheckCircle2 } from 'lucide-react';
import SkeletonLoader from '../ui/SkeletonLoader';

const RecentActivity: React.FC = () => {
  const { t } = useLanguage();
  const { data: progress, isLoading } = useUserProgress();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-3 p-3">
            <SkeletonLoader variant="circular" width="20px" height="20px" />
            <div className="flex-1">
              <SkeletonLoader variant="text" width="100%" />
              <SkeletonLoader variant="text" width="80%" className="mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!progress || !progress.recentActivity || progress.recentActivity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.noActivity')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('dashboard.completeToSeeActivity')}</p>
      </div>
    );
  }

  const recentActivities = progress.recentActivity.slice(0, 5);

  return (
    <div className="space-y-4">
      {recentActivities.map((activity, index) => (
        <div
          key={index}
          className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              Scenario Response
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {activity.response_time_ms ? `Completed in ${Math.round(activity.response_time_ms / 1000)}s` : 'Completed'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
