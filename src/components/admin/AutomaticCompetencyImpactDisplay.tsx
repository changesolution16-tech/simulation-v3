'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Edit2, RotateCcw, AlertTriangle, TrendingUp, TrendingDown, Info, Check } from 'lucide-react';
import {
  MetricCompetencyMappingService,
  AutomaticCompetencyImpact
} from '@/lib/metricCompetencyMapping';

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
    if (impact > 0) return 'text-blue-600 bg-blue-50';
    if (impact < -5) return 'text-red-600 bg-red-50';
    if (impact < 0) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="w-4 h-4" />;
    if (impact < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (impacts.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">No automatic impacts available</p>
            <p className="text-xs text-blue-700 mt-1">
              Configure metrics and metric-competency mappings to enable automatic impact calculation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">Automatic Competency Impacts</h3>
        </div>
        <span className="text-xs text-gray-500">
          {impacts.filter(i => i.is_overridden).length} manual overrides
        </span>
      </div>

      <div className="space-y-3">
        {impacts.map((impact) => (
          <div
            key={impact.competency_id}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{impact.competency_name}</span>
                  <span className="text-xs text-gray-500">({impact.competency_code})</span>
                  {impact.is_overridden && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1">
                      <Edit2 className="w-3 h-3" />
                      Override
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Automatic:</span>
                    <div className={`px-3 py-1 rounded-md font-medium text-sm flex items-center gap-1 ${getImpactColor(impact.automatic_impact)}`}>
                      {getImpactIcon(impact.automatic_impact)}
                      {impact.automatic_impact > 0 ? '+' : ''}{impact.automatic_impact}
                    </div>
                  </div>

                  {impact.is_overridden && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Manual:</span>
                      <div className={`px-3 py-1 rounded-md font-medium text-sm flex items-center gap-1 ${getImpactColor(impact.manual_impact)}`}>
                        {getImpactIcon(impact.manual_impact)}
                        {impact.manual_impact > 0 ? '+' : ''}{impact.manual_impact}
                      </div>
                    </div>
                  )}
                </div>

                {impact.contributing_metrics.length > 0 && (
                  <div className="mt-3 text-xs text-gray-600">
                    <span className="font-medium">Based on metrics:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {impact.contributing_metrics.map((metric) => (
                        <span
                          key={metric.metric_id}
                          className="px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {metric.metric_name}: {metric.score} (weight: {metric.weight})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingCompetency === impact.competency_id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveOverride(impact.competency_id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Save override"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCompetency(null)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(impact)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit impact"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {impact.is_overridden && (
                      <button
                        type="button"
                        onClick={() => handleRevertToAutomatic(impact.competency_id)}
                        className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="Revert to automatic"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {editingCompetency === impact.competency_id && (
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Manual Impact Value
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={manualValue}
                    onChange={(e) => setManualValue(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>-10 (Very Negative)</span>
                    <span className="font-medium">{manualValue}</span>
                    <span>+10 (Very Positive)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reason for Override (optional)
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Why are you overriding the automatic calculation?"
                  />
                </div>
              </div>
            )}

            {impact.is_overridden && impact.override_reason && (
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs text-orange-800">
                  <span className="font-medium">Override reason:</span> {impact.override_reason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">About Automatic Impacts</p>
            <p>
              Impacts are automatically calculated based on the metric scores assigned to this option
              and the configured metric-competency mappings. You can override any automatic calculation
              if you have specific knowledge about the competency impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomaticCompetencyImpactDisplay;
