import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertCircle, Settings, Zap, BookOpen, Info, Trash2 } from 'lucide-react';
import { MetricsService, AssessmentMetric } from '../../lib/competencies';
import { CompetencyService, Competency } from '../../lib/competencies';
import {
  MetricCompetencyMappingService,
  SimulationMetricCompetencyMapping,
  CalculationAlgorithm,
  CalculationMethod,
  MappingTemplate
} from '../../lib/metricCompetencyMapping';

interface MetricCompetencyMappingManagerProps {
  simulationId: string;
  onMappingsChanged?: () => void;
}

const MetricCompetencyMappingManager: React.FC<MetricCompetencyMappingManagerProps> = ({
  simulationId,
  onMappingsChanged
}) => {
  const [metrics, setMetrics] = useState<AssessmentMetric[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [algorithms, setAlgorithms] = useState<CalculationAlgorithm[]>([]);
  const [mappings, setMappings] = useState<SimulationMetricCompetencyMapping[]>([]);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<CalculationMethod>('linear');
  const [mappingWeight, setMappingWeight] = useState<number>(1.0);
  const [editingMapping, setEditingMapping] = useState<SimulationMetricCompetencyMapping | null>(null);

  useEffect(() => {
    loadData();
  }, [simulationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, competenciesData, algorithmsData, mappingsData, templatesData] = await Promise.all([
        MetricsService.getAll(),
        CompetencyService.getAll(),
        MetricCompetencyMappingService.getCalculationAlgorithms(),
        MetricCompetencyMappingService.getSimulationMappings(simulationId),
        MetricCompetencyMappingService.getPublicTemplates()
      ]);

      setMetrics(metricsData);
      setCompetencies(competenciesData.filter(c => c.competency_level === 2));
      setAlgorithms(algorithmsData);
      setMappings(mappingsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading mapping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedMetric || !selectedCompetency) return;

    const existingMapping = mappings.find(
      m => m.metric_id === selectedMetric && m.competency_id === selectedCompetency
    );

    if (existingMapping) {
      alert('This mapping already exists. Each metric can only be mapped to a competency once per simulation.');
      return;
    }

    setSaving(true);
    try {
      const newMapping = await MetricCompetencyMappingService.createMapping({
        simulation_id: simulationId,
        metric_id: selectedMetric,
        competency_id: selectedCompetency,
        calculation_method: selectedMethod,
        mapping_weight: mappingWeight,
        algorithm_config: MetricCompetencyMappingService.getDefaultAlgorithmConfig(selectedMethod),
        score_conversion_rules: MetricCompetencyMappingService.getDefaultConversionRules(selectedMethod)
      });

      if (newMapping) {
        await loadData();
        setShowAddModal(false);
        setSelectedMetric('');
        setSelectedCompetency('');
        setSelectedMethod('linear');
        setMappingWeight(1.0);
        onMappingsChanged?.();
      } else {
        alert('Failed to create mapping. This combination may already exist or there was a database error.');
      }
    } catch (error) {
      console.error('Error creating mapping:', error);
      alert('Failed to create mapping. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMapping = async (mapping: SimulationMetricCompetencyMapping) => {
    setSaving(true);
    try {
      const success = await MetricCompetencyMappingService.updateMapping(mapping.id, mapping);
      if (success) {
        await loadData();
        setEditingMapping(null);
        onMappingsChanged?.();
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    setSaving(true);
    try {
      const success = await MetricCompetencyMappingService.deleteMapping(id);
      if (success) {
        await loadData();
        onMappingsChanged?.();
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    setSaving(true);
    try {
      const success = await MetricCompetencyMappingService.applyTemplate(
        templateId,
        simulationId,
        metrics,
        competencies
      );
      if (success) {
        await loadData();
        setShowTemplateModal(false);
        onMappingsChanged?.();
      }
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setSaving(false);
    }
  };

  const getMetricById = (id: string) => metrics.find(m => m.id === id);
  const getCompetencyById = (id: string) => competencies.find(c => c.id === id);
  const getAlgorithmByCode = (code: string) => algorithms.find(a => a.code === code);

  const getMethodColor = (method: CalculationMethod): string => {
    const colors: Record<CalculationMethod, string> = {
      linear: 'bg-blue-100 text-blue-800',
      threshold_based: 'bg-green-100 text-green-800',
      exponential_growth: 'bg-purple-100 text-purple-800',
      compensatory: 'bg-yellow-100 text-yellow-800',
      conjunctive: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800 dark:text-gray-100'
    };
    return colors[method];
  };

  const getMethodIcon = (method: CalculationMethod) => {
    const icons: Record<CalculationMethod, JSX.Element> = {
      linear: <Zap className="w-3 h-3" />,
      threshold_based: <Settings className="w-3 h-3" />,
      exponential_growth: <AlertCircle className="w-3 h-3" />,
      compensatory: <Plus className="w-3 h-3" />,
      conjunctive: <X className="w-3 h-3" />,
      custom: <BookOpen className="w-3 h-3" />
    };
    return icons[method];
  };

  const unmappedMetrics = metrics.filter(
    m => !mappings.some(map => map.metric_id === m.id)
  );

  const unmappedCompetencies = competencies.filter(
    c => !mappings.some(map => map.competency_id === c.id)
  );

  const mappingCoverage = {
    metrics: metrics.length > 0 ? ((metrics.length - unmappedMetrics.length) / metrics.length) * 100 : 0,
    competencies: competencies.length > 0 ? ((competencies.length - unmappedCompetencies.length) / competencies.length) * 100 : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Metric-to-Competency Mappings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Define how assessment metric scores automatically calculate competency impacts
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Load Template
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Mapping
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Metrics Coverage</span>
              <span className="text-lg font-bold text-blue-600">{Math.round(mappingCoverage.metrics)}%</span>
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
              <span className="text-lg font-bold text-green-600">{Math.round(mappingCoverage.competencies)}%</span>
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
                  {unmappedMetrics.length} metric{unmappedMetrics.length !== 1 ? 's' : ''} not mapped to any competencies.
                  These metrics will be tracked but won't contribute to competency development.
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
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Settings className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Mappings Configured</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Configure how metric scores automatically calculate competency impacts. Load a template or create mappings manually.
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
            {mappings.map((mapping) => {
              const metric = getMetricById(mapping.metric_id);
              const competency = getCompetencyById(mapping.competency_id);
              const algorithm = getAlgorithmByCode(mapping.calculation_method);

              if (!metric || !competency) return null;

              return (
                <div
                  key={mapping.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{metric.name}</span>
                            <span className="text-gray-400 dark:text-gray-500">→</span>
                            <span className="text-sm font-semibold text-blue-600">{competency.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${getMethodColor(mapping.calculation_method)}`}>
                              {getMethodIcon(mapping.calculation_method)}
                              {mapping.calculation_method.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-600">
                              Weight: {(mapping.mapping_weight * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs text-gray-600">
                              Normalization: {mapping.normalization_method}
                            </span>
                            {mapping.is_inherited && (
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                From Template
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {algorithm && (
                        <div className="bg-gray-50 rounded p-3 text-xs">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-gray-700 font-medium mb-1">{algorithm.description}</p>
                              <p className="text-gray-600">Best for: {algorithm.best_for.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {mapping.configuration_notes && (
                        <p className="text-xs text-gray-600 italic">{mapping.configuration_notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setEditingMapping(mapping)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit mapping"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        disabled={saving}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Delete mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                  onChange={(e) => setSelectedMetric(e.target.value)}
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
                  onChange={(e) => setSelectedCompetency(e.target.value)}
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

              {selectedMetric && selectedCompetency && mappings.find(
                m => m.metric_id === selectedMetric && m.competency_id === selectedCompetency
              ) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Mapping Already Exists</p>
                      <p>This metric-competency combination is already mapped. Please select a different combination.</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as CalculationMethod)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  {algorithms.map(alg => (
                    <option key={alg.code} value={alg.code}>
                      {alg.name}
                    </option>
                  ))}
                </select>
                {algorithms.find(a => a.code === selectedMethod) && (
                  <p className="text-xs text-gray-600 mt-2">
                    {algorithms.find(a => a.code === selectedMethod)?.description}
                  </p>
                )}
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
                  onChange={(e) => setMappingWeight(parseFloat(e.target.value))}
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
                disabled={!selectedMetric || !selectedCompetency || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
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
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {template.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{template.mappings.length} mappings</span>
                            <span>Used {template.times_used} times</span>
                            {template.industry_standard && (
                              <span className="text-blue-600">Based on: {template.industry_standard}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={saving}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving ? (
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
