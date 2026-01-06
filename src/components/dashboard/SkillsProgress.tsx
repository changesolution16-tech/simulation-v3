'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProgress } from '@/hooks/useUserProgress';
import SkeletonLoader from '../ui/SkeletonLoader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SkillsProgress: React.FC = () => {
  const { t } = useLanguage();
  const { data: progress, isLoading } = useUserProgress();

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <SkeletonLoader variant="rectangular" width="100%" height="300px" />
      </div>
    );
  }

  if (!progress || !progress.competencies || progress.competencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">No skills data yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Complete scenarios to develop your skills profile</p>
      </div>
    );
  }

  const skillLabels = progress.competencies.map(comp => comp.competency_name);
  const skillValues = progress.competencies.map(comp => comp.current_level);

  const chartData = {
    labels: skillLabels,
    datasets: [
      {
        label: t('dashboard.skillLevel'),
        data: skillValues,
        backgroundColor: [
          'rgba(74, 144, 226, 0.7)',
          'rgba(32, 201, 151, 0.7)',
          'rgba(121, 80, 242, 0.7)',
          'rgba(240, 171, 31, 0.7)',
          'rgba(223, 71, 89, 0.7)',
          'rgba(100, 116, 139, 0.7)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(32, 201, 151, 1)',
          'rgba(121, 80, 242, 1)',
          'rgba(240, 171, 31, 1)',
          'rgba(223, 71, 89, 1)',
          'rgba(100, 116, 139, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#334155',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: () => '',
          label: (context: any) => {
            return `${context.label}: Level ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        },
        title: {
          display: true,
          text: 'Skill Level'
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SkillsProgress;
