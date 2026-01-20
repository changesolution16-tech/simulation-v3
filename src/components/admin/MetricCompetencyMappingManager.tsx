'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Info,
  Plus,
  Settings,
  Trash2,
  X,
  Zap
} from 'lucide-react';

interface AssessmentMetric {
  id: string;
  name: string;
  metric_type: string;
}

interface Competency {
  id: string;
  code: string;
  name: string;
  competency_level: number;
}

interface CalculationAlgorithm {
  id: string;
  code: string;
  name: string;
  description?: string;
  best_for?: string[];
}

interface MappingTemplate {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  mappings: Array<{
    metric_id?: string;
    metric_type?: string;
    competency_id?: string;
    competency_code?: string;
    calculation_method: string;
    mapping_weight: number;
    algorithm_config?: Record<string, unknown>;
    score_conversion_rules?: Record<string, unknown>;
    normalization_method?: string;
  }>;
  industry_standard?: string;
  times_used: number;
  is_public: boolean;
  is_active: boolean;
}

interface SimulationMetricCompetencyMapping {
  id: string;
  simulation_id: string;
  metric_id: string;
  competency_id: string;
  algorithm_id?: string;
  calculation_method: string;
  mapping_weight: number;
  algorithm_config?: Record<string, unknown>;
  score_conversion_rules?: Record<string, unknown>;
  normalization_method?: string;
  is_inherited?: boolean;
  template_id?: string;
  configuration_notes?: string;
  is_active: boolean;
  metric?: AssessmentMetric;
  competency?: Competency;
}

interface MetricCompetencyMappingManagerProps {
  simulationId: string;
}

const FALLBACK_METHODS = [
  { value: 'weighted', label: 'Weighted' },
  { value: 'linear', label: 'Linear' },
  { value: 'threshold_based', label: 'Threshold' },
  { value: 'exponential_growth', label: 'Exponential Growth' },
  { value: 'compensatory', label: 'Compensatory' },
  { value: 'conjunctive', label: 'Conjunctive' },
  { value: 'custom', label: 'Custom' }
];

const NORMALIZATION_METHODS = [
  { value: 'weighted_average', label: 'Weighted Average' },
  { value: 'average', label: 'Average' },
  { value: 'sum', label: 'Sum' },
  { value: 'max', label: 'Max' },
  { value: 'min', label: 'Min' }
];

