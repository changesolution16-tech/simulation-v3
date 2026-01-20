export interface AutoMappingResult {
  created: number;
  skipped: number;
  errors: string[];
  mappings: any[];
}

export interface MetricCompetencyMatch {
  metric_id: string;
  metric_name: string;
  metric_type: string;
  competency_id: string;
  competency_name: string;
  competency_code: string;
  calculation_method: string;
  mapping_weight: number;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CompetencySuggestion {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  competency_description: string;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  is_primary: boolean;
  development_priority: 'primary' | 'secondary' | 'supplementary';
  target_weight: number;
  matching_metrics: string[];
}

export class AutoMappingService {
  static async suggestCompetenciesForMetrics(
    metricIds: string[],
    existingCompetencyIds: string[] = []
  ): Promise<CompetencySuggestion[]> {
    try {
      const response = await fetch('/api/auto-mapping/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricIds, existingCompetencyIds })
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('[AutoMappingService] Error suggesting competencies:', error);
      return [];
    }
  }

  static async previewMappings(
    scenarioId: string,
    metricIds: string[]
  ): Promise<MetricCompetencyMatch[]> {
    try {
      const response = await fetch('/api/auto-mapping/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, metricIds })
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('[AutoMappingService] Error previewing mappings:', error);
      return [];
    }
  }

  static async autoGenerateMappings(
    scenarioId: string,
    simulationId: string,
    metricIds: string[]
  ): Promise<AutoMappingResult> {
    try {
      const response = await fetch('/api/auto-mapping/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, simulationId, metricIds })
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          created: 0,
          skipped: 0,
          errors: [data.error || 'Failed to generate mappings'],
          mappings: []
        };
      }

      return await response.json();
    } catch (error) {
      console.error('[AutoMappingService] Error generating mappings:', error);
      return {
        created: 0,
        skipped: 0,
        errors: ['Unexpected error occurred while generating mappings'],
        mappings: []
      };
    }
  }
}
