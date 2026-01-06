import db from './db';
import type { AssessmentMetric } from './competencies';

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
    try {
      const result = await db`
        SELECT
          som.*,
          jsonb_build_object(
            'id', am.id,
            'name', am.name,
            'metric_type', am.metric_type,
            'min_score', am.min_score,
            'max_score', am.max_score,
            'passing_threshold', am.passing_threshold
          ) as metric
        FROM scenario_option_metrics som
        LEFT JOIN assessment_metrics am ON som.metric_id = am.id
        WHERE som.scenario_id = ${scenarioId} AND som.option_id = ${optionId}
        ORDER BY som.is_primary_metric DESC, som.created_at ASC
      `;
      return result as unknown as OptionMetricScore[];
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
      const existing = await db`
        SELECT id FROM scenario_option_metrics
        WHERE scenario_id = ${scenarioId}
          AND option_id = ${optionId}
          AND metric_id = ${metricId}
      `;

      if (existing.length > 0) {
        const result = await db`
          UPDATE scenario_option_metrics
          SET
            score_value = ${scoreValue},
            score_description = ${scoreDescription || null},
            competency_impacts = ${JSON.stringify(competencyImpacts || {})},
            weight = ${weight ?? 1.0},
            is_primary_metric = ${isPrimaryMetric ?? false},
            updated_at = NOW()
          WHERE id = ${existing[0].id}
          RETURNING *
        `;
        return (result[0] as any) || null;
      } else {
        const result = await db`
          INSERT INTO scenario_option_metrics (
            scenario_id, option_id, metric_id, score_value,
            score_description, competency_impacts, weight, is_primary_metric
          ) VALUES (
            ${scenarioId}, ${optionId}, ${metricId}, ${scoreValue},
            ${scoreDescription || null}, ${JSON.stringify(competencyImpacts || {})},
            ${weight ?? 1.0}, ${isPrimaryMetric ?? false}
          )
          RETURNING *
        `;
        return (result[0] as any) || null;
      }
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
    try {
      await db`
        DELETE FROM scenario_option_metrics
        WHERE scenario_id = ${scenarioId}
          AND option_id = ${optionId}
          AND metric_id = ${metricId}
      `;
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
    try {
      const optionMetrics = await this.getOptionMetrics(scenarioId, optionId);

      if (optionMetrics.length === 0) return true;

      const assessments = optionMetrics.map(om => {
        const metric = om.metric;
        if (!metric) return null;

        const scoreAchieved = om.score_value;
        const passingThreshold = metric.passing_threshold || 70;
        const passedThreshold = scoreAchieved >= passingThreshold;

        let performanceLevel: MetricAssessment['performance_level'] = 'below_threshold';
        if (scoreAchieved >= metric.max_score * 0.95) performanceLevel = 'exemplary';
        else if (scoreAchieved >= metric.max_score * 0.85) performanceLevel = 'exceeds_threshold';
        else if (scoreAchieved >= passingThreshold) performanceLevel = 'meets_threshold';

        return {
          learner_id: learnerId,
          simulation_instance_id: simulationInstanceId,
          scenario_id: scenarioId,
          option_id: optionId,
          metric_id: om.metric_id,
          score_achieved: scoreAchieved,
          metric_min_score: metric.min_score,
          metric_max_score: metric.max_score,
          metric_passing_threshold: passingThreshold,
          passed_threshold: passedThreshold,
          performance_level: performanceLevel,
          decision_timestamp: new Date().toISOString(),
          competencies_impacted: om.competency_impacts || {},
          assessment_notes: om.score_description
        };
      }).filter(a => a !== null);

      if (assessments.length > 0) {
        await db`
          INSERT INTO learner_metric_assessments ${db(assessments)}
        `;
      }

      for (const assessment of assessments) {
        if (assessment && assessment.competencies_impacted) {
          const impacts = assessment.competencies_impacted as Record<string, number>;
          for (const [competencyId, impact] of Object.entries(impacts)) {
            if (typeof impact === 'number') {
              const { CompetencyService } = await import('./competencies');
              await CompetencyService.updateLearnerCompetency(
                learnerId,
                competencyId,
                impact
              );
            }
          }
        }
      }

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
    try {
      let query;
      if (simulationInstanceId) {
        query = db`
          SELECT
            lma.*,
            jsonb_build_object(
              'id', am.id,
              'name', am.name,
              'metric_type', am.metric_type
            ) as metric
          FROM learner_metric_assessments lma
          LEFT JOIN assessment_metrics am ON lma.metric_id = am.id
          WHERE lma.learner_id = ${learnerId}
            AND lma.simulation_instance_id = ${simulationInstanceId}
          ORDER BY lma.decision_timestamp DESC
        `;
      } else {
        query = db`
          SELECT
            lma.*,
            jsonb_build_object(
              'id', am.id,
              'name', am.name,
              'metric_type', am.metric_type
            ) as metric
          FROM learner_metric_assessments lma
          LEFT JOIN assessment_metrics am ON lma.metric_id = am.id
          WHERE lma.learner_id = ${learnerId}
          ORDER BY lma.decision_timestamp DESC
        `;
      }

      const result = await query;
      return result as unknown as MetricAssessment[];
    } catch (error) {
      console.error('[MetricScoreService] Error fetching learner metric assessments:', error);
      return [];
    }
  }

  static async getAggregatedMetricScores(
    learnerId: string,
    simulationInstanceId: string
  ): Promise<Record<string, { average: number; count: number; passed: number }>> {
    try {
      const result = await db`
        SELECT
          metric_id,
          AVG(score_achieved) as average,
          COUNT(*) as count,
          SUM(CASE WHEN passed_threshold THEN 1 ELSE 0 END) as passed
        FROM learner_metric_assessments
        WHERE learner_id = ${learnerId}
          AND simulation_instance_id = ${simulationInstanceId}
        GROUP BY metric_id
      `;

      const aggregated: Record<string, any> = {};
      for (const row of result) {
        aggregated[row.metric_id] = {
          average: parseFloat(row.average),
          count: parseInt(row.count),
          passed: parseInt(row.passed)
        };
      }

      return aggregated;
    } catch (error) {
      console.error('[MetricScoreService] Error fetching aggregated metric scores:', error);
      return {};
    }
  }
}
