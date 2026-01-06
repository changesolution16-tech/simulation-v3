'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface BravinMetric {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
}

const defaultMetrics: BravinMetric[] = [
  {
    id: 'bravin_alignment',
    name: 'BRAVIN Alignment',
    description: 'Measures alignment with Balance, Respect, Accountability, Vulnerability, Integrity, and Navigation principles',
    weight: 25,
    enabled: true
  },
  {
    id: 'trust_impact',
    name: 'Trust Impact',
    description: 'Evaluates how decisions affect trust within teams and relationships',
    weight: 20,
    enabled: true
  },
  {
    id: 'ethical_decision_quality',
    name: 'Ethical Decision Quality',
    description: 'Assesses the ethical soundness and moral reasoning in decision-making',
    weight: 20,
    enabled: true
  },
  {
    id: 'emotional_intelligence_index',
    name: 'Emotional Intelligence Index',
    description: 'Measures self-awareness, empathy, and emotional regulation',
    weight: 20,
    enabled: true
  },
  {
    id: 'cultural_stewardship',
    name: 'Cultural Stewardship',
    description: 'Evaluates contribution to organizational culture and values',
    weight: 15,
    enabled: true
  }
];

const BravinConfigEditor: React.FC = () => {
  const [metrics, setMetrics] = useState<BravinMetric[]>(defaultMetrics);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/bravin/config');
      if (response.ok) {
        const data = await response.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (error) {
      console.error('Error loading BRAVIN config:', error);
    }
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setMetrics(metrics.map(m =>
      m.id === id ? { ...m, weight: Math.max(0, Math.min(100, newWeight)) } : m
    ));
  };

  const handleEnabledChange = (id: string, enabled: boolean) => {
    setMetrics(metrics.map(m =>
      m.id === id ? { ...m, enabled } : m
    ));
  };

  const getTotalWeight = () => {
    return metrics.filter(m => m.enabled).reduce((sum, m) => sum + m.weight, 0);
  };

  const normalizeWeights = () => {
    const enabledMetrics = metrics.filter(m => m.enabled);
    if (enabledMetrics.length === 0) return;

    const equalWeight = Math.floor(100 / enabledMetrics.length);
    const remainder = 100 - (equalWeight * enabledMetrics.length);

    setMetrics(metrics.map((m, index) => {
      if (!m.enabled) return m;
      const enabledIndex = enabledMetrics.findIndex(em => em.id === m.id);
      return {
        ...m,
        weight: equalWeight + (enabledIndex === 0 ? remainder : 0)
      };
    }));
  };

  const handleSave = async () => {
    const totalWeight = getTotalWeight();
    if (totalWeight !== 100) {
      setMessage({ type: 'error', text: `Total weight must equal 100% (currently ${totalWeight}%)` });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/bravin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics })
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      setMessage({ type: 'success', text: 'BRAVIN configuration saved successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeight = getTotalWeight();
  const isValid = totalWeight === 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">BRAVIN Metrics Configuration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure assessment metrics and weights</p>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {message.text}
          </p>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Metric Weights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total must equal 100%</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            isValid
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            Total: {totalWeight}%
          </div>
        </div>

        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className={`p-4 rounded-lg border ${
                metric.enabled
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={metric.enabled}
                  onChange={(e) => handleEnabledChange(metric.id, e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{metric.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{metric.description}</p>

                  {metric.enabled && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={metric.weight}
                          onChange={(e) => handleWeightChange(metric.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={metric.weight}
                        onChange={(e) => handleWeightChange(metric.id, parseInt(e.target.value))}
                        className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={normalizeWeights}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Distribute Evenly
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !isValid}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">About BRAVIN Metrics</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          BRAVIN metrics provide a comprehensive assessment framework for evaluating soft skills and leadership competencies.
          Each metric weight determines its contribution to the overall score. Ensure weights total 100% for accurate assessment.
        </p>
      </div>
    </div>
  );
};

export default BravinConfigEditor;
