'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, Target } from 'lucide-react';

interface MetricScore {
  metric_name: string;
  score: number;
  max_score: number;
  category: string;
}

interface MetricsSummaryProps {
  metrics: MetricScore[];
  overallScore?: number;
}

const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics, overallScore }) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      communication: 'bg-blue-500',
      leadership: 'bg-purple-500',
      collaboration: 'bg-green-500',
      'problem-solving': 'bg-amber-500',
      empathy: 'bg-pink-500',
      default: 'bg-gray-500'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  const groupedMetrics = metrics.reduce((acc, metric) => {
    const category = metric.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(metric);
    return acc;
  }, {} as Record<string, MetricScore[]>);

  return (
    <div className="space-y-6">
      {overallScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
              <p className="text-blue-100">Aggregate metric score</p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold">{Math.round(overallScore)}</div>
              <p className="text-blue-100 mt-2">out of 100</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Metric Breakdown
          </h3>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedMetrics).map(([category, categoryMetrics], idx) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                {category}
              </h4>

              <div className="space-y-3">
                {categoryMetrics.map((metric, index) => {
                  const percentage = (metric.score / metric.max_score) * 100;

                  return (
                    <motion.div
                      key={`${category}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (idx * 0.1) + (index * 0.05) }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {metric.metric_name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {metric.score.toFixed(1)} / {metric.max_score}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: (idx * 0.1) + (index * 0.05) }}
                          className={`h-full ${getCategoryColor(category)} transition-all duration-500`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              About Performance Metrics
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              These metrics track specific aspects of your performance throughout the simulation.
              Each decision you make can impact one or more metrics, providing detailed insight
              into your strengths and areas for development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;
