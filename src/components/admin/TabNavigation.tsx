'use client';

import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  isValid: boolean;
  isRequired: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <nav className="flex space-x-2 px-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const showWarning = tab.isRequired && !tab.isValid;
          const showCheck = tab.isValid;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : showWarning
                  ? 'border-transparent text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {tab.label}
              {showWarning && !isActive && (
                <AlertCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              )}
              {showCheck && !isActive && (
                <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
