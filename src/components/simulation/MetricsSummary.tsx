'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus, Award, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface MetricScore {
  metric_name: string;
  score: number;
  max_score: number;
  category: string;
  threshold?: number;
  previous_score?: number;
  attempt_number?: number;
}

interface MetricsSummaryProps {
  metrics: MetricScore[];
  overallScore?: number;
  showTrends?: boolean;
  showPassRate?: boolean;
}

const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  metrics,
  overallScore,
  showTrends = false,
  showPassRate = false
}) => {
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

  const calculateTrend = (current: number, previous?: number): 'improving' | 'stable' | 'declining' => {
    if (!previous) return 'stable';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const groupedMetrics = metrics.reduce((acc, metric) => {
    const category = metric.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(metric);
    return acc;
  }, {} as Record<string, MetricScore[]>);

  const passedCount = metrics.filter(m => m.threshold && m.score >= m.threshold).length;
  const totalCount = metrics.filter(m => m.threshold).length;
  const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Metric Breakdown
            </h3>
          </div>
          {showPassRate && totalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {passRate.toFixed(0)}% Pass Rate
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ({passedCount}/{totalCount})
              </span>
            </div>
          )}
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
                  const trend = calculateTrend(metric.score, metric.previous_score);
                  const passed = metric.threshold ? metric.score >= metric.threshold : null;

                  return (
                    <motion.div
                      key={`${category}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (idx * 0.1) + (index * 0.05) }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {metric.metric_name}
                          </span>
                          {showTrends && metric.previous_score && (
                            <span className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
                              {getTrendIcon(trend)}
                            </span>
                          )}
                          {passed !== null && (
                            passed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            {metric.score.toFixed(1)} / {metric.max_score}
                          </span>
                          {metric.threshold && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              (min: {metric.threshold})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative">
                        {metric.threshold && (
                          <div
                            className="absolute top-0 h-full w-0.5 bg-amber-500 z-10"
                            style={{ left: `${(metric.threshold / metric.max_score) * 100}%` }}
                          />
                        )}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: (idx * 0.1) + (index * 0.05) }}
                          className={`h-full ${getCategoryColor(category)} transition-all duration-500`}
                        />
                      </div>

                      {showTrends && metric.previous_score && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Previous: {metric.previous_score.toFixed(1)}
                          {metric.score !== metric.previous_score && (
                            <span className={getTrendColor(trend)}>
                              {' '}({metric.score > metric.previous_score ? '+' : ''}{(metric.score - metric.previous_score).toFixed(1)})
                            </span>
                          )}
                        </div>
                      )}
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
