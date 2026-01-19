import db from './db';

export interface BravinDimensionScores {
  boldness_impact: number;
  responsibility_impact: number;
  accountability_impact: number;
  vision_impact: number;
  integrity_impact: number;
  nurturance_impact: number;
}

export interface BravinAssessment extends BravinDimensionScores {
  id: string;
  learner_id: string;
  scenario_id: string;
  option_id: string;
  simulation_instance_id?: string;
  trust_impact_score?: number;
  ethical_quality_score?: number;
  ei_recognition_score?: number;
  ei_response_score?: number;
  cultural_alignment_score?: number;
  overall_bravin_score: number;
  created_at: string;
}

export class BravinMetricsIntegration {
  static async getBravinMetricIds(): Promise<{
    bravin_alignment?: string;
    trust_impact?: string;
    ethical_decision_quality?: string;
    emotional_intelligence_index?: string;
    cultural_stewardship?: string;
  }> {
    try {
      const result = await db`
        SELECT id, metric_type
        FROM assessment_metrics
        WHERE metric_type IN (
          'bravin_alignment',
          'trust_impact',
          'ethical_decision_quality',
          'emotional_intelligence_index',
          'cultural_stewardship'
        )
      `;

      const metricIds: any = {};
      result.forEach((metric: any) => {
        metricIds[metric.metric_type] = metric.id;
      });

      return metricIds;
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
    const { learnerId, scenarioId, optionId, simulationInstanceId } = params;

    try {
      const mapping = await this.getScenarioOptionMapping(scenarioId, optionId);
      if (!mapping) return;

      const assessment = await this.recordDecision({
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

        await db`
          INSERT INTO learner_metric_assessments (
            learner_id, metric_id, simulation_instance_id, scenario_id,
            option_id, score_achieved, performance_level, passed_threshold,
            assessment_notes, competency_impacts
          ) VALUES (
            ${learnerId}, ${metricAssessment.metricId}, ${simulationInstanceId || null},
            ${scenarioId}, ${optionId}, ${metricAssessment.score}, ${performanceLevel},
            ${passedThreshold}, 'Calculated from BRAVIN decision assessment', '{}'::jsonb
          )
        `;
      }
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error recording assessments:', error);
    }
  }

  private static async getScenarioOptionMapping(scenarioId: string, optionId: string): Promise<any> {
    try {
      const result = await db`
        SELECT * FROM bravin_scenario_option_mappings
        WHERE scenario_id = ${scenarioId} AND option_id = ${optionId}
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error fetching scenario option mapping:', error);
      return null;
    }
  }

  private static async recordDecision(params: {
    learnerId: string;
    scenarioId: string;
    optionId: string;
    simulationInstanceId?: string;
    mapping: any;
  }): Promise<BravinAssessment | null> {
    try {
      const { learnerId, scenarioId, optionId, simulationInstanceId, mapping } = params;

      const result = await db`
        INSERT INTO bravin_decision_assessments (
          learner_id, scenario_id, option_id, simulation_instance_id,
          boldness_impact, responsibility_impact, accountability_impact,
          vision_impact, integrity_impact, nurturance_impact,
          trust_impact_score, ethical_quality_score,
          ei_recognition_score, ei_response_score, cultural_alignment_score,
          overall_bravin_score
        ) VALUES (
          ${learnerId}, ${scenarioId}, ${optionId}, ${simulationInstanceId || null},
          ${mapping.boldness_impact || 0}, ${mapping.responsibility_impact || 0},
          ${mapping.accountability_impact || 0}, ${mapping.vision_impact || 0},
          ${mapping.integrity_impact || 0}, ${mapping.nurturance_impact || 0},
          ${mapping.trust_impact_score || 0}, ${mapping.ethical_quality_score || 0},
          ${mapping.ei_recognition_score || 0}, ${mapping.ei_response_score || 0},
          ${mapping.cultural_alignment_score || 0},
          ${this.calculateOverallBravinScore(mapping)}
        )
        RETURNING *
      `;

      return (result[0] as BravinAssessment) || null;
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error recording decision:', error);
      return null;
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
    try {
      const result = await db`
        SELECT * FROM assessment_metrics
        WHERE id = ${metricId}
      `;
      return (result[0] as any) || null;
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
  ): Promise<BravinAssessment[]> {
    try {
      let query;
      if (simulationInstanceId) {
        query = db`
          SELECT * FROM bravin_decision_assessments
          WHERE learner_id = ${learnerId}
            AND simulation_instance_id = ${simulationInstanceId}
          ORDER BY created_at DESC
        `;
      } else {
        query = db`
          SELECT * FROM bravin_decision_assessments
          WHERE learner_id = ${learnerId}
          ORDER BY created_at DESC
        `;
      }

      const result = await query;
      return result as unknown as BravinAssessment[];
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error fetching assessment results:', error);
      return [];
    }
  }

  static async getLearnerBravinScores(learnerId: string): Promise<any[]> {
    try {
      const result = await db`
        SELECT
          AVG(boldness_impact) as avg_boldness,
          AVG(responsibility_impact) as avg_responsibility,
          AVG(accountability_impact) as avg_accountability,
          AVG(vision_impact) as avg_vision,
          AVG(integrity_impact) as avg_integrity,
          AVG(nurturance_impact) as avg_nurturance,
          AVG(overall_bravin_score) as avg_overall_score,
          COUNT(*) as total_assessments
        FROM bravin_decision_assessments
        WHERE learner_id = ${learnerId}
      `;

      return result;
    } catch (error) {
      console.error('[BravinMetricsIntegration] Error fetching learner BRAVIN scores:', error);
      return [];
    }
  }

  static async getAllBravinDimensions(): Promise<any[]> {
    return [
      { code: 'B', name: 'Boldness', description: 'Courage to take calculated risks' },
      { code: 'R', name: 'Responsibility', description: 'Ownership of outcomes' },
      { code: 'A', name: 'Accountability', description: 'Answerability for decisions' },
      { code: 'V', name: 'Vision', description: 'Strategic thinking and foresight' },
      { code: 'I', name: 'Integrity', description: 'Ethical decision-making' },
      { code: 'N', name: 'Nurturance', description: 'Care for stakeholders and relationships' }
    ];
  }
}
