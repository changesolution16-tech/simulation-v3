'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';

interface DifficultySelectionProps {
  topicName: string;
  availableDifficulties: ('beginner' | 'intermediate' | 'advanced')[];
  onSelect: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  onBack: () => void;
}

const DifficultySelection: React.FC<DifficultySelectionProps> = ({
  topicName,
  availableDifficulties,
  onSelect,
  onBack
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const difficultyOptions = [
    {
      level: 'beginner' as const,
      title: 'Beginner',
      description: 'Ideal for those new to this skill area. Basic scenarios with comprehensive guidance.',
      color: 'bg-green-600',
      hoverColor: 'bg-green-700',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-100 dark:border-green-800'
    },
    {
      level: 'intermediate' as const,
      title: 'Intermediate',
      description: 'For those with some experience. More complex scenarios with moderate guidance.',
      color: 'bg-amber-600',
      hoverColor: 'bg-amber-700',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-100 dark:border-amber-800'
    },
    {
      level: 'advanced' as const,
      title: 'Advanced',
      description: 'For experienced professionals. Challenging scenarios with minimal guidance.',
      color: 'bg-red-600',
      hoverColor: 'bg-red-700',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-100 dark:border-red-800'
    }
  ].filter(option => availableDifficulties.includes(option.level));

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>Back to Topics</span>
      </button>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Select Difficulty Level
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a difficulty level for <span className="font-medium text-blue-600 dark:text-blue-400">{topicName}</span> based on your experience and comfort with this skill area.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {difficultyOptions.map((option) => (
          <motion.div
            key={option.level}
            variants={item}
            whileHover={{
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${option.borderColor} overflow-hidden hover:shadow-md transition-shadow`}
          >
            <button
              onClick={() => onSelect(option.level)}
              className="w-full h-full text-left p-6"
            >
              <div className="flex items-center">
                <div className={`${option.bgColor} ${option.textColor} p-3 rounded-lg`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100">{option.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                </div>
                <div className={`ml-4 px-4 py-2 rounded-lg ${option.color} text-white font-medium hover:${option.hoverColor} transition-colors`}>
                  Select
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default DifficultySelection;
