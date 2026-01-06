import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, AlertCircle } from 'lucide-react';
import { MetricsService, AssessmentMetric } from '../../lib/competencies';
import { MetricScoreService, OptionMetricScore } from '../../lib/metricScores';

interface MetricScoreSelectorProps {
  scenarioId: string;
  optionId: string;
  onMetricsChange?: (metrics: OptionMetricScore[]) => void;
}

interface MetricScoreForm {
  metricId: string;
  scoreValue: number;
  scoreDescription: string;
  isPrimaryMetric: boolean;
}

const MetricScoreSelector: React.FC<MetricScoreSelectorProps> = ({
  scenarioId,
  optionId,
  onMetricsChange
}) => {
  const [availableMetrics, setAvailableMetrics] = useState<AssessmentMetric[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricScoreForm[]>([]);
  const [existingMetrics, setExistingMetrics] = useState<OptionMetricScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState<MetricScoreForm>({
    metricId: '',
    scoreValue: 50,
    scoreDescription: '',
    isPrimaryMetric: false
  });

  useEffect(() => {
    loadData();
  }, [scenarioId, optionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metrics, existing] = await Promise.all([
        MetricsService.getAll(),
        MetricScoreService.getOptionMetrics(scenarioId, optionId)
      ]);

      setAvailableMetrics(metrics);
      setExistingMetrics(existing);

      const forms: MetricScoreForm[] = existing.map(em => ({
        metricId: em.metric_id,
        scoreValue: em.score_value,
        scoreDescription: em.score_description || '',
        isPrimaryMetric: em.is_primary_metric
      }));
      setSelectedMetrics(forms);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = () => {
    if (!newMetric.metricId) return;

    const alreadySelected = selectedMetrics.some(m => m.metricId === newMetric.metricId);
    if (alreadySelected) {
      alert('This metric is already added');
      return;
    }

    setSelectedMetrics([...selectedMetrics, { ...newMetric }]);
    setNewMetric({
      metricId: '',
      scoreValue: 50,
      scoreDescription: '',
      isPrimaryMetric: false
    });
    setShowAddForm(false);
  };

  const handleRemoveMetric = (metricId: string) => {
    setSelectedMetrics(selectedMetrics.filter(m => m.metricId !== metricId));
  };

  const handleUpdateScore = (metricId: string, field: keyof MetricScoreForm, value: any) => {
    setSelectedMetrics(
      selectedMetrics.map(m =>
        m.metricId === metricId ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const metrics = selectedMetrics.map(m => ({
        metricId: m.metricId,
        scoreValue: m.scoreValue,
        scoreDescription: m.scoreDescription,
        isPrimaryMetric: m.isPrimaryMetric
      }));

      const success = await MetricScoreService.bulkSetOptionMetrics(
        scenarioId,
        optionId,
        metrics
      );

      if (success) {
        const updated = await MetricScoreService.getOptionMetrics(scenarioId, optionId);
        setExistingMetrics(updated);
        if (onMetricsChange) {
          onMetricsChange(updated);
        }
      }
    } catch (error) {
      console.error('Error saving metrics:', error);
    } finally {
      setSaving(false);
    }
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
      adaptability: 'bg-indigo-100 text-indigo-800',
      timing: 'bg-orange-100 text-orange-800',
      bravin_alignment: 'bg-blue-600 text-white',
      trust_impact: 'bg-emerald-600 text-white',
      ethical_decision_quality: 'bg-violet-600 text-white',
      emotional_intelligence_index: 'bg-rose-600 text-white',
      cultural_stewardship: 'bg-cyan-600 text-white',
      custom: 'bg-gray-100 text-gray-800 dark:text-gray-100'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:text-gray-100';
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Assessment Metrics & Scores
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            Select metrics and assign scores to measure competency development
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
                value={newMetric.metricId}
                onChange={(e) => setNewMetric({ ...newMetric, metricId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a metric...</option>
                {availableMetrics
                  .filter(m => !selectedMetrics.some(sm => sm.metricId === m.id))
                  .map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.name} ({metric.metric_type})
                    </option>
                  ))}
              </select>
            </div>

            {newMetric.metricId && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Score Value
                  </label>
                  <input
                    type="number"
                    value={newMetric.scoreValue}
                    onChange={(e) => setNewMetric({ ...newMetric, scoreValue: parseFloat(e.target.value) })}
                    min={getMetricInfo(newMetric.metricId)?.min_score || 0}
                    max={getMetricInfo(newMetric.metricId)?.max_score || 100}
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {getMetricInfo(newMetric.metricId)?.min_score || 0} - {getMetricInfo(newMetric.metricId)?.max_score || 100}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Score Description (Optional)
                  </label>
                  <textarea
                    value={newMetric.scoreDescription}
                    onChange={(e) => setNewMetric({ ...newMetric, scoreDescription: e.target.value })}
                    placeholder="Explain why this score applies to this response..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="primary-metric"
                    checked={newMetric.isPrimaryMetric}
                    onChange={(e) => setNewMetric({ ...newMetric, isPrimaryMetric: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="primary-metric" className="ml-2 text-xs text-gray-700">
                    Primary metric (most important for this response)
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAddMetric}
                disabled={!newMetric.metricId}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Metric
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMetric({
                    metricId: '',
                    scoreValue: 50,
                    scoreDescription: '',
                    isPrimaryMetric: false
                  });
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMetrics.length === 0 && !showAddForm && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No metrics selected</p>
          <p className="text-xs text-gray-500 mt-1">
            Add metrics to track competency development for this response
          </p>
        </div>
      )}

      {selectedMetrics.length > 0 && (
        <div className="space-y-3">
          {selectedMetrics.map((metric) => {
            const metricInfo = getMetricInfo(metric.metricId);
            if (!metricInfo) return null;

            return (
              <div
                key={metric.metricId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {metricInfo.name}
                      </h5>
                      <span className={`text-xs px-2 py-0.5 rounded ${getMetricTypeColor(metricInfo.metric_type)}`}>
                        {metricInfo.metric_type.replace('_', ' ')}
                      </span>
                      {metric.isPrimaryMetric && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{metricInfo.description}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMetric(metric.metricId)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Score
                    </label>
                    <input
                      type="number"
                      value={metric.scoreValue}
                      onChange={(e) => handleUpdateScore(metric.metricId, 'scoreValue', parseFloat(e.target.value))}
                      min={metricInfo.min_score}
                      max={metricInfo.max_score}
                      step="0.5"
                      className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${getScoreColor(metric.scoreValue, metricInfo)}`}
                    />
                    <p className="text-xs text-gray-500 mt-0.5">
                      Threshold: {metricInfo.passing_threshold}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Performance Level
                    </label>
                    <div className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50">
                      {metric.scoreValue < metricInfo.passing_threshold && (
                        <span className="text-red-600 font-medium">Below Threshold</span>
                      )}
                      {metric.scoreValue >= metricInfo.passing_threshold && metric.scoreValue < metricInfo.max_score * 0.85 && (
                        <span className="text-blue-600 font-medium">Meets Threshold</span>
                      )}
                      {metric.scoreValue >= metricInfo.max_score * 0.85 && metric.scoreValue < metricInfo.max_score * 0.95 && (
                        <span className="text-green-600 font-medium">Exceeds Threshold</span>
                      )}
                      {metric.scoreValue >= metricInfo.max_score * 0.95 && (
                        <span className="text-green-700 font-bold">Exemplary</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Explanation
                  </label>
                  <textarea
                    value={metric.scoreDescription}
                    onChange={(e) => handleUpdateScore(metric.metricId, 'scoreDescription', e.target.value)}
                    placeholder="Why does this response earn this score?"
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center pt-2 border-t">
                  <input
                    type="checkbox"
                    id={`primary-${metric.metricId}`}
                    checked={metric.isPrimaryMetric}
                    onChange={(e) => handleUpdateScore(metric.metricId, 'isPrimaryMetric', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`primary-${metric.metricId}`} className="ml-2 text-xs text-gray-600">
                    Mark as primary metric
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMetrics.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Metrics'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MetricScoreSelector;
