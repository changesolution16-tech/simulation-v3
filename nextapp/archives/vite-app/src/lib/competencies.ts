import { supabase } from './supabase';

export type MetricType =
  | 'decision_quality'
  | 'timing'
  | 'critical_thinking'
  | 'emotional_intelligence'
  | 'communication'
  | 'problem_solving'
  | 'adaptability'
  | 'collaboration'
  | 'custom'
  | 'bravin_alignment'
  | 'trust_impact'
  | 'ethical_decision_quality'
  | 'emotional_intelligence_index'
  | 'cultural_stewardship';

export type MeasurementMethod =
  | 'automatic'
  | 'rubric'
  | 'observation'
  | 'self_assessment'
  | 'peer_assessment';

export interface ProficiencyLevel {
  level: number;
  name: string;
  description: string;
}

export interface Competency {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_competency_id?: string;
  competency_level: number;
  proficiency_levels: ProficiencyLevel[];
  industry_standard?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentMetric {
  id: string;
  name: string;
  description?: string;
  metric_type: MetricType;
  measurement_method?: MeasurementMethod;
  min_score: number;
  max_score: number;
  passing_threshold: number;
  applies_to_topics?: string[];
  applies_to_scenarios?: string[];
  is_global: boolean;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetencyMapping {
  id: string;
  competency_id: string;
  scenario_id?: string;
  option_id?: string;
  proficiency_impact: number;
  required_for_mastery: boolean;
  created_at: string;
}

export interface LearnerCompetency {
  id: string;
  learner_id: string;
  competency_id: string;
  current_level: number;
  current_score: number;
  is_mastered: boolean;
  first_assessed_at?: string;
  last_assessed_at?: string;
  total_practice_count: number;
  trend: 'improving' | 'stable' | 'declining';
  growth_rate?: number;
  created_at: string;
  updated_at: string;
  competency?: Competency;
}

export interface SimulationMetric {
  id: string;
  simulation_id: string;
  metric_id: string;
  weight: number;
  is_required: boolean;
  custom_passing_threshold?: number;
  show_to_learner: boolean;
  display_order: number;
  custom_label?: string;
  created_at: string;
  updated_at: string;
  metric?: AssessmentMetric;
}

export interface SimulationCompetency {
  id: string;
  simulation_id: string;
  competency_id: string;
  is_primary: boolean;
  target_level: number;
  is_prerequisite: boolean;
  prerequisite_level?: number;
  display_order: number;
  show_in_results: boolean;
  created_at: string;
  competency?: Competency;
}

export class CompetencyService {
  static async getAll(): Promise<Competency[]> {
    console.log('[CompetencyService.getAll] Starting to fetch competencies');
    console.log('[CompetencyService.getAll] Supabase client exists:', !!supabase);

    if (!supabase) {
      console.warn('[CompetencyService.getAll] No Supabase client available');
      return [];
    }

    try {
      console.log('[CompetencyService.getAll] Executing query...');
      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('is_active', true)
        .order('competency_level', { ascending: true })
        .order('name', { ascending: true });

      console.log('[CompetencyService.getAll] Query completed');
      console.log('[CompetencyService.getAll] Error:', error);
      console.log('[CompetencyService.getAll] Data count:', data?.length || 0);

      if (error) {
        console.error('[CompetencyService.getAll] Supabase error:', error);
        throw error;
      }

      console.log('[CompetencyService.getAll] Returning data:', data);
      return data || [];
    } catch (error) {
      console.error('[CompetencyService.getAll] Exception caught:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Competency | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching competency:', error);
      return null;
    }
  }

  static async getHierarchy(): Promise<Competency[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('is_active', true)
        .is('parent_competency_id', null)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching competency hierarchy:', error);
      return [];
    }
  }

  static async getChildren(parentId: string): Promise<Competency[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('parent_competency_id', parentId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching child competencies:', error);
      return [];
    }
  }

  static async create(competency: Partial<Competency>): Promise<Competency | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('competencies')
        .insert({
          code: competency.code,
          name: competency.name,
          description: competency.description,
          parent_competency_id: competency.parent_competency_id || null,
          competency_level: competency.competency_level || 1,
          proficiency_levels: competency.proficiency_levels || [
            { level: 1, name: 'Awareness', description: 'Basic understanding' },
            { level: 2, name: 'Developing', description: 'Can perform with guidance' },
            { level: 3, name: 'Proficient', description: 'Can perform independently' },
            { level: 4, name: 'Advanced', description: 'Can teach others' },
            { level: 5, name: 'Expert', description: 'Recognized authority' }
          ],
          industry_standard: competency.industry_standard || null,
          tags: competency.tags || [],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating competency:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Competency>): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('competencies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating competency:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('competencies')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting competency:', error);
      return false;
    }
  }