const MetricCompetencyMappingManager: React.FC<MetricCompetencyMappingManagerProps> = ({
  simulationId
}) => {
  const [metrics, setMetrics] = useState<AssessmentMetric[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [algorithms, setAlgorithms] = useState<CalculationAlgorithm[]>([]);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [mappings, setMappings] = useState<SimulationMetricCompetencyMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('linear');
  const [selectedNormalization, setSelectedNormalization] = useState('weighted_average');
  const [mappingWeight, setMappingWeight] = useState(1.0);

  useEffect(() => {
    loadData();
  }, [simulationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, competenciesRes, mappingsRes, algorithmsRes, templatesRes] =
        await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/competencies'),
          fetch(`/api/mappings?simulationId=${simulationId}`),
          fetch('/api/mappings/algorithms'),
          fetch('/api/mappings/templates?publicOnly=true')
        ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      if (competenciesRes.ok) {
        const data = await competenciesRes.json();
        setCompetencies((data || []).filter((c: Competency) => c.competency_level === 2));
      }
      if (mappingsRes.ok) {
        setMappings(await mappingsRes.json());
      }
      if (algorithmsRes.ok) {
        const data = await algorithmsRes.json();
        setAlgorithms(data || []);
        if (data?.length && !data.find((alg: CalculationAlgorithm) => alg.code === selectedMethod)) {
          setSelectedMethod(data[0].code);
        }
      }
      if (templatesRes.ok) {
        setTemplates(await templatesRes.json());
      }
    } catch (error) {
      console.error('Error loading metric mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const mappedPairs = useMemo(() => {
    return new Set(mappings.map(m => `${m.metric_id}:${m.competency_id}`));
  }, [mappings]);

  const unmappedMetrics = useMemo(
    () => metrics.filter(metric => !mappings.some(map => map.metric_id === metric.id)),
    [metrics, mappings]
  );

  const unmappedCompetencies = useMemo(
    () => competencies.filter(comp => !mappings.some(map => map.competency_id === comp.id)),
    [competencies, mappings]
  );

  const mappingCoverage = useMemo(() => {
    return {
      metrics: metrics.length > 0 ? ((metrics.length - unmappedMetrics.length) / metrics.length) * 100 : 0,
      competencies:
        competencies.length > 0
          ? ((competencies.length - unmappedCompetencies.length) / competencies.length) * 100
          : 0
    };
  }, [metrics.length, competencies.length, unmappedMetrics.length, unmappedCompetencies.length]);

  const getMethodOptions = (currentMethod?: string) => {
    const algorithmOptions = algorithms.map(alg => ({ value: alg.code, label: alg.name }));
    const options = algorithmOptions.length > 0 ? algorithmOptions : FALLBACK_METHODS;
    if (currentMethod && !options.some(option => option.value === currentMethod)) {
      return [...options, { value: currentMethod, label: currentMethod }];
    }
    return options;
  };

  const getAlgorithmForMapping = (mapping: SimulationMetricCompetencyMapping) => {
    if (mapping.algorithm_id) {
      return algorithms.find(alg => alg.id === mapping.algorithm_id);
    }
    return algorithms.find(alg => alg.code === mapping.calculation_method);
  };

  const getMethodBadgeColor = (method: string): string => {
    const colors: Record<string, string> = {
      linear: 'bg-blue-100 text-blue-800',
      threshold_based: 'bg-green-100 text-green-800',
      exponential_growth: 'bg-purple-100 text-purple-800',
      compensatory: 'bg-yellow-100 text-yellow-800',
      conjunctive: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800 dark:text-gray-100',
      weighted: 'bg-indigo-100 text-indigo-800'
    };

    return colors[method] || 'bg-gray-100 text-gray-800 dark:text-gray-100';
  };

  const getDefaultConversionRules = (method: string) => {
    switch (method) {
      case 'linear':
        return { baseline_score: 50, scale_factor: 0.1 };
      case 'threshold_based':
        return {
          thresholds: {
            below_threshold: { max: 69, impact: -5, level: 'Below Proficiency' },
            meets_threshold: { min: 70, max: 84, impact: 0, level: 'Developing' },
            exceeds_threshold: { min: 85, max: 94, impact: 5, level: 'Proficient' },
            exemplary: { min: 95, impact: 10, level: 'Advanced' }
          }
        };
      case 'exponential_growth':
        return { baseline_score: 85, scale_factor: 10 };
      default:
        return {};
    }
  };

  const getDefaultAlgorithmConfig = (method: string) => {
    switch (method) {
      case 'exponential_growth':
        return { excellence_threshold: 85, growth_rate: 10 };
      case 'compensatory':
        return { metric_group: [], minimum_aggregate: 210 };
      case 'conjunctive':
        return { minimum_thresholds: {}, failure_penalty: -10 };
      default:
        return {};
    }
  };

  const handleAddMapping = async () => {
    if (!selectedMetric || !selectedCompetency) return;

    if (mappedPairs.has(`${selectedMetric}:${selectedCompetency}`)) {
      alert('This metric and competency are already mapped.');
      return;
    }

    setSavingId('new');
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_id: simulationId,
          metric_id: selectedMetric,
          competency_id: selectedCompetency,
          calculation_method: selectedMethod,
          mapping_weight: mappingWeight,
          normalization_method: selectedNormalization,
          algorithm_config: getDefaultAlgorithmConfig(selectedMethod),
          score_conversion_rules: getDefaultConversionRules(selectedMethod)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create mapping');
      }

      setShowAddModal(false);
      setSelectedMetric('');
      setSelectedCompetency('');
      setSelectedMethod('linear');
      setSelectedNormalization('weighted_average');
      setMappingWeight(1.0);
      await loadData();
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      alert(error.message || 'Failed to create mapping');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateMapping = async (
    mapping: SimulationMetricCompetencyMapping,
    updates: Partial<SimulationMetricCompetencyMapping>
  ) => {
    setSavingId(mapping.id);
    try {
      const response = await fetch(`/api/mappings/${mapping.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update mapping');
      }

      await loadData();
    } catch (error: any) {
      console.error('Error updating mapping:', error);
      alert(error.message || 'Failed to update mapping');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('Delete this mapping?')) return;

    setSavingId(mappingId);
    try {
      const response = await fetch(`/api/mappings/${mappingId}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete mapping');
      }
      await loadData();
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      alert(error.message || 'Failed to delete mapping');
    } finally {
      setSavingId(null);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    setSavingTemplate(true);
    try {
      const response = await fetch('/api/mappings/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          simulation_id: simulationId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply template');
      }

      await loadData();
      setShowTemplateModal(false);
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setSavingTemplate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Metric-Competency Mappings
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              Map assessment metrics to competencies for auto-calculated impacts.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Load Template
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Mapping
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Metrics Coverage</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(mappingCoverage.metrics)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${mappingCoverage.metrics}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.length - unmappedMetrics.length} of {metrics.length} metrics mapped
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Competencies Coverage</span>
              <span className="text-lg font-bold text-green-600">
                {Math.round(mappingCoverage.competencies)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${mappingCoverage.competencies}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {competencies.length - unmappedCompetencies.length} of {competencies.length} competencies mapped
            </p>
          </div>
        </div>

        {unmappedMetrics.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900">Unmapped Metrics</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  {unmappedMetrics.length} metric{unmappedMetrics.length !== 1 ? 's' : ''} not mapped to any
                  competencies.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {unmappedMetrics.slice(0, 5).map(metric => (
                    <span key={metric.id} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {metric.name}
                    </span>
                  ))}
                  {unmappedMetrics.length > 5 && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      +{unmappedMetrics.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {mappings.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Settings className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No Mappings Configured</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Load a template or create mappings manually to define how metrics affect competencies.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Load Template
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create First Mapping
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {mappings.map(mapping => {
              const algorithm = getAlgorithmForMapping(mapping);
              return (
                <div
                  key={mapping.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {mapping.metric?.name || 'Metric'} → {mapping.competency?.name || 'Competency'}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${getMethodBadgeColor(
                            mapping.calculation_method
                          )}`}
                        >
                          <Zap className="w-3 h-3" />
                          {mapping.calculation_method.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600">
                          Weight: {(mapping.mapping_weight * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-600">
                          Normalization: {mapping.normalization_method || 'weighted_average'}
                        </span>
                        {mapping.is_inherited && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            From Template
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="text-xs text-gray-600">
                          Method
                          <select
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={mapping.calculation_method}
                            onChange={e =>
                              handleUpdateMapping(mapping, { calculation_method: e.target.value })
                            }
                            disabled={savingId === mapping.id}
                          >
                            {getMethodOptions(mapping.calculation_method).map(method => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-gray-600">
                          Weight
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={mapping.mapping_weight}
                            onChange={e =>
                              handleUpdateMapping(mapping, {
                                mapping_weight: parseFloat(e.target.value) || 0
                              })
                            }
                            disabled={savingId === mapping.id}
                          />
                        </label>
                        <label className="text-xs text-gray-600">
                          Normalization
                          <select
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={mapping.normalization_method || 'weighted_average'}
                            onChange={e =>
                              handleUpdateMapping(mapping, { normalization_method: e.target.value })
                            }
                            disabled={savingId === mapping.id}
                          >
                            {NORMALIZATION_METHODS.map(method => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {algorithm && (
                        <div className="bg-gray-50 rounded p-3 text-xs mt-3">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-gray-700 font-medium mb-1">{algorithm.description}</p>
                              {algorithm.best_for?.length ? (
                                <p className="text-gray-600">
                                  Best for: {algorithm.best_for.join(', ')}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}
                      {mapping.configuration_notes && (
                        <p className="text-xs text-gray-600 italic mt-2">
                          {mapping.configuration_notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMapping(mapping.id)}
                      className="text-gray-400 hover:text-red-600"
                      disabled={savingId === mapping.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Add Metric-Competency Mapping</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Metric</label>
                <select
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a metric...</option>
                  {metrics.map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.name} ({metric.metric_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Competency</label>
                <select
                  value={selectedCompetency}
                  onChange={e => setSelectedCompetency(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a competency...</option>
                  {competencies.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.code} - {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMetric &&
                selectedCompetency &&
                mappings.find(
                  map => map.metric_id === selectedMetric && map.competency_id === selectedCompetency
                ) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Mapping Already Exists</p>
                        <p>This metric-competency combination is already mapped.</p>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
                <select
                  value={selectedMethod}
                  onChange={e => setSelectedMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  {getMethodOptions(selectedMethod).map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                {algorithms.find(a => a.code === selectedMethod)?.description && (
                  <p className="text-xs text-gray-600 mt-2">
                    {algorithms.find(a => a.code === selectedMethod)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Normalization Method</label>
                <select
                  value={selectedNormalization}
                  onChange={e => setSelectedNormalization(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  {NORMALIZATION_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mapping Weight: {(mappingWeight * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={mappingWeight}
                  onChange={e => setMappingWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0% (No Impact)</span>
                  <span>100% (Full Impact)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMapping}
                disabled={!selectedMetric || !selectedCompetency || savingId === 'new'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingId === 'new' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create Mapping
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Load Mapping Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600">No public templates available</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {template.tags?.map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{template.mappings?.length || 0} mappings</span>
                            <span>Used {template.times_used} times</span>
                            {template.industry_standard && (
                              <span className="text-blue-600">Based on: {template.industry_standard}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={savingTemplate}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingTemplate ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4" />
                              Apply
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricCompetencyMappingManager;
