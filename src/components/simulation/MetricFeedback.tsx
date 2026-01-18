'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MetricFeedbackItem {
  metric_id: string;
  metric_name: string;
  metric_type: string;
  score: number;
  feedback: string;
  benchmark?: number;
  threshold?: number;
  max_score?: number;
}

interface MetricFeedbackProps {
  feedback: MetricFeedbackItem[];
  showThresholds?: boolean;
}

const MetricFeedback: React.FC<MetricFeedbackProps> = ({ feedback, showThresholds = true }) => {
  const getScoreColor = (score: number, threshold?: number, benchmark?: number) => {
    if (threshold) {
      if (score >= threshold) return 'text-green-600';
      if (score >= threshold * 0.8) return 'text-amber-600';
      return 'text-red-600';
    }

    if (benchmark) {
      if (score >= benchmark + 2) return 'text-green-600';
      if (score >= benchmark) return 'text-blue-600';
      if (score >= benchmark - 2) return 'text-amber-600';
      return 'text-red-600';
    }

    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-blue-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number, threshold?: number, benchmark?: number) => {
    if (threshold) {
      if (score >= threshold) return <CheckCircle className="w-5 h-5 text-green-600" />;
      if (score >= threshold * 0.8) return <AlertCircle className="w-5 h-5 text-amber-600" />;
      return <XCircle className="w-5 h-5 text-red-600" />;
    }

    if (benchmark) {
      if (score > benchmark + 1) return <TrendingUp className="w-5 h-5 text-green-600" />;
      if (score < benchmark - 1) return <TrendingDown className="w-5 h-5 text-red-600" />;
      return <Minus className="w-5 h-5 text-gray-600" />;
    }

    if (score >= 7) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (score <= 3) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getPerformanceLabel = (score: number, threshold?: number) => {
    if (!threshold) return null;
    if (score >= threshold) return { text: 'Passed', color: 'text-green-600 bg-green-50' };
    if (score >= threshold * 0.8) return { text: 'Near Pass', color: 'text-amber-600 bg-amber-50' };
    return { text: 'Below Threshold', color: 'text-red-600 bg-red-50' };
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
        const colorClass = getScoreColor(item.score, item.threshold, item.benchmark);
        const icon = getScoreIcon(item.score, item.threshold, item.benchmark);
        const performanceLabel = showThresholds ? getPerformanceLabel(item.score, item.threshold) : null;
        const maxScore = item.max_score || 10;
        const percentage = (item.score / maxScore) * 100;

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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {icon}
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.metric_name}
                  </h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {item.metric_type}
                  </span>
                  {performanceLabel && (
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${performanceLabel.color}`}>
                      {performanceLabel.text}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${colorClass}`}>
                  {item.score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {maxScore}
                </div>
                {item.benchmark !== undefined && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Benchmark: {item.benchmark.toFixed(1)}
                  </div>
                )}
              </div>
            </div>

            {item.feedback && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                {item.feedback}
              </p>
            )}

            <div className="mt-3 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative">
              {showThresholds && item.threshold && (
                <>
                  <div
                    className="absolute top-0 h-full w-0.5 bg-amber-500 z-10"
                    style={{ left: `${(item.threshold / maxScore) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 h-full text-xs text-amber-700 dark:text-amber-300 font-semibold z-10"
                    style={{
                      left: `${(item.threshold / maxScore) * 100}%`,
                      transform: 'translateX(-50%) translateY(-18px)'
                    }}
                  >
                    ↓ {item.threshold.toFixed(1)}
                  </div>
                </>
              )}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-500`}
              />
            </div>

            {showThresholds && item.threshold && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Minimum required: {item.threshold.toFixed(1)}</span>
                {item.score >= item.threshold ? (
                  <span className="text-green-600 font-semibold">
                    +{(item.score - item.threshold).toFixed(1)} above threshold
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    {(item.threshold - item.score).toFixed(1)} below threshold
                  </span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default MetricFeedback;
