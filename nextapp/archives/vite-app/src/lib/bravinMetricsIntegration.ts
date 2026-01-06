import { supabase } from './supabase';
import { BravinMetricsService } from './bravinMetrics';
import { MetricScoreService } from './metricScores';

export class BravinMetricsIntegration {
  static async getBravinMetricIds(): Promise<{
    bravin_alignment?: string;
    trust_impact?: string;
    ethical_decision_quality?: string;
    emotional_intelligence_index?: string;
    cultural_stewardship?: string;
  }> {
    if (!supabase) return {};

    try {
      const { data, error } = await supabase
        .from('assessment_metrics')
        .select('id, metric_type')
        .in('metric_type', [
          'bravin_alignment',
          'trust_impact',
          'ethical_decision_quality',
          'emotional_intelligence_index',
          'cultural_stewardship'
        ]);

      if (error) throw error;

      const result: any = {};
      data?.forEach(metric => {
        result[metric.metric_type] = metric.id;
      });

      return result;
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error fetching BRAVIN metric IDs:', error);
      return {};
    }
  }

  static async recordBravinMetricAssessments(params: {
    learnerId: string;
    scenarioId: string;
    optionId: string;
    simulationInstanceId?: string;
  }): Promise<void> {
    if (!supabase) return;

    const { learnerId, scenarioId, optionId, simulationInstanceId } = params;

    try {
      const mapping = await BravinMetricsService.getScenarioOptionMapping(scenarioId, optionId);
      if (!mapping) return;

      const assessment = await BravinMetricsService.recordDecision({
        learnerId,
        scenarioId,
        optionId,
        simulationInstanceId,
        mapping
      });

      if (!assessment) return;

      const metricIds = await this.getBravinMetricIds();

      const metricAssessments = [
        {
          metricId: metricIds.bravin_alignment,
          score: this.calculateOverallBravinScore(assessment),
          metricType: 'bravin_alignment'
        },
        {
          metricId: metricIds.trust_impact,
          score: assessment.trust_impact_score || 0,
          metricType: 'trust_impact'
        },
        {
          metricId: metricIds.ethical_decision_quality,
          score: assessment.ethical_quality_score || 0,
          metricType: 'ethical_decision_quality'
        },
        {
          metricId: metricIds.emotional_intelligence_index,
          score: ((assessment.ei_recognition_score || 0) + (assessment.ei_response_score || 0)) / 2,
          metricType: 'emotional_intelligence_index'
        },
        {
          metricId: metricIds.cultural_stewardship,
          score: assessment.cultural_alignment_score || 0,
          metricType: 'cultural_stewardship'
        }
      ];

      for (const metricAssessment of metricAssessments) {
        if (!metricAssessment.metricId) continue;

        const metricInfo = await this.getMetricInfo(metricAssessment.metricId);
        if (!metricInfo) continue;

        const performanceLevel = this.calculatePerformanceLevel(
          metricAssessment.score,
          metricInfo.passing_threshold,
          metricInfo.max_score
        );

        const passedThreshold = metricInfo.metric_type === 'trust_impact'
          ? metricAssessment.score >= 0
          : metricAssessment.score >= metricInfo.passing_threshold;

        await supabase.from('learner_metric_assessments').insert({
          learner_id: learnerId,
          metric_id: metricAssessment.metricId,
          simulation_instance_id: simulationInstanceId,
          scenario_id: scenarioId,
          option_id: optionId,
          score_achieved: metricAssessment.score,
          performance_level: performanceLevel,
          passed_threshold: passedThreshold,
          assessment_notes: `Calculated from BRAVIN decision assessment`,
          competency_impacts: {}
        });
      }
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error recording assessments:', error);
    }
  }

  private static calculateOverallBravinScore(assessment: any): number {
    const impacts = [
      assessment.boldness_impact || 0,
      assessment.responsibility_impact || 0,
      assessment.accountability_impact || 0,
      assessment.vision_impact || 0,
      assessment.integrity_impact || 0,
      assessment.nurturance_impact || 0
    ];

    const avgImpact = impacts.reduce((sum, impact) => sum + impact, 0) / 6;
    return Math.max(0, Math.min(100, 50 + avgImpact));
  }

  private static async getMetricInfo(metricId: string): Promise<any> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('assessment_metrics')
        .select('*')
        .eq('id', metricId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error fetching metric info:', error);
      return null;
    }
  }

  private static calculatePerformanceLevel(
    score: number,
    threshold: number,
    maxScore: number
  ): string {
    if (score >= maxScore * 0.95) return 'exemplary';
    if (score >= maxScore * 0.85) return 'exceeds_threshold';
    if (score >= threshold) return 'meets_threshold';
    return 'below_threshold';
  }

  static async getBravinAssessmentResults(
    learnerId: string,
    simulationInstanceId?: string
  ): Promise<any> {
    return BravinMetricsService.getAssessmentResult(learnerId, simulationInstanceId);
  }

  static async getLearnerBravinScores(learnerId: string): Promise<any[]> {
    return BravinMetricsService.getLearnerScores(learnerId);
  }

  static async getAllBravinDimensions(): Promise<any[]> {
    return BravinMetricsService.getAllDimensions();
  }
}
