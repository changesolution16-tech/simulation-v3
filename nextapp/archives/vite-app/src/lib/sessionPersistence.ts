import { supabase } from './supabase';
import { SimulationSession } from '../store';

export interface SessionStateData {
  instanceId: string;
  simulationId: string;
  currentScenarioId: string | null;
  currentScenarioIndex: number;
  competencyScores: Record<string, number>;
  decisionHistory: Array<{
    scenarioId: string;
    optionId: string;
    timestamp: number;
  }>;
  pathTaken: string[];
  startedAt: number;
  currentLevel?: number;
  levelsCompleted?: number;
}

export class SessionPersistenceService {
  /**
   * Save complete session state to database
   */
  static async saveSessionState(session: SimulationSession): Promise<boolean> {
    if (!supabase || !session.instanceId) {
      console.warn('[SessionPersistence] Cannot save session - no instance ID or Supabase not configured');
      return false;
    }

    try {
      const sessionData = {
        selectedOptionId: session.selectedOptionId,
        startedAt: session.startedAt,
        currentLevel: session.currentLevel,
        levelsCompleted: session.levelsCompleted
      };

      const pathTaken = session.decisionHistory.map(d => d.scenarioId);

      const { error } = await supabase.rpc('sync_simulation_session_state', {
        p_instance_id: session.instanceId,
        p_current_scenario_id: session.decisionHistory.length > 0
          ? session.decisionHistory[session.decisionHistory.length - 1].scenarioId
          : null,
        p_current_scenario_index: session.currentScenarioIndex,
        p_session_data: sessionData,
        p_competency_scores: session.competencyScores,
        p_decision_history: session.decisionHistory,
        p_path_taken: pathTaken
      });

      if (error) {
        console.error('[SessionPersistence] Error saving session state:', error);
        return false;
      }

      console.log('[SessionPersistence] Session state saved successfully');
      return true;
    } catch (error) {
      console.error('[SessionPersistence] Exception saving session state:', error);
      return false;
    }
  }

  /**
   * Restore session state from database
   */
  static async restoreSessionState(instanceId: string): Promise<SessionStateData | null> {
    if (!supabase) {
      console.warn('[SessionPersistence] Supabase not configured');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_simulation_session_state', {
        p_instance_id: instanceId
      });

