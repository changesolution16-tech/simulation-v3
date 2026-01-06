import { supabase } from './supabase';

/**
 * Service for handling simulation completion and score calculation
 */
export class SimulationCompletionService {
  /**
   * Mark a simulation instance as completed and calculate final scores
   */
  static async completeSimulation(instanceId: string): Promise<{
    success: boolean;
    scores?: {
      final_score: number;
      bravin_score: number;
      metrics_score: number;
    };
    error?: string;
  }> {
    if (!instanceId) {
      return { success: false, error: 'Instance ID is required' };
    }

    try {
      console.log('[SimulationCompletion] Marking instance as completed:', instanceId);

      // Call the database function to complete the simulation
      const { data, error } = await supabase.rpc('complete_simulation_instance', {
        p_instance_id: instanceId
      });

      if (error) {
        console.error('[SimulationCompletion] Error completing simulation:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        console.warn('[SimulationCompletion] No data returned from completion');
        return { success: false, error: 'No data returned from completion' };
      }

      console.log('[SimulationCompletion] Simulation completed successfully:', data);

      return {
        success: true,
        scores: data.scores ? {
          final_score: data.scores.final_score || 0,
          bravin_score: data.scores.bravin_score || 0,
          metrics_score: data.scores.metrics_score || 0
        } : undefined
      };
    } catch (error) {
      console.error('[SimulationCompletion] Exception completing simulation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the best (highest scoring) attempt for a learner-simulation pair
   */
  static async getBestAttempt(
    learnerId: string,
    simulationId: string
  ): Promise<any | null> {
    try {
      const { data, error } = await supabase.rpc('get_best_simulation_attempt', {
        p_learner_id: learnerId,
        p_simulation_id: simulationId
      });

      if (error) {
        console.error('[SimulationCompletion] Error fetching best attempt:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('[SimulationCompletion] Exception fetching best attempt:', error);
      return null;
    }
  }

  /**
   * Get all attempts for a learner-simulation pair
   */
  static async getAllAttempts(
    learnerId: string,
    simulationId: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_simulation_attempts', {
        p_learner_id: learnerId,
        p_simulation_id: simulationId
      });

      if (error) {
        console.error('[SimulationCompletion] Error fetching all attempts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SimulationCompletion] Exception fetching all attempts:', error);
      return [];
    }
  }

  /**
   * Compare two simulation attempts
   */
  static async compareAttempts(
    instanceId1: string,
    instanceId2: string
  ): Promise<any | null> {
    try {
      const { data, error } = await supabase.rpc('compare_simulation_attempts', {
        p_instance_id_1: instanceId1,
        p_instance_id_2: instanceId2
      });

      if (error) {
        console.error('[SimulationCompletion] Error comparing attempts:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SimulationCompletion] Exception comparing attempts:', error);
      return null;
    }
  }

  /**
   * Recalculate scores for a specific instance (for data recovery)
   */
  static async recalculateScores(instanceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('calculate_final_scores', {
        p_instance_id: instanceId
      });

      if (error) {
        console.error('[SimulationCompletion] Error recalculating scores:', error);
        return false;
      }

      console.log('[SimulationCompletion] Scores recalculated:', data);
      return true;
    } catch (error) {
      console.error('[SimulationCompletion] Exception recalculating scores:', error);
      return false;
    }
  }

  /**
   * Get detailed simulation progress including scores
   */
  static async getSimulationProgress(
    learnerId: string,
    simulationId: string
  ): Promise<any | null> {
    try {
      const { data, error } = await supabase.rpc('get_simulation_progress', {
        p_learner_id: learnerId,
        p_simulation_id: simulationId
      });

      if (error) {
        console.error('[SimulationCompletion] Error fetching progress:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('[SimulationCompletion] Exception fetching progress:', error);
      return null;
    }
  }
}
