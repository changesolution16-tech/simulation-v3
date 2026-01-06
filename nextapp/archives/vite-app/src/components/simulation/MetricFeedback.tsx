import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { MetricAssessment } from '../../lib/metricScores';

interface MetricFeedbackProps {
  assessments: MetricAssessment[];
}

const MetricFeedback: React.FC<MetricFeedbackProps> = ({ assessments }) => {
  if (assessments.length === 0) {
    return null;
  }

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'exemplary':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'exceeds_threshold':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'meets_threshold':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'below_threshold':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPerformanceColor = (level: string): string => {
    switch (level) {
      case 'exemplary':
        return 'from-yellow-500 to-orange-500';
      case 'exceeds_threshold':
        return 'from-green-500 to-emerald-600';
      case 'meets_threshold':
        return 'from-blue-500 to-blue-600';
      case 'below_threshold':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getPerformanceText = (level: string): string => {
    switch (level) {
      case 'exemplary':
        return 'Exemplary';
      case 'exceeds_threshold':
        return 'Exceeds Expectations';
      case 'meets_threshold':
        return 'Meets Expectations';
      case 'below_threshold':
        return 'Needs Development';
      default:
        return 'Not Assessed';
    }
  };

  const getPerformanceBgColor = (level: string): string => {
    switch (level) {
      case 'exemplary':
        return 'bg-yellow-50 border-yellow-200';
      case 'exceeds_threshold':
        return 'bg-green-50 border-green-200';
      case 'meets_threshold':
        return 'bg-blue-50 border-blue-200';
      case 'below_threshold':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200 dark:border-gray-700';
    }
  };

  const getScorePercentage = (assessment: MetricAssessment): number => {
    const range = assessment.metric_max_score - assessment.metric_min_score;
    const normalized = assessment.score_achieved - assessment.metric_min_score;
    return (normalized / range) * 100;
  };

  const primaryMetrics = assessments.filter(a => a.performance_level !== 'below_threshold');
  const developmentMetrics = assessments.filter(a => a.performance_level === 'below_threshold');

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Performance Metrics</h3>
        </div>
        <p className="text-sm text-blue-100">
          Your response was assessed across {assessments.length} key leadership metric{assessments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {primaryMetrics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Strengths Demonstrated
          </h4>
          {primaryMetrics.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 ${getPerformanceBgColor(assessment.performance_level)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getPerformanceIcon(assessment.performance_level)}
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {assessment.metric?.name}
                    </h5>
                    <span className={`text-xs px-2 py-0.5 rounded bg-gradient-to-r ${getPerformanceColor(assessment.performance_level)} text-white font-medium`}>
                      {getPerformanceText(assessment.performance_level)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {assessment.metric?.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(assessment.score_achieved)}
                  </div>
                  <div className="text-xs text-gray-600">
                    / {assessment.metric_max_score}
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Performance Level</span>
                  <span>{Math.round(getScorePercentage(assessment))}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getScorePercentage(assessment)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${getPerformanceColor(assessment.performance_level)}`}
                  />
                </div>
              </div>

              {assessment.metric_passing_threshold && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded ${
                    assessment.passed_threshold
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {assessment.passed_threshold ? 'Passed' : 'Below'} Threshold: {assessment.metric_passing_threshold}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {developmentMetrics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Development Opportunities
          </h4>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900 mb-3">
              The following metrics indicate areas where this response could be strengthened:
            </p>
            <div className="space-y-2">
              {developmentMetrics.map((assessment, index) => (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (primaryMetrics.length + index) * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded p-3 border border-orange-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {assessment.metric?.name}
                      </h5>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-red-600">
                        {Math.round(assessment.score_achieved)} / {assessment.metric_max_score}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {assessment.metric?.description}
                  </p>
                  {assessment.metric_passing_threshold && (
                    <p className="text-xs text-red-700">
                      Score {assessment.metric_passing_threshold - assessment.score_achieved} points below threshold to demonstrate proficiency in this metric.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Continue Building Your Skills
            </h4>
            <p className="text-xs text-blue-800">
              These metrics help track your leadership development across multiple scenarios.
              Your cumulative performance will be reflected in your competency profile at the end of the simulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricFeedback;
