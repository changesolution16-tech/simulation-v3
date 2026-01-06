import { supabase } from './supabase';
import { AssessmentMetric } from './competencies';

export interface OptionMetricScore {
  id: string;
  scenario_id: string;
  option_id: string;
  metric_id: string;
  score_value: number;
  score_description?: string;
  competency_impacts?: Record<string, any>;
  weight: number;
  is_primary_metric: boolean;
  configured_by?: string;
  configuration_notes?: string;
  created_at: string;
  updated_at: string;
  metric?: AssessmentMetric;
}

export interface MetricAssessment {
  id: string;
  learner_id: string;
  simulation_instance_id?: string;
  scenario_id: string;
  option_id: string;
  metric_id: string;
  score_achieved: number;
  metric_min_score: number;
  metric_max_score: number;
  metric_passing_threshold?: number;
  passed_threshold: boolean;
  performance_level: 'below_threshold' | 'meets_threshold' | 'exceeds_threshold' | 'exemplary';
  decision_timestamp: string;
  competencies_impacted?: Record<string, any>;
  assessment_notes?: string;
  created_at: string;
  metric?: AssessmentMetric;
}

export class MetricScoreService {
  static async getOptionMetrics(
    scenarioId: string,
    optionId: string
  ): Promise<OptionMetricScore[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('scenario_option_metrics')
        .select(`
          *,
          metric:assessment_metrics(*)
        `)
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId)
        .order('is_primary_metric', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricScoreService] Error fetching option metrics:', error);
      return [];
    }
  }

  static async setOptionMetric(params: {
    scenarioId: string;
    optionId: string;
    metricId: string;
    scoreValue: number;
    scoreDescription?: string;
    competencyImpacts?: Record<string, any>;
    weight?: number;
    isPrimaryMetric?: boolean;
  }): Promise<OptionMetricScore | null> {
    if (!supabase) return null;

    const {
      scenarioId,
      optionId,
      metricId,
      scoreValue,
      scoreDescription,
      competencyImpacts,
      weight,
      isPrimaryMetric
    } = params;

    try {
      const { data, error } = await supabase
        .from('scenario_option_metrics')
        .upsert(
          {
            scenario_id: scenarioId,
            option_id: optionId,
            metric_id: metricId,
            score_value: scoreValue,
            score_description: scoreDescription,
            competency_impacts: competencyImpacts || {},
            weight: weight ?? 1.0,
            is_primary_metric: isPrimaryMetric ?? false,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'scenario_id,option_id,metric_id'
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MetricScoreService] Error setting option metric:', error);
      return null;
    }
  }

  static async removeOptionMetric(
    scenarioId: string,
    optionId: string,
    metricId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('scenario_option_metrics')
        .delete()
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId)
        .eq('metric_id', metricId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricScoreService] Error removing option metric:', error);
      return false;
    }
  }

  static async recordMetricAssessments(
    learnerId: string,
    simulationInstanceId: string,
    scenarioId: string,
    optionId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.rpc('record_metric_assessment', {
        p_learner_id: learnerId,
        p_simulation_instance_id: simulationInstanceId,
        p_scenario_id: scenarioId,
        p_option_id: optionId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricScoreService] Error recording metric assessments:', error);
      return false;
    }
  }

  static async getLearnerMetricAssessments(
    learnerId: string,
    simulationInstanceId?: string
  ): Promise<MetricAssessment[]> {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('learner_metric_assessments')
        .select(`
          *,
          metric:assessment_metrics(*)
        `)
        .eq('learner_id', learnerId)
        .order('decision_timestamp', { ascending: false });

      if (simulationInstanceId) {
        query = query.eq('simulation_instance_id', simulationInstanceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricScoreService] Error fetching learner assessments:', error);
      return [];
    }
  }

  static async getMetricSummary(
    learnerId: string,
    metricId: string
  ): Promise<{
    totalAssessments: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  } | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('learner_metric_assessments')
        .select('score_achieved, passed_threshold')
        .eq('learner_id', learnerId)
        .eq('metric_id', metricId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalAssessments: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0
        };
      }

      const scores = data.map(d => d.score_achieved);
      const totalAssessments = scores.length;
      const averageScore = scores.reduce((sum, s) => sum + s, 0) / totalAssessments;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const passedCount = data.filter(d => d.passed_threshold).length;
      const passRate = (passedCount / totalAssessments) * 100;

      return {
        totalAssessments,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        passRate: Math.round(passRate * 100) / 100
      };
    } catch (error) {
      console.error('[MetricScoreService] Error getting metric summary:', error);
      return null;
    }
  }

  static async bulkSetOptionMetrics(
    scenarioId: string,
    optionId: string,
    metrics: Array<{
      metricId: string;
      scoreValue: number;
      scoreDescription?: string;
      isPrimaryMetric?: boolean;
    }>
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      await supabase
        .from('scenario_option_metrics')
        .delete()
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId);

      if (metrics.length === 0) {
        return true;
      }

      const inserts = metrics.map(m => ({
        scenario_id: scenarioId,
        option_id: optionId,
        metric_id: m.metricId,
        score_value: m.scoreValue,
        score_description: m.scoreDescription,
        is_primary_metric: m.isPrimaryMetric ?? false,
        weight: 1.0
      }));

      const { error } = await supabase
        .from('scenario_option_metrics')
        .insert(inserts);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricScoreService] Error bulk setting metrics:', error);
      return false;
    }
  }
}
