import db from './db';

export interface SimulationScores {
  final_score: number;
  bravin_score: number;
  metrics_score: number;
}

export interface CompletionResult {
  success: boolean;
  scores?: SimulationScores;
  error?: string;
}

export interface SimulationAttempt {
  id: string;
  simulation_id: string;
  learner_id: string;
  attempt_number: number;
  status: string;
  final_score?: number;
  bravin_score?: number;
  metrics_score?: number;
  stages_completed: number;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
}

export class SimulationCompletionService {
  static async completeSimulation(instanceId: string): Promise<CompletionResult> {
    if (!instanceId) {
      return { success: false, error: 'Instance ID is required' };
    }

    try {
      console.log('[SimulationCompletion] Marking instance as completed:', instanceId);

      const instance = await db`
        SELECT * FROM simulation_instances
        WHERE id = ${instanceId}
      `;

      if (!instance || instance.length === 0) {
        return { success: false, error: 'Instance not found' };
      }

      const scores = await this.calculateFinalScores(instanceId);

      await db`
        UPDATE simulation_instances
        SET
          status = 'completed',
          completed_at = NOW(),
          final_score = ${scores.final_score},
          bravin_score = ${scores.bravin_score},
          metrics_score = ${scores.metrics_score}
        WHERE id = ${instanceId}
      `;

      console.log('[SimulationCompletion] Simulation completed successfully:', scores);

      return {
        success: true,
        scores
      };
    } catch (error) {
      console.error('[SimulationCompletion] Exception completing simulation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async calculateFinalScores(instanceId: string): Promise<SimulationScores> {
    try {
      const metricAssessments = await db`
        SELECT
          AVG(score_achieved) as avg_score,
          SUM(CASE WHEN passed_threshold THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100 as pass_rate
        FROM learner_metric_assessments
        WHERE simulation_instance_id = ${instanceId}
      `;

      const bravinAssessments = await db`
        SELECT AVG(
          (boldness_impact + responsibility_impact + accountability_impact +
           vision_impact + integrity_impact + nurturance_impact) / 6.0
        ) as avg_bravin_score
        FROM bravin_assessments
        WHERE simulation_instance_id = ${instanceId}
      `;

      const metricsScore = metricAssessments[0]?.avg_score
        ? parseFloat(metricAssessments[0].avg_score)
        : 0;

      const bravinScore = bravinAssessments[0]?.avg_bravin_score
        ? Math.max(0, Math.min(100, 50 + parseFloat(bravinAssessments[0].avg_bravin_score)))
        : 0;

      const finalScore = bravinScore > 0
        ? (metricsScore * 0.6 + bravinScore * 0.4)
        : metricsScore;

      return {
        final_score: Math.round(finalScore * 10) / 10,
        bravin_score: Math.round(bravinScore * 10) / 10,
        metrics_score: Math.round(metricsScore * 10) / 10
      };
    } catch (error) {
      console.error('[SimulationCompletion] Error calculating scores:', error);
      return {
        final_score: 0,
        bravin_score: 0,
        metrics_score: 0
      };
    }
  }

  static async getBestAttempt(
    learnerId: string,
    simulationId: string
  ): Promise<SimulationAttempt | null> {
    try {
      const result = await db`
        SELECT *
        FROM simulation_instances
        WHERE learner_id = ${learnerId}
          AND simulation_id = ${simulationId}
          AND status = 'completed'
        ORDER BY final_score DESC NULLS LAST, completed_at DESC
        LIMIT 1
      `;

      return (result[0] as any) || null;
    } catch (error) {
      console.error('[SimulationCompletion] Error fetching best attempt:', error);
      return null;
    }
  }

  static async getAllAttempts(
    learnerId: string,
    simulationId: string
  ): Promise<SimulationAttempt[]> {
    try {
      const result = await db`
        SELECT *
        FROM simulation_instances
        WHERE learner_id = ${learnerId}
          AND simulation_id = ${simulationId}
        ORDER BY attempt_number DESC, started_at DESC
      `;

      return result as unknown as SimulationAttempt[];
    } catch (error) {
      console.error('[SimulationCompletion] Error fetching all attempts:', error);
      return [];
    }
  }

  static async compareAttempts(
    instanceId1: string,
    instanceId2: string
  ): Promise<any | null> {
    try {
      const attempts = await db`
        SELECT
          id,
          attempt_number,
          final_score,
          bravin_score,
          metrics_score,
          stages_completed,
          started_at,
          completed_at,
          EXTRACT(EPOCH FROM (completed_at - started_at))::int as time_spent_seconds
        FROM simulation_instances
        WHERE id IN (${instanceId1}, ${instanceId2})
        ORDER BY attempt_number
      `;

      if (attempts.length !== 2) {
        return null;
      }

      const [attempt1, attempt2] = attempts;

      return {
        attempt1,
        attempt2,
        improvements: {
          final_score_diff: (attempt2.final_score || 0) - (attempt1.final_score || 0),
          bravin_score_diff: (attempt2.bravin_score || 0) - (attempt1.bravin_score || 0),
          metrics_score_diff: (attempt2.metrics_score || 0) - (attempt1.metrics_score || 0),
          time_improvement: (attempt1.time_spent_seconds || 0) - (attempt2.time_spent_seconds || 0)
        }
      };
    } catch (error) {
      console.error('[SimulationCompletion] Error comparing attempts:', error);
      return null;
    }
  }

  static async recalculateScores(instanceId: string): Promise<boolean> {
    try {
      const scores = await this.calculateFinalScores(instanceId);

      await db`
        UPDATE simulation_instances
        SET
          final_score = ${scores.final_score},
          bravin_score = ${scores.bravin_score},
          metrics_score = ${scores.metrics_score}
        WHERE id = ${instanceId}
      `;

      console.log('[SimulationCompletion] Scores recalculated:', scores);
      return true;
    } catch (error) {
      console.error('[SimulationCompletion] Error recalculating scores:', error);
      return false;
    }
  }

  static async getSimulationProgress(instanceId: string): Promise<{
    total_scenarios: number;
    completed_scenarios: number;
    progress_percentage: number;
  }> {
    try {
      const instance = await db`
        SELECT simulation_id, stages_completed FROM simulation_instances
        WHERE id = ${instanceId}
      `;

      if (!instance || instance.length === 0) {
        return { total_scenarios: 0, completed_scenarios: 0, progress_percentage: 0 };
      }

      const scenarios = await db`
        SELECT COUNT(*) as total
        FROM scenarios
        WHERE simulation_id = ${instance[0].simulation_id}
      `;

      const totalScenarios = parseInt(scenarios[0]?.total || '0');
      const completedScenarios = instance[0].stages_completed || 0;
      const progressPercentage = totalScenarios > 0
        ? Math.round((completedScenarios / totalScenarios) * 100)
        : 0;

      return {
        total_scenarios: totalScenarios,
        completed_scenarios: completedScenarios,
        progress_percentage: progressPercentage
      };
    } catch (error) {
      console.error('[SimulationCompletion] Error getting simulation progress:', error);
      return { total_scenarios: 0, completed_scenarios: 0, progress_percentage: 0 };
    }
  }
}
