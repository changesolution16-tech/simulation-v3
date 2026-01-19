'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import type { AssessmentMetric } from '@/lib/competencies';

export interface OptionMetricScoreData {
  metricId: string;
  scoreValue: number;
  scoreDescription: string;
  isPrimaryMetric: boolean;
}

interface OptionMetricScoreInputProps {
  metricIds: string[];
  scores: OptionMetricScoreData[];
  onChange: (scores: OptionMetricScoreData[]) => void;
  optionLetter: string;
}

const OptionMetricScoreInput: React.FC<OptionMetricScoreInputProps> = ({
  metricIds,
  scores,
  onChange,
  optionLetter
}) => {
  const [availableMetrics, setAvailableMetrics] = useState<AssessmentMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (loading || metricIds.length === 0) return;

    const existingMetricIds = scores.map(s => s.metricId);
    const missingMetricIds = metricIds.filter(id => !existingMetricIds.includes(id));

    if (missingMetricIds.length > 0) {
      console.log(`[OptionMetricScoreInput] Auto-creating scores for ${missingMetricIds.length} missing metrics in option ${optionLetter}`);
      const newScores = missingMetricIds.map(metricId => ({
        metricId,
        scoreValue: 50,
        scoreDescription: '',
        isPrimaryMetric: false
      }));
      onChange([...scores, ...newScores]);
    }
  }, [metricIds, loading, scores, onChange, optionLetter]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }
      const metrics = await response.json();
      setAvailableMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricInfo = (metricId: string): AssessmentMetric | undefined => {
    return availableMetrics.find(m => m.id === metricId);
  };

  const updateScore = (metricId: string, field: keyof OptionMetricScoreData, value: any) => {
    const updatedScores = scores.map(s =>
      s.metricId === metricId ? { ...s, [field]: value } : s
    );
    onChange(updatedScores);
  };

  const getMetricTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      decision_quality: 'bg-blue-100 text-blue-800',
      emotional_intelligence: 'bg-purple-100 text-purple-800',
      communication: 'bg-green-100 text-green-800',
      problem_solving: 'bg-yellow-100 text-yellow-800',
      critical_thinking: 'bg-red-100 text-red-800',
      collaboration: 'bg-pink-100 text-pink-800',
      adaptability: 'bg-cyan-100 text-cyan-800',
      timing: 'bg-orange-100 text-orange-800',
      bravin_alignment: 'bg-blue-600 text-white',
      trust_impact: 'bg-emerald-600 text-white',
      ethical_decision_quality: 'bg-violet-600 text-white',
      emotional_intelligence_index: 'bg-rose-600 text-white',
      cultural_stewardship: 'bg-teal-600 text-white',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number, metric?: AssessmentMetric): string => {
    if (!metric) return 'text-gray-600';

    const threshold = metric.passing_threshold || 70;
    const max = metric.max_score || 100;

    if (score < threshold) return 'text-red-600';
    if (score >= max * 0.9) return 'text-green-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (metricIds.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
        <p className="text-xs text-gray-600">No metrics selected for this scenario</p>
        <p className="text-xs text-gray-500 mt-1">
          Go to the Questions tab to add metrics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Metric Scores for Option {optionLetter}
        </h4>
        <p className="text-xs text-gray-600 mt-1">
          Set the score this response earns for each metric
        </p>
      </div>

      {metricIds.map((metricId) => {
        const metricInfo = getMetricInfo(metricId);
        const scoreData = scores.find(s => s.metricId === metricId);

        if (!metricInfo) {
          console.warn(`[OptionMetricScoreInput] Metric info not found for ${metricId} in option ${optionLetter}`);
          return null;
        }

        if (!scoreData) {
          console.warn(`[OptionMetricScoreInput] Score data not found for metric ${metricId} in option ${optionLetter}`);
          return null;
        }

        return (
          <div
            key={metricId}
            className="border border-gray-200 rounded-lg p-4 bg-white space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    {metricInfo.name}
                  </h5>
                  <span className={`text-xs px-2 py-0.5 rounded ${getMetricTypeColor(metricInfo.metric_type)}`}>
                    {metricInfo.metric_type.replace(/_/g, ' ')}
                  </span>
                  {scoreData.isPrimaryMetric && (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{metricInfo.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Score *
                </label>
                <input
                  type="number"
                  value={scoreData.scoreValue}
                  onChange={(e) => updateScore(metricId, 'scoreValue', parseFloat(e.target.value) || 0)}
                  min={metricInfo.min_score}
                  max={metricInfo.max_score}
                  step="0.5"
                  className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${getScoreColor(scoreData.scoreValue, metricInfo)}`}
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Range: {metricInfo.min_score} - {metricInfo.max_score} | Threshold: {metricInfo.passing_threshold}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Performance Level
                </label>
                <div className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-50">
                  {scoreData.scoreValue < metricInfo.passing_threshold && (
                    <span className="text-red-600 font-medium">Below Threshold</span>
                  )}
                  {scoreData.scoreValue >= metricInfo.passing_threshold && scoreData.scoreValue < metricInfo.max_score * 0.85 && (
                    <span className="text-blue-600 font-medium">Meets Threshold</span>
                  )}
                  {scoreData.scoreValue >= metricInfo.max_score * 0.85 && scoreData.scoreValue < metricInfo.max_score * 0.95 && (
                    <span className="text-green-600 font-medium">Exceeds Threshold</span>
                  )}
                  {scoreData.scoreValue >= metricInfo.max_score * 0.95 && (
                    <span className="text-green-700 font-bold">Exemplary</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Score Explanation (Optional)
              </label>
              <textarea
                value={scoreData.scoreDescription}
                onChange={(e) => updateScore(metricId, 'scoreDescription', e.target.value)}
                placeholder="Why does this response earn this score?"
                rows={2}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center pt-2 border-t">
              <input
                type="checkbox"
                id={`primary-${metricId}`}
                checked={scoreData.isPrimaryMetric}
                onChange={(e) => updateScore(metricId, 'isPrimaryMetric', e.target.checked)}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`primary-${metricId}`} className="ml-2 text-xs text-gray-600">
                Mark as primary metric for this response
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OptionMetricScoreInput;
