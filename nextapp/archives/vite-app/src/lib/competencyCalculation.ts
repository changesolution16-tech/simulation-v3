import { supabase } from './supabase';

export interface MetricScores {
  bravin_alignment?: number;
  trust_impact?: number;
  emotional_intelligence_index?: number;
  ethical_decision_quality?: number;
}

export interface CompetencyWeight {
  metric_type: string;
  weight: number;
  source: 'scenario' | 'simulation' | 'global';
}

export interface CompetencyCalculationResult {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  competency_score: number;
  proficiency_level: 'Awareness' | 'Developing' | 'Proficient' | 'Advanced';
  weights_applied: Record<string, number>;
  weight_source: string;
  normalized_scores?: {
    bravin_alignment?: number;
    trust_impact?: number;
    emotional_intelligence_index?: number;
    ethical_decision_quality?: number;
  };
}

export interface CompetencyAssessment {
  learner_id: string;
  simulation_instance_id?: string;
  scenario_id?: string;
  option_id?: string;
  competency_id: string;
  bravin_alignment_score?: number;
  trust_impact_score?: number;
  ei_index_score?: number;
  ethical_quality_score?: number;
  bravin_alignment_normalized?: number;
  trust_impact_normalized?: number;
  ei_index_normalized?: number;
  ethical_quality_normalized?: number;
  competency_score: number;
  proficiency_level: string;
  weights_used: Record<string, number>;
  weight_source: string;
}

export interface CompetencyHistory {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  cumulative_score: number;
  current_proficiency_level: string;
  total_assessments: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  trend: 'improving' | 'stable' | 'declining';
  first_assessed_at: string;
  last_assessed_at: string;
}

export class CompetencyCalculationService {
  static normalizeMetricScore(metricType: string, rawScore: number): number {
    switch (metricType) {
      case 'bravin_alignment':
        return Math.max(0, Math.min(1, rawScore / 10.0));

      case 'trust_impact':
        return Math.max(0, Math.min(1, (rawScore + 2.0) / 4.0));

      case 'emotional_intelligence_index':
        return Math.max(0, Math.min(1, rawScore / 5.0));

      case 'ethical_decision_quality':
        return Math.max(0, Math.min(1, rawScore / 5.0));

      default:
        return 0;
    }
  }

  static determineProficiencyLevel(score: number): 'Awareness' | 'Developing' | 'Proficient' | 'Advanced' {
    if (score >= 0.80) return 'Advanced';
    if (score >= 0.60) return 'Proficient';
    if (score >= 0.30) return 'Developing';
    return 'Awareness';
  }

