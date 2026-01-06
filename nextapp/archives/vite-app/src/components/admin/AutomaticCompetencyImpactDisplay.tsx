import React, { useState, useEffect } from 'react';
import { Zap, Edit2, RotateCcw, AlertTriangle, TrendingUp, TrendingDown, Info, Check } from 'lucide-react';
import {
  MetricCompetencyMappingService,
  AutomaticCompetencyImpact
} from '../../lib/metricCompetencyMapping';

interface AutomaticCompetencyImpactDisplayProps {
  simulationId: string;
  scenarioId: string;
  optionId: string;
  onOverride?: (competencyId: string, manualImpact: number, reason?: string) => void;
}

const AutomaticCompetencyImpactDisplay: React.FC<AutomaticCompetencyImpactDisplayProps> = ({
  simulationId,
  scenarioId,
  optionId,
  onOverride
}) => {
  const [impacts, setImpacts] = useState<AutomaticCompetencyImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompetency, setEditingCompetency] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');

  useEffect(() => {
    if (simulationId && scenarioId && optionId) {
      loadImpacts();
    }
  }, [simulationId, scenarioId, optionId]);

  const loadImpacts = async () => {
    setLoading(true);
    try {
      const data = await MetricCompetencyMappingService.getAutomaticCompetencyImpacts(
        simulationId,
        scenarioId,
        optionId
      );
      setImpacts(data);
    } catch (error) {
      console.error('Error loading automatic impacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (impact: AutomaticCompetencyImpact) => {
    setEditingCompetency(impact.competency_id);
    setManualValue(impact.manual_impact);
    setOverrideReason('');
  };

  const handleSaveOverride = async (competencyId: string) => {
    const impact = impacts.find(i => i.competency_id === competencyId);
    if (!impact) return;

    if (onOverride) {
      await onOverride(competencyId, manualValue, overrideReason || undefined);
      await loadImpacts();
    }

    setEditingCompetency(null);
    setManualValue(0);
    setOverrideReason('');
  };

  const handleRevertToAutomatic = async (competencyId: string) => {
    const impact = impacts.find(i => i.competency_id === competencyId);
    if (!impact) return;

    if (onOverride) {
      await onOverride(competencyId, impact.automatic_impact);
      await loadImpacts();
    }
  };

  const getImpactColor = (impact: number): string => {
    if (impact > 5) return 'text-green-600 bg-green-50';
    if (impact > 0) return 'text-green-600 bg-green-50';
    if (impact === 0) return 'text-gray-600 bg-gray-50';
    if (impact > -5) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="w-4 h-4" />;
    if (impact < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      linear: 'bg-blue-100 text-blue-700',
      threshold_based: 'bg-green-100 text-green-700',
      exponential_growth: 'bg-purple-100 text-purple-700',
      compensatory: 'bg-yellow-100 text-yellow-700',
      conjunctive: 'bg-red-100 text-red-700',
      custom: 'bg-gray-100 text-gray-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (impacts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
        <Info className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          No automatic competency impacts calculated yet. Assign metric scores to this response option to see automatic impacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Automatic Competency Impacts</h4>
        <span className="text-xs text-gray-500">({impacts.length} calculated)</span>
      </div>

      {impacts.map((impact) => {
        const isEditing = editingCompetency === impact.competency_id;
        const hasDeviation = Math.abs(impact.automatic_impact - impact.manual_impact) > 1;

        return (
          <div
            key={impact.competency_id}
            className={`border rounded-lg p-4 ${
              impact.is_overridden ? 'border-orange-300 bg-orange-50' : 'border-gray-200 dark:border-gray-700 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{impact.competency_name}</span>
                  {impact.is_overridden && (
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded flex items-center gap-1">
                      <Edit2 className="w-3 h-3" />
                      Manual Override
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded ${getMethodColor(impact.calculation_method)}`}>
                    {impact.calculation_method.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-600">
                    Based on {impact.contributing_metrics.length} metric{impact.contributing_metrics.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {!isEditing && (
                <div className="flex items-center gap-2 ml-4">
                  <div className={`px-3 py-1 rounded font-semibold text-sm flex items-center gap-1 ${getImpactColor(impact.manual_impact)}`}>
                    {getImpactIcon(impact.manual_impact)}
                    {impact.manual_impact > 0 ? '+' : ''}{impact.manual_impact.toFixed(1)}
                  </div>
                  <button
                    onClick={() => handleStartEdit(impact)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit impact"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {impact.is_overridden && (
                    <button
                      onClick={() => handleRevertToAutomatic(impact.competency_id)}
                      className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Revert to automatic"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-blue-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Automatic Impact
                    </label>
                    <div className={`px-3 py-2 rounded text-sm font-medium ${getImpactColor(impact.automatic_impact)}`}>
                      {impact.automatic_impact > 0 ? '+' : ''}{impact.automatic_impact.toFixed(1)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Manual Override
                    </label>
                    <input
                      type="number"
                      value={manualValue}
                      onChange={(e) => setManualValue(parseFloat(e.target.value))}
                      min="-10"
                      max="10"
                      step="0.5"
                      className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Override Reason (Optional)
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Why are you overriding the automatic calculation?"
                    rows={2}
                    className="w-full px-3 py-2 text-xs border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingCompetency(null);
                      setManualValue(0);
                      setOverrideReason('');
                    }}
                    className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveOverride(impact.competency_id)}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Save Override
                  </button>
                </div>
              </div>
            ) : (
              <>
                {hasDeviation && impact.is_overridden && (
                  <div className="bg-orange-100 border border-orange-200 rounded p-2 mb-2 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-orange-800">
                      <span className="font-medium">Deviation from automatic:</span> {Math.abs(impact.automatic_impact - impact.manual_impact).toFixed(1)} points
                      (automatic: {impact.automatic_impact > 0 ? '+' : ''}{impact.automatic_impact.toFixed(1)})
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Contributing Metrics:</p>
                  <div className="space-y-1">
                    {impact.contributing_metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 rounded px-3 py-2">
                        <span className="text-gray-700">{metric.metric_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Score: {metric.metric_score}</span>
                          <span className="text-gray-500">×</span>
                          <span className="text-gray-600">Weight: {(metric.weight * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AutomaticCompetencyImpactDisplay;