  static async getLearnerCompetencies(learnerId: string): Promise<LearnerCompetency[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('learner_competencies')
        .select(`
          *,
          competency:competencies(*)
        `)
        .eq('learner_id', learnerId)
        .order('last_assessed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching learner competencies:', error);
      return [];
    }
  }

  static async updateLearnerCompetency(
    learnerId: string,
    competencyId: string,
    impact: number
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { data: existing } = await supabase
        .from('learner_competencies')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('competency_id', competencyId)
        .maybeSingle();

      if (existing) {
        const newScore = Math.max(0, Math.min(100, existing.current_score + impact));
        const newLevel = Math.floor(newScore / 20) + 1;
        const isMastered = newScore >= 90;

        const growthRate = existing.current_score > 0
          ? ((newScore - existing.current_score) / existing.current_score) * 100
          : 0;

        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (growthRate > 5) trend = 'improving';
        else if (growthRate < -5) trend = 'declining';

        const { error } = await supabase
          .from('learner_competencies')
          .update({
            current_score: newScore,
            current_level: newLevel,
            is_mastered: isMastered,
            last_assessed_at: new Date().toISOString(),
            total_practice_count: existing.total_practice_count + 1,
            trend,
            growth_rate: growthRate
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const newScore = Math.max(0, Math.min(100, 50 + impact));
        const newLevel = Math.floor(newScore / 20) + 1;

        const { error } = await supabase
          .from('learner_competencies')
          .insert({
            learner_id: learnerId,
            competency_id: competencyId,
            current_score: newScore,
            current_level: newLevel,
            is_mastered: false,
            first_assessed_at: new Date().toISOString(),
            last_assessed_at: new Date().toISOString(),
            total_practice_count: 1,
            trend: 'stable',
            growth_rate: 0
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating learner competency:', error);
      return false;
    }
  }
}

export class MetricsService {
  static async getAll(): Promise<AssessmentMetric[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('assessment_metrics')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<AssessmentMetric | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('assessment_metrics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching metric:', error);
      return null;
    }
  }

  static async create(metric: Partial<AssessmentMetric>): Promise<AssessmentMetric | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('assessment_metrics')
        .insert({
          name: metric.name,
          description: metric.description,
          metric_type: metric.metric_type,
          measurement_method: metric.measurement_method || 'automatic',
          min_score: metric.min_score || 0,
          max_score: metric.max_score || 100,
          passing_threshold: metric.passing_threshold || 70,
          applies_to_topics: metric.applies_to_topics || null,
          applies_to_scenarios: metric.applies_to_scenarios || null,
          is_global: metric.is_global || false,
          created_by: metric.created_by,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating metric:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<AssessmentMetric>): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('assessment_metrics')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating metric:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('assessment_metrics')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting metric:', error);
      return false;
    }
  }

  static async getSimulationMetrics(simulationId: string): Promise<SimulationMetric[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('simulation_metrics')
        .select(`
          *,
          metric:assessment_metrics(*)
        `)
        .eq('simulation_id', simulationId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching simulation metrics:', error);
      return [];
    }
  }

  static async addMetricToSimulation(
    simulationId: string,
    metricId: string,
    config: Partial<SimulationMetric>
  ): Promise<SimulationMetric | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('simulation_metrics')
        .insert({
          simulation_id: simulationId,
          metric_id: metricId,
          weight: config.weight || 1.0,
          is_required: config.is_required !== undefined ? config.is_required : true,
          custom_passing_threshold: config.custom_passing_threshold || null,
          show_to_learner: config.show_to_learner !== undefined ? config.show_to_learner : true,
          display_order: config.display_order || 0,
          custom_label: config.custom_label || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding metric to simulation:', error);
      return null;
    }
  }

  static async removeMetricFromSimulation(
    simulationId: string,
    metricId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulation_metrics')
        .delete()
        .eq('simulation_id', simulationId)
        .eq('metric_id', metricId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing metric from simulation:', error);
      return false;
    }
  }

  static async getSimulationCompetencies(simulationId: string): Promise<SimulationCompetency[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('simulation_competencies')
        .select(`
          *,
          competency:competencies(*)
        `)
        .eq('simulation_id', simulationId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching simulation competencies:', error);
      return [];
    }
  }

  static async addCompetencyToSimulation(
    simulationId: string,
    competencyId: string,
    config: Partial<SimulationCompetency>
  ): Promise<SimulationCompetency | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('simulation_competencies')
        .insert({
          simulation_id: simulationId,
          competency_id: competencyId,
          is_primary: config.is_primary || false,
          target_level: config.target_level || 3,
          is_prerequisite: config.is_prerequisite || false,
          prerequisite_level: config.prerequisite_level || null,
          display_order: config.display_order || 0,
          show_in_results: config.show_in_results !== undefined ? config.show_in_results : true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding competency to simulation:', error);
      return null;
    }
  }

  static async removeCompetencyFromSimulation(
    simulationId: string,
    competencyId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulation_competencies')
        .delete()
        .eq('simulation_id', simulationId)
        .eq('competency_id', competencyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing competency from simulation:', error);
      return false;
    }
  }
}
