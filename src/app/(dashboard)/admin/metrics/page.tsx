'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Target, BarChart3 } from 'lucide-react';

type MetricType =
  | 'decision_quality'
  | 'timing'
  | 'critical_thinking'
  | 'emotional_intelligence'
  | 'communication'
  | 'problem_solving'
  | 'adaptability'
  | 'collaboration'
  | 'bravin_alignment'
  | 'trust_impact'
  | 'ethical_decision_quality'
  | 'emotional_intelligence_index'
  | 'cultural_stewardship'
  | 'custom';

type MeasurementMethod =
  | 'automatic'
  | 'rubric'
  | 'observation'
  | 'self_assessment'
  | 'peer_assessment';

interface AssessmentMetric {
  id: string;
  name: string;
  description?: string;
  metric_type: MetricType;
  measurement_method: MeasurementMethod;
  min_score: number;
  max_score: number;
  passing_threshold: number;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

const METRIC_TYPES: { value: MetricType; label: string; description: string }[] = [
  { value: 'decision_quality', label: 'Decision Quality', description: 'Measures the quality and appropriateness of choices made' },
  { value: 'timing', label: 'Timing', description: 'Evaluates response speed and decision-making pace' },
  { value: 'critical_thinking', label: 'Critical Thinking', description: 'Assesses analytical and evaluative thinking skills' },
  { value: 'emotional_intelligence', label: 'Emotional Intelligence', description: 'Tracks awareness and management of emotions' },
  { value: 'communication', label: 'Communication', description: 'Evaluates clarity and effectiveness of communication' },
  { value: 'problem_solving', label: 'Problem Solving', description: 'Measures ability to identify and resolve problems' },
  { value: 'adaptability', label: 'Adaptability', description: 'Assesses flexibility and response to change' },
  { value: 'collaboration', label: 'Collaboration', description: 'Evaluates teamwork and cooperative skills' },
  { value: 'bravin_alignment', label: 'BRAVIN Alignment Score', description: 'Consistency of actions reflecting JMMB leadership values' },
  { value: 'trust_impact', label: 'Trust Impact Rating', description: 'Effect on team trust and psychological safety' },
  { value: 'ethical_decision_quality', label: 'Ethical Decision Quality', description: 'Balance of performance with values under pressure' },
  { value: 'emotional_intelligence_index', label: 'Emotional Intelligence Index', description: 'Recognition of emotions and empathetic response' },
  { value: 'cultural_stewardship', label: 'Cultural Stewardship Score', description: 'Active protection and shaping of organizational culture' },
  { value: 'custom', label: 'Custom', description: 'Define your own custom assessment metric' }
];

const MEASUREMENT_METHODS: { value: MeasurementMethod; label: string }[] = [
  { value: 'automatic', label: 'Automatic (System Calculated)' },
  { value: 'rubric', label: 'Rubric-Based Assessment' },
  { value: 'observation', label: 'Instructor Observation' },
  { value: 'self_assessment', label: 'Learner Self-Assessment' },
  { value: 'peer_assessment', label: 'Peer Assessment' }
];

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<AssessmentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<AssessmentMetric | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<AssessmentMetric>) => {
    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowCreateModal(false);
        loadMetrics();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create metric');
      }
    } catch (error) {
      console.error('Error creating metric:', error);
      alert('Failed to create metric');
    }
  };

  const handleUpdate = async (id: string, data: Partial<AssessmentMetric>) => {
    try {
      const response = await fetch(`/api/metrics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setEditingMetric(null);
        loadMetrics();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update metric');
      }
    } catch (error) {
      console.error('Error updating metric:', error);
      alert('Failed to update metric');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;

    try {
      const response = await fetch(`/api/metrics/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadMetrics();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete metric');
      }
    } catch (error) {
      console.error('Error deleting metric:', error);
      alert('Failed to delete metric');
    }
  };

  const getMetricTypeLabel = (type: MetricType) => {
    return METRIC_TYPES.find(mt => mt.value === type)?.label || type;
  };

  const getMetricTypeColor = (type: MetricType) => {
    const colors: Record<MetricType, string> = {
      decision_quality: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      timing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      critical_thinking: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      emotional_intelligence: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      communication: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      problem_solving: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      adaptability: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      collaboration: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      bravin_alignment: 'bg-blue-600 text-white',
      trust_impact: 'bg-emerald-600 text-white',
      ethical_decision_quality: 'bg-violet-600 text-white',
      emotional_intelligence_index: 'bg-rose-600 text-white',
      cultural_stewardship: 'bg-cyan-600 text-white',
      custom: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[type] || colors.custom;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assessment Metrics</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Define and configure the metrics used to assess learner performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Metric
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Metrics</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Global Metrics</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.filter(m => m.is_global).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Automatic</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {metrics.filter(m => m.measurement_method === 'automatic').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Rubric-Based</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.filter(m => m.measurement_method === 'rubric').length}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No metrics defined yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Create your first metric
            </button>
          </div>
        ) : (
          metrics.map((metric) => (
            <div
              key={metric.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{metric.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${getMetricTypeColor(metric.metric_type)}`}>
                      {getMetricTypeLabel(metric.metric_type)}
                    </span>
                    {metric.is_global && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                        Global
                      </span>
                    )}
                  </div>
                  {metric.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{metric.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Method:</span>
                      <span className="text-gray-900 dark:text-gray-100 capitalize">
                        {metric.measurement_method?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Score Range:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {metric.min_score} - {metric.max_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Passing:</span>
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        {metric.passing_threshold}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingMetric(metric)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit metric"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(metric.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete metric"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {(showCreateModal || editingMetric) && (
        <MetricModal
          metric={editingMetric}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMetric(null);
          }}
          onSubmit={(data) => {
            if (editingMetric) {
              handleUpdate(editingMetric.id, data);
            } else {
              handleCreate(data);
            }
          }}
        />
      )}
    </div>
  );
}

interface MetricModalProps {
  metric: AssessmentMetric | null;
  onClose: () => void;
  onSubmit: (data: Partial<AssessmentMetric>) => void;
}

function MetricModal({ metric, onClose, onSubmit }: MetricModalProps) {
  const [formData, setFormData] = useState<Partial<AssessmentMetric>>({
    name: metric?.name || '',
    description: metric?.description || '',
    metric_type: metric?.metric_type || 'decision_quality',
    measurement_method: metric?.measurement_method || 'automatic',
    min_score: metric?.min_score ?? 0,
    max_score: metric?.max_score ?? 100,
    passing_threshold: metric?.passing_threshold ?? 70,
    is_global: metric?.is_global ?? false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.metric_type) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {metric ? 'Edit Metric' : 'Create New Metric'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metric Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Decision Quality Score"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this metric measures..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metric Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.metric_type}
              onChange={(e) => setFormData({ ...formData, metric_type: e.target.value as MetricType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {METRIC_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Measurement Method
            </label>
            <select
              value={formData.measurement_method}
              onChange={(e) => setFormData({ ...formData, measurement_method: e.target.value as MeasurementMethod })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {MEASUREMENT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Score
              </label>
              <input
                type="number"
                value={formData.min_score}
                onChange={(e) => setFormData({ ...formData, min_score: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Score
              </label>
              <input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passing Threshold
              </label>
              <input
                type="number"
                value={formData.passing_threshold}
                onChange={(e) => setFormData({ ...formData, passing_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_global"
              checked={formData.is_global}
              onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_global" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Apply globally to all simulations
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {metric ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
