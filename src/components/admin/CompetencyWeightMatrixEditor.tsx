'use client';

import React, { useState, useEffect } from 'react';
import { Info, RotateCcw, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { CompetencyCalculationService } from '@/lib/competencyCalculation';

interface CompetencyWeightMatrixEditorProps {
  scenarioId?: string;
  simulationId?: string;
  onWeightsChange?: (weights: Record<string, Record<string, number>>) => void;
  readOnly?: boolean;
  showInheritanceInfo?: boolean;
}

const TARGET_COMPETENCIES = [
  { code: 'TBR-03', name: 'Trust Building & Repair', description: 'Building and repairing professional trust' },
  { code: 'AC-06', name: 'Adaptive Communication', description: 'Adjusting communication style by context' },
  { code: 'EI-02', name: 'Emotional Intelligence', description: 'Managing emotions in self and others' },
  { code: 'EL-05', name: 'Ethical Leadership', description: 'Leading with integrity and ethics' },
  { code: 'VBD-01', name: 'Values-Based Decision-Making', description: 'Aligning decisions with values' }
];

const METRIC_TYPES = [
  { key: 'bravin_alignment', label: 'BRAVIN Alignment', description: '0-10 scale' },
  { key: 'trust_impact', label: 'Trust Impact', description: '-2 to +2 scale' },
  { key: 'emotional_intelligence_index', label: 'EI Index', description: '0-5 scale' },
  { key: 'ethical_decision_quality', label: 'Ethical Quality', description: '0-5 scale' }
];

export default function CompetencyWeightMatrixEditor({
  scenarioId,
  simulationId,
  onWeightsChange,
  readOnly = false,
  showInheritanceInfo = true
}: CompetencyWeightMatrixEditorProps) {
  const [weights, setWeights] = useState<Record<string, Record<string, number>>>({});
  const [globalWeights, setGlobalWeights] = useState<Record<string, Record<string, number>>>({});
  const [simulationWeights, setSimulationWeights] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<Record<string, number> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWeights();
  }, [scenarioId, simulationId]);

  const loadWeights = async () => {
    setIsLoading(true);
    try {
      const global = await CompetencyCalculationService.getGlobalWeights();
      setGlobalWeights(global);

      let simWeights: Record<string, Record<string, number>> = {};
      if (simulationId) {
        simWeights = await CompetencyCalculationService.getSimulationWeights(simulationId);
        setSimulationWeights(simWeights);
      }

      if (scenarioId) {
        const scenarioWeights = await CompetencyCalculationService.getScenarioWeights(scenarioId);
        const finalWeights = Object.keys(scenarioWeights).length > 0
          ? scenarioWeights
          : (Object.keys(simWeights).length > 0 ? simWeights : global);
        setWeights(finalWeights);
      } else if (simulationId) {
        const finalWeights = Object.keys(simWeights).length > 0 ? simWeights : global;
        setWeights(finalWeights);
      } else {
        setWeights(global);
      }
    } catch (error) {
      console.error('[CompetencyWeightMatrixEditor] Error loading weights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (competencyCode: string, metricType: string, value: string) => {
    const numValue = parseFloat(value);

    if (Number.isNaN(numValue) || numValue < 0 || numValue > 1) {
      return;
    }

    const newWeights = {
      ...weights,
      [competencyCode]: {
        ...(weights[competencyCode] || {}),
        [metricType]: numValue
      }
    };

    setWeights(newWeights);
    setHasUnsavedChanges(true);
    onWeightsChange?.(newWeights);

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    if (simulationId && !readOnly) {
      const timer = setTimeout(() => {
        handleSave(newWeights);
      }, 2000);
      setAutoSaveTimer(timer);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const handleSave = async (weightsToSave?: Record<string, Record<string, number>>) => {
    const currentWeights = weightsToSave || weights;

    if (!simulationId) {
      setMessage({ type: 'error', text: 'Cannot save: Missing simulation ID' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      let allSuccess = true;
      let saveCount = 0;

      for (const competencyCode of Object.keys(currentWeights)) {
        const competencyWeights = currentWeights[competencyCode];

        const success = scenarioId
          ? await CompetencyCalculationService.setScenarioWeights(scenarioId, competencyCode, competencyWeights)
          : await CompetencyCalculationService.setSimulationWeights(simulationId, competencyCode, competencyWeights);

        if (!success) {
          allSuccess = false;
          break;
        }
        saveCount += 1;
      }

      if (allSuccess) {
        setMessage({ type: 'success', text: `Auto-saved! (${saveCount} competencies)` });
        setHasUnsavedChanges(false);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save some weights. Check console for details.' });
      }
    } catch (error) {
      console.error('[CompetencyWeightMatrixEditor] Error saving weights:', error);
      setMessage({ type: 'error', text: 'Error saving weights' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (scenarioId && Object.keys(simulationWeights).length > 0) {
      setWeights(simulationWeights);
    } else {
      setWeights(globalWeights);
    }
    setHasUnsavedChanges(true);
    setMessage({ type: 'success', text: 'Reset to default weights' });
    setTimeout(() => setMessage(null), 3000);
  };

  const calculateTestScore = () => {
    const testScores = {
      bravin_alignment: 8,
      trust_impact: 1,
      emotional_intelligence_index: 4,
      ethical_decision_quality: 4
    };

    const normalizedScores = {
      bravin_alignment: testScores.bravin_alignment / 10,
      trust_impact: (testScores.trust_impact + 2) / 4,
      emotional_intelligence_index: testScores.emotional_intelligence_index / 5,
      ethical_decision_quality: testScores.ethical_decision_quality / 5
    };

    const results: Record<string, number> = {};

    TARGET_COMPETENCIES.forEach((comp) => {
      const competencyWeights = weights[comp.code] || {};
      let score = 0;

      METRIC_TYPES.forEach((metric) => {
        const weight = competencyWeights[metric.key] || 0;
        const normalizedScore = normalizedScores[metric.key as keyof typeof normalizedScores] || 0;
        score += weight * normalizedScore;
      });

      results[comp.code] = parseFloat(score.toFixed(4));
    });

    setTestResult(results);
  };

  const getWeightSource = (competencyCode: string, metricType: string): 'scenario' | 'simulation' | 'global' | 'custom' => {
    if (scenarioId && weights[competencyCode]?.[metricType] !== undefined) {
      const scenarioWeight = weights[competencyCode][metricType];
      const simWeight = simulationWeights[competencyCode]?.[metricType];
      if (simWeight !== undefined && scenarioWeight !== simWeight) return 'scenario';
      if (simWeight !== undefined && scenarioWeight === simWeight) return 'simulation';
    }

    if (simulationId && weights[competencyCode]?.[metricType] !== undefined) {
      const simWeight = weights[competencyCode][metricType];
      const globalWeight = globalWeights[competencyCode]?.[metricType];
      if (globalWeight !== undefined && simWeight !== globalWeight) return 'simulation';
      return 'global';
    }

    return 'global';
  };

  const calculateRowSum = (competencyCode: string): number => {
    const competencyWeights = weights[competencyCode] || {};
    return METRIC_TYPES.reduce((sum, metric) => sum + (competencyWeights[metric.key] || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading weight matrix...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Competency Weight Matrix</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure how metric scores translate to competency assessments
          </p>
        </div>
        {!readOnly && simulationId && (
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Auto-saving...</span>
              </div>
            )}
            {!isSaving && !hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>All changes saved</span>
              </div>
            )}
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Now
            </button>
          </div>
        )}
      </div>

      {showInheritanceInfo && (
        <div className="space-y-3">
          {simulationId && !readOnly && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">Auto-Save Enabled</p>
                  <p>
                    Changes are automatically saved 2 seconds after you stop typing. You can also click "Save Now" to save immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Weight Inheritance</p>
                <p>
                  {scenarioId
                    ? 'This scenario inherits weights from its simulation, which inherits from global defaults. You can override any weight for this specific scenario.'
                    : simulationId
                    ? 'This simulation inherits from global defaults. Overrides here will apply to all scenarios in this simulation unless they have their own overrides.'
                    : 'These are the global default weights used across all simulations and scenarios unless overridden.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Competency
              </th>
              {METRIC_TYPES.map((metric) => (
                <th key={metric.key} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div>{metric.label}</div>
                  <div className="text-xs font-normal text-gray-500 mt-0.5">{metric.description}</div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {TARGET_COMPETENCIES.map((competency) => {
              const rowSum = calculateRowSum(competency.code);
              const isValidSum = rowSum >= 0.9 && rowSum <= 1.1;

              return (
                <tr key={competency.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{competency.code}</div>
                    <div className="text-sm text-gray-600">{competency.name}</div>
                  </td>
                  {METRIC_TYPES.map((metric) => {
                    const value = weights[competency.code]?.[metric.key] ?? 0;
                    const source = getWeightSource(competency.code, metric.key);
                    const isOverridden = source === 'scenario' || (source === 'simulation' && scenarioId);

                    return (
                      <td key={metric.key} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={value}
                            onChange={(e) => handleWeightChange(competency.code, metric.key, e.target.value)}
                            disabled={readOnly}
                            className={`w-20 px-2 py-1 text-center border rounded ${
                              readOnly ? 'bg-gray-50' : 'bg-white'
                            } ${
                              isOverridden ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                          {isOverridden && (
                            <span className="text-xs text-blue-600 font-medium">
                              {source === 'scenario' ? 'Override' : 'Inherited'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${
                      isValidSum ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rowSum.toFixed(3)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Test Calculation</h4>
        <p className="text-sm text-gray-600 mb-4">
          Sample scores: BRAVIN = 8/10, Trust = +1/2, EI = 4/5, Ethical = 4/5
        </p>
        <button
          onClick={calculateTestScore}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Calculate Test Results
        </button>

        {testResult && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            {TARGET_COMPETENCIES.map((comp) => (
              <div key={comp.code} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-600">{comp.code}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {testResult[comp.code]?.toFixed(4)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {CompetencyCalculationService.determineProficiencyLevel(testResult[comp.code] || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Proficiency Levels</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="font-medium text-blue-900">Awareness:</span>
            <span className="text-blue-700 ml-2">0.00 - 0.29</span>
          </div>
          <div>
            <span className="font-medium text-blue-900">Developing:</span>
            <span className="text-blue-700 ml-2">0.30 - 0.59</span>
          </div>
          <div>
            <span className="font-medium text-blue-900">Proficient:</span>
            <span className="text-blue-700 ml-2">0.60 - 0.79</span>
          </div>
          <div>
            <span className="font-medium text-blue-900">Advanced:</span>
            <span className="text-blue-700 ml-2">0.80 - 1.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
