'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface MetricFeedbackItem {
  metric_id: string;
  metric_name: string;
  metric_type: string;
  score: number;
  feedback: string;
  benchmark?: number;
}

interface MetricFeedbackProps {
  feedback: MetricFeedbackItem[];
}

const MetricFeedback: React.FC<MetricFeedbackProps> = ({ feedback }) => {
  const getScoreColor = (score: number, benchmark?: number) => {
    if (!benchmark) {
      if (score >= 8) return 'text-green-600';
      if (score >= 5) return 'text-blue-600';
      if (score >= 3) return 'text-amber-600';
      return 'text-red-600';
    }

    if (score >= benchmark + 2) return 'text-green-600';
    if (score >= benchmark) return 'text-blue-600';
    if (score >= benchmark - 2) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number, benchmark?: number) => {
    if (!benchmark) {
      if (score >= 7) return <TrendingUp className="w-5 h-5 text-green-600" />;
      if (score <= 3) return <TrendingDown className="w-5 h-5 text-red-600" />;
      return <Minus className="w-5 h-5 text-gray-600" />;
    }

    if (score > benchmark + 1) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (score < benchmark - 1) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  if (feedback.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No metric feedback available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Performance Metrics
        </h3>
      </div>

      {feedback.map((item, index) => {
        const colorClass = getScoreColor(item.score, item.benchmark);
        const icon = getScoreIcon(item.score, item.benchmark);

        return (
          <motion.div
            key={item.metric_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {icon}
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.metric_name}
                  </h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {item.metric_type}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${colorClass}`}>
                  {item.score.toFixed(1)}
                </div>
                {item.benchmark !== undefined && (
                  <div className="text-xs text-gray-500">
                    Benchmark: {item.benchmark.toFixed(1)}
                  </div>
                )}
              </div>
            </div>

            {item.feedback && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.feedback}
              </p>
            )}

            <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-500`}
                style={{ width: `${(item.score / 10) * 100}%` }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MetricFeedback;
