'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface CompetencyFeedbackItem {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  score: number;
  level: 'advanced' | 'proficient' | 'developing' | 'awareness';
  feedback: string;
  suggestion: string;
}

interface CompetencyFeedbackProps {
  feedback: CompetencyFeedbackItem[];
}

const CompetencyFeedback: React.FC<CompetencyFeedbackProps> = ({ feedback }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'advanced':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-500 text-white'
        };
      case 'proficient':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-500 text-white'
        };
      case 'developing':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-500 text-white'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          badge: 'bg-gray-500 text-white'
        };
    }
  };

  if (feedback.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <p className="text-blue-800">No competency feedback available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Competency Assessment
        </h3>
      </div>

      {feedback.map((item, index) => {
        const colors = getLevelColor(item.level);

        return (
          <motion.div
            key={item.competency_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {item.competency_code}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                    {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                  </span>
                </div>
                <h4 className={`text-lg font-bold ${colors.text}`}>
                  {item.competency_name}
                </h4>
              </div>
              <div className={`text-3xl font-bold ${colors.text}`}>
                {Math.round(item.score)}%
              </div>
            </div>

            <div className={`${colors.text} text-sm leading-relaxed mb-4`}>
              <p>{item.feedback}</p>
            </div>

            {item.suggestion && (
              <div className={`bg-white/50 dark:bg-black/20 rounded-lg p-4 border ${colors.border}`}>
                <div className="flex items-start gap-2">
                  <Lightbulb className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Growth Suggestion
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.suggestion}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default CompetencyFeedback;