  static async getEffectiveWeights(
    scenarioId: string,
    simulationId: string,
    competencyId: string
  ): Promise<CompetencyWeight[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .rpc('get_effective_weights', {
          p_scenario_id: scenarioId,
          p_simulation_id: simulationId,
          p_competency_id: competencyId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[CompetencyCalculationService] Error getting weights:', error);
      return [];
    }
  }

  static async calculateCompetencyScore(
    scenarioId: string,
    simulationId: string,
    competencyId: string,
    metricScores: MetricScores
  ): Promise<CompetencyCalculationResult | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .rpc('calculate_competency_score', {
          p_scenario_id: scenarioId,
          p_simulation_id: simulationId,
          p_competency_id: competencyId,
          p_bravin_alignment: metricScores.bravin_alignment ?? 0,
          p_trust_impact: metricScores.trust_impact ?? 0,
          p_ei_index: metricScores.emotional_intelligence_index ?? 0,
          p_ethical_quality: metricScores.ethical_decision_quality ?? 0
        });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const result = data[0];

      const { data: competency } = await supabase
        .from('competencies')
        .select('code, name')
        .eq('id', competencyId)
        .single();

      return {
        competency_id: competencyId,
        competency_code: competency?.code || '',
        competency_name: competency?.name || '',
        competency_score: result.competency_score,
        proficiency_level: result.proficiency_level,
        weights_applied: result.weights_applied,
        weight_source: result.weight_source,
        normalized_scores: {
          bravin_alignment: metricScores.bravin_alignment ? this.normalizeMetricScore('bravin_alignment', metricScores.bravin_alignment) : undefined,
          trust_impact: metricScores.trust_impact ? this.normalizeMetricScore('trust_impact', metricScores.trust_impact) : undefined,
          emotional_intelligence_index: metricScores.emotional_intelligence_index ? this.normalizeMetricScore('emotional_intelligence_index', metricScores.emotional_intelligence_index) : undefined,
          ethical_decision_quality: metricScores.ethical_decision_quality ? this.normalizeMetricScore('ethical_decision_quality', metricScores.ethical_decision_quality) : undefined
        }
      };
    } catch (error) {
      console.error('[CompetencyCalculationService] Error calculating score:', error);
      return null;
    }
  }

  static async calculateAllCompetencies(
    scenarioId: string,
    simulationId: string,
    metricScores: MetricScores
  ): Promise<CompetencyCalculationResult[]> {
    if (!supabase) return [];

    try {
      const { data: competencies, error } = await supabase
        .from('competencies')
        .select('id, code, name')
        .eq('is_active', true)
        .in('code', ['TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01']);

      if (error) throw error;
      if (!competencies) return [];

      const results: CompetencyCalculationResult[] = [];

      for (const competency of competencies) {
        const result = await this.calculateCompetencyScore(
          scenarioId,
          simulationId,
          competency.id,
          metricScores
        );

        if (result) {
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error calculating all competencies:', error);
      return [];
    }
  }

  static async recordAssessment(
    learnerId: string,
    simulationInstanceId: string,
    scenarioId: string,
    optionId: string,
    simulationId: string,
    metricScores: MetricScores
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const results = await this.calculateAllCompetencies(
        scenarioId,
        simulationId,
        metricScores
      );

      for (const result of results) {
        const assessment: Partial<CompetencyAssessment> = {
          learner_id: learnerId,
          simulation_instance_id: simulationInstanceId,
          scenario_id: scenarioId,
          option_id: optionId,
          competency_id: result.competency_id,
          bravin_alignment_score: metricScores.bravin_alignment,
          trust_impact_score: metricScores.trust_impact,
          ei_index_score: metricScores.emotional_intelligence_index,
          ethical_quality_score: metricScores.ethical_decision_quality,
          bravin_alignment_normalized: result.normalized_scores?.bravin_alignment,
          trust_impact_normalized: result.normalized_scores?.trust_impact,
          ei_index_normalized: result.normalized_scores?.emotional_intelligence_index,
          ethical_quality_normalized: result.normalized_scores?.ethical_decision_quality,
          competency_score: result.competency_score,
          proficiency_level: result.proficiency_level,
          weights_used: result.weights_applied,
          weight_source: result.weight_source
        };

        const { error: insertError } = await supabase
          .from('learner_competency_assessments')
          .insert(assessment);

        if (insertError) {
          console.error('[CompetencyCalculationService] Error inserting assessment:', insertError);
          continue;
        }

        const { error: updateError } = await supabase
          .rpc('update_competency_history', {
            p_learner_id: learnerId,
            p_competency_id: result.competency_id,
            p_new_score: result.competency_score,
            p_new_level: result.proficiency_level
          });

        if (updateError) {
          console.error('[CompetencyCalculationService] Error updating history:', updateError);
        }
      }

      return true;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error recording assessment:', error);
      return false;
    }
  }

  static async getLearnerCompetencyHistory(learnerId: string): Promise<CompetencyHistory[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('learner_competency_history')
        .select(`
          *,
          competency:competencies(code, name)
        `)
        .eq('learner_id', learnerId)
        .order('current_proficiency_level', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((record: any) => ({
        competency_id: record.competency_id,
        competency_code: record.competency?.code || '',
        competency_name: record.competency?.name || '',
        cumulative_score: record.cumulative_score,
        current_proficiency_level: record.current_proficiency_level,
        total_assessments: record.total_assessments,
        average_score: record.average_score,
        highest_score: record.highest_score,
        lowest_score: record.lowest_score,
        trend: record.trend,
        first_assessed_at: record.first_assessed_at,
        last_assessed_at: record.last_assessed_at
      }));
    } catch (error) {
      console.error('[CompetencyCalculationService] Error getting history:', error);
      return [];
    }
  }

  static async getGlobalWeights(): Promise<Record<string, Record<string, number>>> {
    if (!supabase) return {};

    try {
      const { data, error } = await supabase
        .from('competency_metric_weights_global')
        .select(`
          *,
          competency:competencies(code)
        `)
        .eq('is_active', true);

      if (error) throw error;
      if (!data) return {};

      const weights: Record<string, Record<string, number>> = {};

      for (const record of data) {
        const competencyCode = record.competency?.code;
        if (!competencyCode) continue;

        if (!weights[competencyCode]) {
          weights[competencyCode] = {};
        }

        weights[competencyCode][record.metric_type] = record.weight;
      }

      return weights;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error getting global weights:', error);
      return {};
    }
  }

  static async setSimulationWeights(
    simulationId: string,
    competencyCode: string,
    weights: Record<string, number>,
    configuredBy: string
  ): Promise<boolean> {
    if (!supabase) {
      console.error('[CompetencyCalculationService] Supabase client not initialized');
      return false;
    }

    try {
      console.log(`[CompetencyCalculationService] Looking up competency with code: ${competencyCode}`);

      const { data: competency, error: lookupError } = await supabase
        .from('competencies')
        .select('id')
        .eq('code', competencyCode)
        .single();

      if (lookupError) {
        console.error('[CompetencyCalculationService] Error looking up competency:', lookupError);
        return false;
      }

      if (!competency) {
        console.error(`[CompetencyCalculationService] Competency not found for code: ${competencyCode}`);
        return false;
      }

      console.log(`[CompetencyCalculationService] Found competency ID: ${competency.id}`);

      for (const [metricType, weight] of Object.entries(weights)) {
        console.log(`[CompetencyCalculationService] Upserting: sim=${simulationId}, comp=${competency.id}, metric=${metricType}, weight=${weight}`);

        const { error } = await supabase
          .from('simulation_competency_weights')
          .upsert({
            simulation_id: simulationId,
            competency_id: competency.id,
            metric_type: metricType,
            weight: weight,
            configured_by: configuredBy,
            overrides_global: true
          }, {
            onConflict: 'simulation_id,competency_id,metric_type'
          });

        if (error) {
          console.error('[CompetencyCalculationService] Error setting simulation weight:', error);
          console.error('[CompetencyCalculationService] Error details:', JSON.stringify(error, null, 2));
          return false;
        }
      }

      console.log(`[CompetencyCalculationService] Successfully saved all weights for ${competencyCode}`);
      return true;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error setting simulation weights:', error);
      return false;
    }
  }

  static async setScenarioWeights(
    scenarioId: string,
    competencyCode: string,
    weights: Record<string, number>,
    configuredBy: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { data: competency } = await supabase
        .from('competencies')
        .select('id')
        .eq('code', competencyCode)
        .single();

      if (!competency) return false;

      for (const [metricType, weight] of Object.entries(weights)) {
        const { error } = await supabase
          .from('scenario_competency_weights')
          .upsert({
            scenario_id: scenarioId,
            competency_id: competency.id,
            metric_type: metricType,
            weight: weight,
            configured_by: configuredBy,
            overrides_simulation: true
          }, {
            onConflict: 'scenario_id,competency_id,metric_type'
          });

        if (error) {
          console.error('[CompetencyCalculationService] Error setting scenario weight:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error setting scenario weights:', error);
      return false;
    }
  }

  static async getScenarioWeights(
    scenarioId: string
  ): Promise<Record<string, Record<string, number>>> {
    if (!supabase) return {};

    try {
      const { data, error } = await supabase
        .from('scenario_competency_weights')
        .select(`
          *,
          competency:competencies(code)
        `)
        .eq('scenario_id', scenarioId)
        .eq('is_active', true);

      if (error) throw error;
      if (!data) return {};

      const weights: Record<string, Record<string, number>> = {};

      for (const record of data) {
        const competencyCode = record.competency?.code;
        if (!competencyCode) continue;

        if (!weights[competencyCode]) {
          weights[competencyCode] = {};
        }

        weights[competencyCode][record.metric_type] = record.weight;
      }

      return weights;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error getting scenario weights:', error);
      return {};
    }
  }

  static async getSimulationWeights(
    simulationId: string
  ): Promise<Record<string, Record<string, number>>> {
    if (!supabase) return {};

    try {
      const { data, error } = await supabase
        .from('simulation_competency_weights')
        .select(`
          *,
          competency:competencies(code)
        `)
        .eq('simulation_id', simulationId)
        .eq('is_active', true);

      if (error) throw error;
      if (!data) return {};

      const weights: Record<string, Record<string, number>> = {};

      for (const record of data) {
        const competencyCode = record.competency?.code;
        if (!competencyCode) continue;

        if (!weights[competencyCode]) {
          weights[competencyCode] = {};
        }

        weights[competencyCode][record.metric_type] = record.weight;
      }

      return weights;
    } catch (error) {
      console.error('[CompetencyCalculationService] Error getting simulation weights:', error);
      return {};
    }
  }

  static async saveScenarioWeights(
    scenarioId: string,
    weights: Record<string, Record<string, number>>
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data: competencies, error: compError } = await supabase
        .from('competencies')
        .select('id, code');

      if (compError) throw compError;

      const competencyMap = new Map<string, string>();
      competencies?.forEach(comp => {
        competencyMap.set(comp.code, comp.id);
      });

      const { error: deleteError } = await supabase
        .from('scenario_competency_weights')
        .delete()
        .eq('scenario_id', scenarioId);

      if (deleteError) throw deleteError;

      const weightsToInsert: any[] = [];

      Object.entries(weights).forEach(([competencyCode, metricWeights]) => {
        const competencyId = competencyMap.get(competencyCode);
        if (!competencyId) {
          console.warn(`Competency ${competencyCode} not found in database`);
          return;
        }

        Object.entries(metricWeights).forEach(([metricType, weight]) => {
          weightsToInsert.push({
            scenario_id: scenarioId,
            competency_id: competencyId,
            metric_type: metricType,
            weight: weight,
            is_active: true
          });
        });
      });

      if (weightsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('scenario_competency_weights')
          .insert(weightsToInsert);

        if (insertError) throw insertError;

        console.log(`[CompetencyCalculationService] Saved ${weightsToInsert.length} weight entries for scenario ${scenarioId}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('[CompetencyCalculationService] Error saving scenario weights:', error);
      return { success: false, error: error.message || 'Failed to save weights' };
    }
  }
}
