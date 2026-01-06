export type CalculationMethod = 'direct' | 'weighted' | 'averaged' | 'summed';

export interface AutomaticCompetencyImpact {
  competency_id: string;
  competency_name: string;
  competency_code: string;
  automatic_impact: number;
  manual_impact: number;
  is_overridden: boolean;
  override_reason?: string;
  contributing_metrics: {
    metric_id: string;
    metric_name: string;
    score: number;
    weight: number;
  }[];
  calculation_method: CalculationMethod;
  confidence: 'high' | 'medium' | 'low';
}

export interface SimulationMetricCompetencyMapping {
  id: string;
  simulation_id: string;
  metric_id: string;
  competency_id: string;
  calculation_method: CalculationMethod;
  mapping_weight: number;
  is_active: boolean;
}

export class MetricCompetencyMappingService {
  static async getAutomaticCompetencyImpacts(
    simulationId: string,
    scenarioId: string,
    optionId: string
  ): Promise<AutomaticCompetencyImpact[]> {
    try {
      const response = await fetch(
        `/api/mappings/automatic-impacts?simulationId=${simulationId}&scenarioId=${scenarioId}&optionId=${optionId}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching automatic competency impacts:', error);
      return [];
    }
  }

  static async getMappingsForSimulation(
    simulationId: string
  ): Promise<SimulationMetricCompetencyMapping[]> {
    try {
      const response = await fetch(`/api/mappings?simulationId=${simulationId}`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching mappings:', error);
      return [];
    }
  }

  static async createMapping(
    mapping: Partial<SimulationMetricCompetencyMapping>
  ): Promise<SimulationMetricCompetencyMapping | null> {
    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping)
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating mapping:', error);
      return null;
    }
  }
}
