'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, AlertCircle } from 'lucide-react';
import { MetricsService } from '@/lib/competencies';
import type { AssessmentMetric } from '@/lib/competencies';

interface ScenarioMetricSelectorProps {
  selectedMetricIds: string[];
  onMetricsChange: (metricIds: string[]) => void;
}

const ScenarioMetricSelector: React.FC<ScenarioMetricSelectorProps> = ({
  selectedMetricIds,
  onMetricsChange
}) => {
  const [availableMetrics, setAvailableMetrics] = useState<AssessmentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const metrics = await MetricsService.getAll();
      setAvailableMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = () => {
    if (!selectedMetricId) return;

    if (selectedMetricIds.includes(selectedMetricId)) {
      alert('This metric is already selected');
      return;
    }

    onMetricsChange([...selectedMetricIds, selectedMetricId]);
    setSelectedMetricId('');
    setShowAddForm(false);
  };

  const handleRemoveMetric = (metricId: string) => {
    onMetricsChange(selectedMetricIds.filter(id => id !== metricId));
  };

  const getMetricInfo = (metricId: string): AssessmentMetric | undefined => {
    return availableMetrics.find(m => m.id === metricId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Scenario Assessment Metrics
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            Select metrics to assess for this scenario. You&apos;ll set scores for each response option.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Metric
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Metric
              </label>
              <select
                value={selectedMetricId}
                onChange={(e) => setSelectedMetricId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a metric...</option>
                {availableMetrics
                  .filter(m => !selectedMetricIds.includes(m.id))
                  .map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.name} ({metric.metric_type.replace(/_/g, ' ')})
                    </option>
                  ))}
              </select>
            </div>

            {selectedMetricId && (
              <div className="bg-white border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-700">
                  <strong>Description:</strong> {getMetricInfo(selectedMetricId)?.description || 'No description'}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  <strong>Range:</strong> {getMetricInfo(selectedMetricId)?.min_score} - {getMetricInfo(selectedMetricId)?.max_score}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAddMetric}
                disabled={!selectedMetricId}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Metric
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedMetricId('');
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMetricIds.length === 0 && !showAddForm && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No metrics selected</p>
          <p className="text-xs text-gray-500 mt-1">
            Add metrics to assess learner responses in this scenario
          </p>
        </div>
      )}

      {selectedMetricIds.length > 0 && (
        <div className="space-y-2">
          {selectedMetricIds.map((metricId) => {
            const metricInfo = getMetricInfo(metricId);
            if (!metricInfo) return null;

            return (
              <div
                key={metricId}
                className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-semibold text-gray-900">
                      {metricInfo.name}
                    </h5>
                    <span className={`text-xs px-2 py-0.5 rounded ${getMetricTypeColor(metricInfo.metric_type)}`}>
                      {metricInfo.metric_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{metricInfo.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {metricInfo.min_score} - {metricInfo.max_score} | Threshold: {metricInfo.passing_threshold}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveMetric(metricId)}
                  className="text-red-600 hover:text-red-800 p-1 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedMetricIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Next Step:</strong> For each response option, you&apos;ll set the score for these {selectedMetricIds.length} metric{selectedMetricIds.length > 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScenarioMetricSelector;
