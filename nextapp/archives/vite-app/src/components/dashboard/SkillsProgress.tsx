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
import { useSimulationStore } from '../../store';
import { useLanguage } from '../../contexts/LanguageContext';

// Register Chart.js components
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
  const userProgress = useSimulationStore(state => state.currentUser?.progress);

  if (!userProgress) {
    return <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noSkillsData')}</p>;
  }
  
  // Format the skills data for the chart
  const skillLabels = Object.keys(userProgress.skillLevels).map(skill => {
    // Convert camelCase or snake_case to Title Case
    return skill
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  });
  
  const skillValues = Object.values(userProgress.skillLevels);
  
  const chartData = {
    labels: skillLabels,
    datasets: [
      {
        label: t('dashboard.skillLevel'),
        data: skillValues,
        backgroundColor: [
          'rgba(74, 144, 226, 0.7)',   // Blue
          'rgba(32, 201, 151, 0.7)',   // Teal
          'rgba(121, 80, 242, 0.7)',   // Purple
          'rgba(240, 171, 31, 0.7)',   // Amber
          'rgba(223, 71, 89, 0.7)',    // Red
          'rgba(100, 116, 139, 0.7)'   // Slate
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
            return `${context.label}: ${context.raw}`;
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
  
  // If there are no skill values or all values are 0, show a message
  const hasSkills = skillValues.some(value => value > 0);
  
  if (!hasSkills) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 mb-4">No skills data yet</p>
        <p className="text-sm text-gray-400">Complete scenarios to develop your skills profile</p>
      </div>
    );
  }
  
  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SkillsProgress;