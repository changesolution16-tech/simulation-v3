'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';

interface CompetencyFeedbackItem {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  score: number;
  level: 'advanced' | 'proficient' | 'developing' | 'awareness';
  feedback: string;
  suggestion: string;
  previous_score?: number;
  previous_level?: 'advanced' | 'proficient' | 'developing' | 'awareness';
}

interface CompetencyFeedbackProps {
  feedback: CompetencyFeedbackItem[];
  showComparison?: boolean;
}

const CompetencyFeedback: React.FC<CompetencyFeedbackProps> = ({ feedback, showComparison = false }) => {
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

  const getLevelRank = (level: string): number => {
    const ranks = { advanced: 4, proficient: 3, developing: 2, awareness: 1 };
    return ranks[level as keyof typeof ranks] || 0;
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
        const scoreChange = item.previous_score ? item.score - item.previous_score : 0;
        const levelImproved = item.previous_level ? getLevelRank(item.level) > getLevelRank(item.previous_level) : false;

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
                  {showComparison && item.previous_level && item.level !== item.previous_level && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {item.previous_level}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className={`px-2 py-0.5 rounded ${colors.badge}`}>
                        {item.level}
                      </span>
                    </div>
                  )}
                  {(!showComparison || !item.previous_level || item.level === item.previous_level) && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                      {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                    </span>
                  )}
                  {levelImproved && (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <h4 className={`text-lg font-bold ${colors.text}`}>
                  {item.competency_name}
                </h4>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${colors.text}`}>
                  {Math.round(item.score)}%
                </div>
                {showComparison && item.previous_score && (
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {scoreChange > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : scoreChange < 0 ? (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    ) : null}
                    <span className={`text-xs ${scoreChange > 0 ? 'text-green-600' : scoreChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {scoreChange > 0 && '+'}{scoreChange.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {showComparison && item.previous_score && (
              <div className="mb-4 bg-white/50 dark:bg-black/10 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Previous Score</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {Math.round(item.previous_score)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gray-400 dark:bg-gray-500 transition-all"
                    style={{ width: `${item.previous_score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Current Score</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {Math.round(item.score)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${colors.badge.replace('text-white', '')} transition-all`}
                  />
                </div>
              </div>
            )}

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
