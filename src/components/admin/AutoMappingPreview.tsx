'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { AutoMappingService, CompetencySuggestion, MetricCompetencyMatch } from '@/lib/autoMapping';

interface AutoMappingPreviewProps {
  metricIds: string[];
  scenarioId?: string;
  existingCompetencyIds?: string[];
  onAcceptSuggestions?: (suggestions: CompetencySuggestion[]) => void;
  onRejectSuggestions?: () => void;
  showCompetencySuggestions?: boolean;
  showMappingPreview?: boolean;
}

const AutoMappingPreview: React.FC<AutoMappingPreviewProps> = ({
  metricIds,
  scenarioId,
  existingCompetencyIds = [],
  onAcceptSuggestions,
  onRejectSuggestions,
  showCompetencySuggestions = true,
  showMappingPreview = true
}) => {
  const [competencySuggestions, setCompetencySuggestions] = useState<CompetencySuggestion[]>([]);
  const [mappingPreviews, setMappingPreviews] = useState<MetricCompetencyMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['competencies']));

  useEffect(() => {
    if (metricIds.length > 0) {
      loadSuggestions();
    } else {
      setCompetencySuggestions([]);
      setMappingPreviews([]);
    }
  }, [metricIds, existingCompetencyIds]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      if (showCompetencySuggestions) {
        const suggestions = await AutoMappingService.suggestCompetenciesForMetrics(
          metricIds,
          existingCompetencyIds
        );
        setCompetencySuggestions(suggestions);

        const highConfidenceIds = new Set(
          suggestions
            .filter(s => s.confidence === 'high')
            .map(s => s.competency_id)
        );
        setSelectedSuggestions(highConfidenceIds);
      }

      if (showMappingPreview && scenarioId) {
        const previews = await AutoMappingService.previewMappings(scenarioId, metricIds);
        setMappingPreviews(previews);
      }
    } catch (error) {
      console.error('[AutoMappingPreview] Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (competencyId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(competencyId)) {
      newSelected.delete(competencyId);
    } else {
      newSelected.add(competencyId);
    }
    setSelectedSuggestions(newSelected);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleAcceptSelected = () => {
    const selected = competencySuggestions.filter(s => selectedSuggestions.has(s.competency_id));
    if (onAcceptSuggestions) {
      onAcceptSuggestions(selected);
    }
  };

  const handleSelectAll = () => {
    setSelectedSuggestions(new Set(competencySuggestions.map(s => s.competency_id)));
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const getConfidenceBadgeColor = (confidence: 'high' | 'medium' | 'low'): string => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 dark:text-gray-100 border-gray-300'
    };
    return colors[confidence];
  };

  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    if (confidence === 'high') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (confidence === 'medium') return <Info className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-sm text-blue-900">Analyzing metrics and suggesting competencies...</span>
      </div>
    );
  }

  if (metricIds.length === 0) {
    return null;
  }

  const highConfidence = competencySuggestions.filter(s => s.confidence === 'high').length;
  const mediumConfidence = competencySuggestions.filter(s => s.confidence === 'medium').length;
  const lowConfidence = competencySuggestions.filter(s => s.confidence === 'low').length;

  return (
    <div className="space-y-4">
      {showCompetencySuggestions && competencySuggestions.length > 0 && (
        <div className="border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-blue-100/50 transition-colors rounded-t-lg"
            onClick={() => toggleSection('competencies')}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Auto-Suggested Competencies
                </h4>
                <p className="text-xs text-gray-600">
                  Based on your selected metrics, we recommend {competencySuggestions.length} competenc
                  {competencySuggestions.length === 1 ? 'y' : 'ies'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                  {highConfidence} high
                </span>
                {mediumConfidence > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                    {mediumConfidence} medium
                  </span>
                )}
                {lowConfidence > 0 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:text-gray-100 rounded font-medium">
                    {lowConfidence} low
                  </span>
                )}
              </div>
              {expandedSections.has('competencies') ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </div>

          {expandedSections.has('competencies') && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-700 hover:text-blue-900 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-blue-700 hover:text-blue-900 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
                <span className="text-xs text-gray-600">{selectedSuggestions.size} selected</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {competencySuggestions.map((suggestion) => (
                  <div
                    key={suggestion.competency_id}
                    className={`border rounded-lg p-3 transition-all ${
                      selectedSuggestions.has(suggestion.competency_id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 dark:border-gray-700 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(suggestion.competency_id)}
                        onChange={() => toggleSuggestion(suggestion.competency_id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {suggestion.competency_code} - {suggestion.competency_name}
                            </h5>
                            {suggestion.is_primary && (
                              <Target className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getConfidenceIcon(suggestion.confidence)}
                            <span
                              className={`text-xs px-2 py-0.5 rounded border ${getConfidenceBadgeColor(
                                suggestion.confidence
                              )}`}
                            >
                              {suggestion.confidence}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {suggestion.competency_description}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              suggestion.development_priority === 'primary'
                                ? 'bg-blue-100 text-blue-800'
                                : suggestion.development_priority === 'secondary'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800 dark:text-gray-100'
                            }`}
                          >
                            {suggestion.development_priority}
                          </span>
                          <span className="text-gray-600">
                            Weight: {(suggestion.target_weight * 100).toFixed(0)}%
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-gray-600">
                            Matches: {suggestion.matching_metrics.join(', ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">{suggestion.rationale}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {onAcceptSuggestions && (
                <div className="flex gap-2 pt-3 border-t border-blue-200">
                  <button
                    onClick={handleAcceptSelected}
                    disabled={selectedSuggestions.size === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Accept {selectedSuggestions.size} Selected Competenc
                    {selectedSuggestions.size === 1 ? 'y' : 'ies'}
                  </button>
                  {onRejectSuggestions && (
                    <button
                      onClick={onRejectSuggestions}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showMappingPreview && mappingPreviews.length > 0 && (
        <div className="border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-green-100/50 transition-colors rounded-t-lg"
            onClick={() => toggleSection('mappings')}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Automatic Metric-to-Competency Mappings
                </h4>
                <p className="text-xs text-gray-600">
                  {mappingPreviews.length} mapping{mappingPreviews.length === 1 ? '' : 's'} will be created
                  automatically
                </p>
              </div>
            </div>
            {expandedSections.has('mappings') ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>

          {expandedSections.has('mappings') && (
            <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
              {mappingPreviews.map((mapping) => (
                <div
                  key={`${mapping.metric_id}-${mapping.competency_id}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">
                        {mapping.metric_name} → {mapping.competency_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {mapping.calculation_method.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600">
                          Weight: {(mapping.mapping_weight * 100).toFixed(0)}%
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${getConfidenceBadgeColor(
                            mapping.confidence
                          )}`}
                        >
                          {mapping.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">{mapping.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {competencySuggestions.length === 0 && mappingPreviews.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No auto-mapping suggestions available</p>
          <p className="text-xs text-gray-500 mt-1">
            Select metrics to see competency suggestions and automatic mappings
          </p>
        </div>
      )}
    </div>
  );
};

export default AutoMappingPreview;