      if (error) {
        console.error('[SessionPersistence] Error restoring session state:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('[SessionPersistence] No session state found for instance:', instanceId);
        return null;
      }

      const sessionRecord = data[0];
      const sessionData = sessionRecord.session_data || {};

      return {
        instanceId: sessionRecord.instance_id,
        simulationId: sessionRecord.simulation_id,
        currentScenarioId: sessionRecord.current_scenario_id,
        currentScenarioIndex: sessionRecord.current_scenario_index || 0,
        competencyScores: sessionRecord.competency_scores || {},
        decisionHistory: sessionRecord.decision_history || [],
        pathTaken: sessionRecord.path_taken || [],
        startedAt: sessionData.startedAt || new Date(sessionRecord.started_at).getTime(),
        currentLevel: sessionData.currentLevel,
        levelsCompleted: sessionData.levelsCompleted
      };
    } catch (error) {
      console.error('[SessionPersistence] Exception restoring session state:', error);
      return null;
    }
  }

  /**
   * Check if there's an active session for a user and simulation
   */
  static async findActiveSession(
    userId: string,
    simulationId: string
  ): Promise<string | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('simulation_instances')
        .select('id, last_activity_at')
        .eq('learner_id', userId)
        .eq('simulation_id', simulationId)
        .eq('status', 'in_progress')
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[SessionPersistence] Error finding active session:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      const lastActivity = new Date(data.last_activity_at);
      const now = new Date();
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceActivity > 24) {
        console.log('[SessionPersistence] Active session found but expired (>24 hours old)');
        return null;
      }

      console.log('[SessionPersistence] Active session found:', data.id);
      return data.id;
    } catch (error) {
      console.error('[SessionPersistence] Exception finding active session:', error);
      return null;
    }
  }

  /**
   * Update session activity timestamp (called on any user interaction)
   */
  static async updateActivityTimestamp(instanceId: string): Promise<void> {
    if (!supabase || !instanceId) return;

    try {
      await supabase
        .from('simulation_instances')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', instanceId);
    } catch (error) {
      console.error('[SessionPersistence] Error updating activity timestamp:', error);
    }
  }

  /**
   * Update pause/resume counts for analytics
   */
  static async recordPause(instanceId: string): Promise<void> {
    if (!supabase || !instanceId) return;

    try {
      await supabase.rpc('increment', {
        table_name: 'simulation_instances',
        row_id: instanceId,
        column_name: 'pause_count'
      }).catch(() => {
        supabase
          .from('simulation_instances')
          .select('pause_count')
          .eq('id', instanceId)
          .single()
          .then(({ data }) => {
            const currentCount = data?.pause_count || 0;
            supabase
              .from('simulation_instances')
              .update({ pause_count: currentCount + 1 })
              .eq('id', instanceId);
          });
      });
    } catch (error) {
      console.error('[SessionPersistence] Error recording pause:', error);
    }
  }

  static async recordResume(instanceId: string): Promise<void> {
    if (!supabase || !instanceId) return;

    try {
      await supabase.rpc('increment', {
        table_name: 'simulation_instances',
        row_id: instanceId,
        column_name: 'resume_count'
      }).catch(() => {
        supabase
          .from('simulation_instances')
          .select('resume_count')
          .eq('id', instanceId)
          .single()
          .then(({ data }) => {
            const currentCount = data?.resume_count || 0;
            supabase
              .from('simulation_instances')
              .update({ resume_count: currentCount + 1 })
              .eq('id', instanceId);
          });
      });
    } catch (error) {
      console.error('[SessionPersistence] Error recording resume:', error);
    }
  }

  /**
   * Update total decision time
   */
  static async addDecisionTime(instanceId: string, decisionTimeSeconds: number): Promise<void> {
    if (!supabase || !instanceId) return;

    try {
      const { data } = await supabase
        .from('simulation_instances')
        .select('total_decision_time_seconds')
        .eq('id', instanceId)
        .single();

      const currentTotal = data?.total_decision_time_seconds || 0;
      const newTotal = currentTotal + decisionTimeSeconds;

      await supabase
        .from('simulation_instances')
        .update({ total_decision_time_seconds: newTotal })
        .eq('id', instanceId);

      console.log(`[SessionPersistence] Updated total decision time: ${newTotal}s`);
    } catch (error) {
      console.error('[SessionPersistence] Error updating decision time:', error);
    }
  }

  /**
   * Update video watch time
   */
  static async addVideoWatchTime(instanceId: string, watchTimeSeconds: number): Promise<void> {
    if (!supabase || !instanceId) return;

    try {
      const { data } = await supabase
        .from('simulation_instances')
        .select('video_watch_time_seconds')
        .eq('id', instanceId)
        .single();

      const currentTotal = data?.video_watch_time_seconds || 0;
      const newTotal = currentTotal + watchTimeSeconds;

      await supabase
        .from('simulation_instances')
        .update({ video_watch_time_seconds: newTotal })
        .eq('id', instanceId);

      console.log(`[SessionPersistence] Updated video watch time: ${newTotal}s`);
    } catch (error) {
      console.error('[SessionPersistence] Error updating video watch time:', error);
    }
  }

  /**
   * Mark session as completed
   */
  static async completeSession(
    instanceId: string,
    finalScore: number,
    totalScenarios: number
  ): Promise<void> {
    if (!supabase || !instanceId) return;

    try {
      await supabase
        .from('simulation_instances')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_score: finalScore,
          total_scenarios_completed: totalScenarios
        })
        .eq('id', instanceId);

      console.log('[SessionPersistence] Session marked as completed');
    } catch (error) {
      console.error('[SessionPersistence] Error completing session:', error);
    }
  }
}
