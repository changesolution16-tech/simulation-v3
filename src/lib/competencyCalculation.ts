export type MetricType =
  | 'bravin_alignment'
  | 'trust_impact'
  | 'emotional_intelligence_index'
  | 'ethical_decision_quality';

export class CompetencyCalculationService {
  static determineProficiencyLevel(score: number): 'Awareness' | 'Developing' | 'Proficient' | 'Advanced' {
    if (score >= 0.8) return 'Advanced';
    if (score >= 0.6) return 'Proficient';
    if (score >= 0.3) return 'Developing';
    return 'Awareness';
  }

  static async getGlobalWeights(): Promise<Record<string, Record<string, number>>> {
    const response = await fetch('/api/competency-weights/global');
    if (!response.ok) {
      throw new Error('Failed to load global weights');
    }
    return response.json();
  }

  static async getSimulationWeights(simulationId: string): Promise<Record<string, Record<string, number>>> {
    const response = await fetch(`/api/competency-weights/simulation?simulation_id=${simulationId}`);
    if (!response.ok) {
      throw new Error('Failed to load simulation weights');
    }
    return response.json();
  }

  static async getScenarioWeights(scenarioId: string): Promise<Record<string, Record<string, number>>> {
    const response = await fetch(`/api/competency-weights/scenario?scenario_id=${scenarioId}`);
    if (!response.ok) {
      throw new Error('Failed to load scenario weights');
    }
    return response.json();
  }

  static async setSimulationWeights(
    simulationId: string,
    competencyCode: string,
    weights: Record<string, number>
  ): Promise<boolean> {
    const response = await fetch('/api/competency-weights/simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulation_id: simulationId, competency_code: competencyCode, weights })
    });

    return response.ok;
  }

  static async setScenarioWeights(
    scenarioId: string,
    competencyCode: string,
    weights: Record<string, number>
  ): Promise<boolean> {
    const response = await fetch('/api/competency-weights/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, competency_code: competencyCode, weights })
    });

    return response.ok;
  }
}
