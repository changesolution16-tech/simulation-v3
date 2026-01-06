import { supabase } from './supabase';

export interface AssessmentMetric {
  id: string;
  name: string;
  description?: string;
  metric_type: 'decision_quality' | 'timing' | 'critical_thinking' | 'emotional_intelligence' |
                'communication' | 'problem_solving' | 'adaptability' | 'collaboration' | 'custom';
  measurement_method: 'automatic' | 'rubric' | 'observation' | 'self_assessment' | 'peer_assessment';
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

export interface RubricTemplate {
  id: string;
  name: string;
  description?: string;
  rubric_type: 'holistic' | 'analytic';
  scale_type: 'likert_3' | 'likert_4' | 'likert_5' | 'percentage' | 'custom';
  scale_min: number;
  scale_max: number;
  applies_to_metrics?: string[];
  applies_to_scenarios?: string[];
  created_by?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  criteria?: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  criterion_name: string;
  criterion_description?: string;
  weight: number;
  display_order: number;
  level_descriptors: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface LearnerMetricWeight {
  id: string;
  learner_id: string;
  metric_id: string;
  assignment_id: string;
  weight_multiplier: number;
  custom_threshold?: number;
  focus_area: boolean;
  notes?: string;
  set_by?: string;
  created_at: string;
  updated_at: string;
}

export class MetricsService {
  static async getMetrics(): Promise<AssessmentMetric[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('assessment_metrics')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }

    return data;
  }

  static async getMetric(metricId: string): Promise<AssessmentMetric | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('assessment_metrics')
      .select('*')
      .eq('id', metricId)
      .single();

    if (error) {
      console.error('Error fetching metric:', error);
      return null;
    }

    return data;
  }

  static async createMetric(metricData: Partial<AssessmentMetric>): Promise<AssessmentMetric | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('assessment_metrics')
      .insert({
        name: metricData.name,
        description: metricData.description,
        metric_type: metricData.metric_type,
        measurement_method: metricData.measurement_method,
        min_score: metricData.min_score || 0,
        max_score: metricData.max_score || 100,
        passing_threshold: metricData.passing_threshold || 70,
        applies_to_topics: metricData.applies_to_topics,
        applies_to_scenarios: metricData.applies_to_scenarios,
        is_global: metricData.is_global ?? false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metric:', error);
      return null;
    }

    return data;
  }

  static async updateMetric(metricId: string, updates: Partial<AssessmentMetric>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('assessment_metrics')
      .update(updates)
      .eq('id', metricId);

    if (error) {
      console.error('Error updating metric:', error);
      return false;
    }

    return true;
  }

  static async getRubrics(): Promise<RubricTemplate[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('rubric_templates')
      .select(`
        *,
        rubric_criteria(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching rubrics:', error);
      return [];
    }

    return data.map((rubric: any) => ({
      ...rubric,
      criteria: rubric.rubric_criteria || []
    }));
  }

  static async getRubric(rubricId: string): Promise<RubricTemplate | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('rubric_templates')
      .select(`
        *,
        rubric_criteria(*)
      `)
      .eq('id', rubricId)
      .single();

    if (error) {
      console.error('Error fetching rubric:', error);
      return null;
    }

    return {
      ...data,
      criteria: data.rubric_criteria || []
    };
  }

  static async createRubric(rubricData: Partial<RubricTemplate>): Promise<RubricTemplate | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('rubric_templates')
      .insert({
        name: rubricData.name,
        description: rubricData.description,
        rubric_type: rubricData.rubric_type || 'analytic',
        scale_type: rubricData.scale_type || 'likert_5',
        scale_min: rubricData.scale_min || 1,
        scale_max: rubricData.scale_max || 5,
        applies_to_metrics: rubricData.applies_to_metrics,
        applies_to_scenarios: rubricData.applies_to_scenarios,
        is_public: rubricData.is_public ?? false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rubric:', error);
      return null;
    }

    return data;
  }

  static async addRubricCriterion(criterionData: Partial<RubricCriterion>): Promise<RubricCriterion | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('rubric_criteria')
      .insert({
        rubric_id: criterionData.rubric_id,
        criterion_name: criterionData.criterion_name,
        criterion_description: criterionData.criterion_description,
        weight: criterionData.weight || 1.0,
        display_order: criterionData.display_order || 0,
        level_descriptors: criterionData.level_descriptors || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding rubric criterion:', error);
      return null;
    }

    return data;
  }

  static async updateRubricCriterion(criterionId: string, updates: Partial<RubricCriterion>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('rubric_criteria')
      .update(updates)
      .eq('id', criterionId);

    if (error) {
      console.error('Error updating rubric criterion:', error);
      return false;
    }

    return true;
  }

  static async setLearnerMetricWeight(weightData: Partial<LearnerMetricWeight>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('learner_metric_weights')
      .upsert({
        learner_id: weightData.learner_id,
        metric_id: weightData.metric_id,
        assignment_id: weightData.assignment_id,
        weight_multiplier: weightData.weight_multiplier || 1.0,
        custom_threshold: weightData.custom_threshold,
        focus_area: weightData.focus_area ?? false,
        notes: weightData.notes
      }, {
        onConflict: 'learner_id,metric_id,assignment_id'
      });

    if (error) {
      console.error('Error setting learner metric weight:', error);
      return false;
    }

    return true;
  }

  static async getLearnerMetricWeights(learnerId: string, assignmentId: string): Promise<LearnerMetricWeight[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('learner_metric_weights')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('Error fetching learner metric weights:', error);
      return [];
    }

    return data;
  }
}
