import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, Target, AlertTriangle } from 'lucide-react';
import { MetricScoreService, MetricAssessment } from '../../lib/metricScores';
import { MetricsService, AssessmentMetric } from '../../lib/competencies';

interface MetricsSummaryProps {
  learnerId: string;
  simulationInstanceId?: string;
}

const MetricsSummary: React.FC<MetricsSummaryProps> = ({ learnerId, simulationInstanceId }) => {
  const [assessments, setAssessments] = useState<MetricAssessment[]>([]);
  const [metrics, setMetrics] = useState<AssessmentMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [learnerId, simulationInstanceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assessmentData, metricsData] = await Promise.all([
        MetricScoreService.getLearnerMetricAssessments(learnerId, simulationInstanceId),
        MetricsService.getAll()
      ]);

      setAssessments(assessmentData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading metrics summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return null;
  }

  const metricSummaries = new Map<string, {
    metric: AssessmentMetric;
    assessments: MetricAssessment[];
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    trend: 'improving' | 'stable' | 'declining';
  }>();

  assessments.forEach(assessment => {
    const metricId = assessment.metric_id;
    const metric = metrics.find(m => m.id === metricId);

    if (!metric) return;

    if (!metricSummaries.has(metricId)) {
      metricSummaries.set(metricId, {
        metric,
        assessments: [],
        averageScore: 0,
        highestScore: 0,
        lowestScore: 100,
        passRate: 0,
        trend: 'stable'
      });
    }

    const summary = metricSummaries.get(metricId)!;
    summary.assessments.push(assessment);
  });

  metricSummaries.forEach((summary, metricId) => {
    const scores = summary.assessments.map(a => a.score_achieved);
    summary.averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    summary.highestScore = Math.max(...scores);
    summary.lowestScore = Math.min(...scores);

    const passed = summary.assessments.filter(a => a.passed_threshold).length;
    summary.passRate = (passed / summary.assessments.length) * 100;

    if (scores.length >= 2) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 5) summary.trend = 'improving';
      else if (secondAvg < firstAvg - 5) summary.trend = 'declining';
    }
  });

  const sortedMetrics = Array.from(metricSummaries.values())
    .sort((a, b) => b.averageScore - a.averageScore);

  const excellentMetrics = sortedMetrics.filter(m => m.averageScore >= 85);
  const developingMetrics = sortedMetrics.filter(m => m.averageScore < 70);
  const overallAverage = sortedMetrics.reduce((sum, m) => sum + m.averageScore, 0) / sortedMetrics.length;

  const getMetricTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      decision_quality: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      emotional_intelligence: 'bg-purple-100 text-purple-800',
      communication: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      problem_solving: 'bg-yellow-100 text-yellow-800',
      critical_thinking: 'bg-red-100 text-red-800',
      collaboration: 'bg-pink-100 text-pink-800',
      adaptability: 'bg-indigo-100 text-indigo-800',
      timing: 'bg-orange-100 text-orange-800',
      bravin_alignment: 'bg-blue-600 text-white',
      trust_impact: 'bg-emerald-600 text-white',
      ethical_decision_quality: 'bg-violet-600 text-white',
      emotional_intelligence_index: 'bg-rose-600 text-white',
      cultural_stewardship: 'bg-cyan-600 text-white',
      custom: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Assessment Metrics Performance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{sortedMetrics.length}</div>
            <div className="text-sm opacity-90">Metrics Assessed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{Math.round(overallAverage)}</div>
            <div className="text-sm opacity-90">Overall Average</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{excellentMetrics.length}</div>
            <div className="text-sm opacity-90">Excellence Areas</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{assessments.length}</div>
            <div className="text-sm opacity-90">Total Assessments</div>
          </motion.div>
        </div>
      </div>

      {excellentMetrics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Areas of Excellence
          </h3>
          <div className="space-y-3">
            {excellentMetrics.map((summary, index) => (
              <motion.div
                key={summary.metric.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{summary.metric.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${getMetricTypeColor(summary.metric.metric_type)}`}>
                        {summary.metric.metric_type.replace('_', ' ')}
                      </span>
                      {getTrendIcon(summary.trend)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{summary.metric.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(summary.averageScore)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">avg score</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">
                  <span>High: {Math.round(summary.highestScore)}</span>
                  <span>Low: {Math.round(summary.lowestScore)}</span>
                  <span>Pass Rate: {Math.round(summary.passRate)}%</span>
                  <span>Assessed: {summary.assessments.length}x</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          All Metrics Performance
        </h3>
        <div className="space-y-3">
          {sortedMetrics.map((summary, index) => (
            <motion.div
              key={summary.metric.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{summary.metric.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${getMetricTypeColor(summary.metric.metric_type)}`}>
                      {summary.metric.metric_type.replace('_', ' ')}
                    </span>
                    {getTrendIcon(summary.trend)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{summary.metric.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${
                    summary.averageScore >= 85 ? 'text-green-600' :
                    summary.averageScore >= 70 ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {Math.round(summary.averageScore)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">/ {summary.metric.max_score}</div>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">
                  <span>Performance</span>
                  <span>{Math.round((summary.averageScore / summary.metric.max_score) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(summary.averageScore / summary.metric.max_score) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.03 }}
                    className={`h-full ${
                      summary.averageScore >= 85 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                      summary.averageScore >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                <div className="flex gap-3">
                  <span>High: {Math.round(summary.highestScore)}</span>
                  <span>Low: {Math.round(summary.lowestScore)}</span>
                  <span>Pass Rate: {Math.round(summary.passRate)}%</span>
                </div>
                <span>Assessed {summary.assessments.length} time{summary.assessments.length !== 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {developingMetrics.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Development Priorities
          </h3>
          <p className="text-sm text-orange-800 mb-4">
            Focus on these areas to strengthen your overall leadership profile:
          </p>
          <div className="space-y-2">
            {developingMetrics.map((summary) => (
              <div key={summary.metric.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{summary.metric.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">Average: {Math.round(summary.averageScore)} / {summary.metric.max_score}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                    {Math.round(summary.metric.passing_threshold - summary.averageScore)} pts to threshold
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsSummary;
