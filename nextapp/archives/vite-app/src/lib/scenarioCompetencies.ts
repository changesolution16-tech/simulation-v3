import { supabase } from './supabase';
import { Competency } from './competencies';

export type DevelopmentPriority = 'primary' | 'secondary' | 'supplementary';

export interface ScenarioTargetedCompetency {
  id: string;
  scenario_id: string;
  competency_id: string;
  target_weight: number;
  is_primary: boolean;
  development_priority: DevelopmentPriority;
  notes?: string;
  created_at: string;
  updated_at: string;
  competency?: Competency;
}

export interface ScenarioTargetedCompetencyWithDetails extends ScenarioTargetedCompetency {
  competency_code: string;
  competency_name: string;
  competency_description: string;
  competency_level: number;
}

export interface CompetencySelectionData {
  competency_id: string;
  target_weight?: number;
  is_primary?: boolean;
  development_priority?: DevelopmentPriority;
  notes?: string;
}

export class ScenarioCompetencyService {
  static async getTargetedCompetencies(scenarioId: string): Promise<ScenarioTargetedCompetencyWithDetails[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .rpc('get_scenario_targeted_competencies', {
          p_scenario_id: scenarioId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error fetching targeted competencies:', error);
      return [];
    }
  }

  static async setTargetedCompetencies(
    scenarioId: string,
    competencies: CompetencySelectionData[]
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error: deleteError } = await supabase
        .from('scenario_targeted_competencies')
        .delete()
        .eq('scenario_id', scenarioId);

      if (deleteError) throw deleteError;

      if (competencies.length === 0) return true;

      const inserts = competencies.map(comp => ({
        scenario_id: scenarioId,
        competency_id: comp.competency_id,
        target_weight: comp.target_weight ?? 1.0,
        is_primary: comp.is_primary ?? false,
        development_priority: comp.development_priority ?? 'secondary',
        notes: comp.notes
      }));

      const { error: insertError } = await supabase
        .from('scenario_targeted_competencies')
        .insert(inserts);

      if (insertError) throw insertError;
      return true;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error setting targeted competencies:', error);
      return false;
    }
  }

  static async addTargetedCompetency(
    scenarioId: string,
    competencyData: CompetencySelectionData
  ): Promise<ScenarioTargetedCompetency | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('scenario_targeted_competencies')
        .insert({
          scenario_id: scenarioId,
          competency_id: competencyData.competency_id,
          target_weight: competencyData.target_weight ?? 1.0,
          is_primary: competencyData.is_primary ?? false,
          development_priority: competencyData.development_priority ?? 'secondary',
          notes: competencyData.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error adding targeted competency:', error);
      return null;
    }
  }

  static async updateTargetedCompetency(
    id: string,
    updates: Partial<CompetencySelectionData>
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('scenario_targeted_competencies')
        .update({
          target_weight: updates.target_weight,
          is_primary: updates.is_primary,
          development_priority: updates.development_priority,
          notes: updates.notes
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error updating targeted competency:', error);
      return false;
    }
  }

  static async removeTargetedCompetency(
    scenarioId: string,
    competencyId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('scenario_targeted_competencies')
        .delete()
        .eq('scenario_id', scenarioId)
        .eq('competency_id', competencyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error removing targeted competency:', error);
      return false;
    }
  }

  static async getMappingRecommendations(
    metricType: string,
    competencyCodes: string[]
  ): Promise<Array<{
    competency_code: string;
    recommended_method: string;
    recommended_weight: number;
    rationale: string;
  }>> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .rpc('get_metric_competency_mapping_recommendations', {
          p_metric_type: metricType,
          p_competency_codes: competencyCodes
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error getting mapping recommendations:', error);
      return [];
    }
  }
}
