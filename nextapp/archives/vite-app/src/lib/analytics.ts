import { supabase } from './supabase';
import { LTIService } from './lti';

export interface SimulationInstance {
  id: string;
  resourceLinkId: string | null;
  learnerId: string;
  topicId: string;
  difficulty: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  totalScenariosCompleted: number;
  finalScore?: number;
  timeSpentSeconds: number;
}

export interface LearnerResponse {
  instanceId: string;
  attemptId: string;
  scenarioId: string;
  optionId: string;
  responseOrder: number;
  timeToDecisionSeconds: number;
  viewedVideos: boolean;
  videoWatchTimeSeconds: number;
}

export interface SkillAnalytics {
  skillName: string;
  currentLevel: number;
  totalPracticeInstances: number;
  trend: 'improving' | 'stable' | 'declining';
  lastPracticed: string;
}

export class AnalyticsService {

  static async createSimulationInstance(
    learnerId: string,
    topicId: string,
    difficulty: string,
    resourceLinkId?: string | null,
    simulationId?: string
  ): Promise<string | null> {
    try {
      let maxStage = 0;

      if (simulationId) {
        try {
          const { data: maxStageData } = await supabase
            .rpc('get_simulation_max_stage', { p_simulation_id: simulationId });

          if (maxStageData !== null) {
            maxStage = maxStageData;
          }
        } catch (rpcError) {
          console.log('[AnalyticsService] RPC function not available, calculating max_stage from scenarios');

          const { data: simScenarios } = await supabase
            .from('simulation_scenarios')
            .select(`
              scenarios (
                stage_number
              )
            `)
            .eq('simulation_id', simulationId);

          if (simScenarios && simScenarios.length > 0) {
            const stages = simScenarios
              .map((s: any) => s.scenarios?.stage_number)
              .filter((s: any) => s !== null && s !== undefined) as number[];

            if (stages.length > 0) {
              maxStage = Math.max(...stages);
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('simulation_instances')
        .insert({
          learner_id: learnerId,
          topic_id: topicId,
          difficulty,
          resource_link_id: resourceLinkId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          max_stage: maxStage,
          stages_completed: 0,
          decision_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating simulation instance:', error);
      return null;
    }
  }

  static async recordResponse(
    instanceId: string,
    attemptId: string,
    scenarioId: string,
    optionId: string,
    responseOrder: number,
    timeToDecision: number,
    viewedVideos: boolean = false,
    videoWatchTime: number = 0
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('learner_responses')
        .insert({
          instance_id: instanceId,
          attempt_id: attemptId,
          scenario_id: scenarioId,
          option_id: optionId,
          response_order: responseOrder,
          time_to_decision_seconds: timeToDecision,
          viewed_videos: viewedVideos,
          video_watch_time_seconds: videoWatchTime,
          responded_at: new Date().toISOString()
        });

      if (error) throw error;

      await supabase
        .from('simulation_instances')
        .update({
          total_scenarios_completed: responseOrder,
          decision_count: responseOrder
        })
        .eq('id', instanceId);

      return true;
    } catch (error) {
      console.error('Error recording response:', error);
      return false;
    }
  }

  static async updateStageProgress(
    instanceId: string,
    currentStageNumber: number
  ): Promise<boolean> {
    try {
      await supabase
        .from('simulation_instances')
        .update({
          stages_completed: currentStageNumber
        })
        .eq('id', instanceId);

      return true;
    } catch (error) {
      console.error('Error updating stage progress:', error);
      return false;
    }
  }

  // Deprecated: kept for backward compatibility
  static async updateLevelProgress(
    instanceId: string,
    currentHierarchyLevel: number
  ): Promise<boolean> {
    return this.updateStageProgress(instanceId, currentHierarchyLevel);
  }

  static async completeSimulation(
    instanceId: string,
    finalScore: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('simulation_instances')
        .update({
          completed_at: new Date().toISOString(),
          status: 'completed',
          final_score: finalScore
        })
        .eq('id', instanceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing simulation:', error);
      return false;
    }
  }

  static async createAttempt(
    instanceId: string,
    learnerId: string,
    attemptNumber: number,
    scenarioPath: string[],
    totalScore: number,
    skillScores: Record<string, number>
  ): Promise<string | null> {
    try {
      const strengths: string[] = [];
      const areasForImprovement: string[] = [];

      Object.entries(skillScores).forEach(([skill, score]) => {
        if (score >= 15) {
          strengths.push(skill);
        } else if (score < 5) {
          areasForImprovement.push(skill);
        }
      });

      const { data, error } = await supabase
        .from('learner_attempts')
        .insert({
          instance_id: instanceId,
          learner_id: learnerId,
          attempt_number: attemptNumber,
          scenario_path: scenarioPath,
          total_score: totalScore,
          skill_scores: skillScores,
          strengths,
          areas_for_improvement: areasForImprovement,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await this.updateSkillTracking(learnerId, skillScores);
      await this.generateLearningRecommendations(learnerId, data.id, areasForImprovement);

      return data.id;
    } catch (error) {
      console.error('Error creating attempt:', error);
      return null;
    }
  }

  static async updateSkillTracking(
    learnerId: string,
    skillScores: Record<string, number>
  ): Promise<void> {
    try {
      for (const [skillName, scoreChange] of Object.entries(skillScores)) {
        const { data: existing } = await supabase
          .from('skill_tracking')
          .select('*')
          .eq('learner_id', learnerId)
          .eq('skill_name', skillName)
          .maybeSingle();

        if (existing) {
          const newLevel = Math.max(0, existing.current_level + scoreChange);
          const trend = scoreChange > 0 ? 'improving' : scoreChange < 0 ? 'declining' : 'stable';

          await supabase
            .from('skill_tracking')
            .update({
              current_level: newLevel,
              total_practice_instances: existing.total_practice_instances + 1,
              trend,
              last_practiced: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('skill_tracking')
            .insert({
              learner_id: learnerId,
              skill_name: skillName,
              current_level: Math.max(0, scoreChange),
              total_practice_instances: 1,
              trend: scoreChange > 0 ? 'improving' : 'stable',
              last_practiced: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Error updating skill tracking:', error);
    }
  }

  static async generateLearningRecommendations(
    learnerId: string,
    attemptId: string,
    weakSkills: string[]
  ): Promise<void> {
    try {
      const recommendations = weakSkills.map((skill, index) => ({
        learner_id: learnerId,
        attempt_id: attemptId,
        weak_skill: skill,
        recommendation_type: 'practice',
        title: `Improve ${skill.replace(/_/g, ' ')}`,
        description: `Practice more scenarios focusing on ${skill.replace(/_/g, ' ')} to strengthen this skill area.`,
        priority: index + 1
      }));

      if (recommendations.length > 0) {
        await supabase
          .from('learning_recommendations')
          .insert(recommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  }

  static async submitGradeToMoodle(
    resourceLinkId: string,
    learnerId: string,
    attemptId: string,
    score: number
  ): Promise<boolean> {
    return await LTIService.submitGrade(
      resourceLinkId,
      learnerId,
      attemptId,
      score,
      100
    );
  }

  static async getLearnerProgress(learnerId: string): Promise<any> {
    try {
      const { data: instances } = await supabase
        .from('simulation_instances')
        .select('*')
        .eq('learner_id', learnerId)
        .order('started_at', { ascending: false });

      const { data: attempts } = await supabase
        .from('learner_attempts')
        .select('*')
        .eq('learner_id', learnerId)
        .order('completed_at', { ascending: false });

      const { data: skills } = await supabase
        .from('skill_tracking')
        .select('*')
        .eq('learner_id', learnerId)
        .order('current_level', { ascending: false });

      const { data: recommendations } = await supabase
        .from('learning_recommendations')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('is_completed', false)
        .order('priority', { ascending: true });

      return {
        instances,
        attempts,
        skills,
        recommendations
      };
    } catch (error) {
      console.error('Error fetching learner progress:', error);
      return null;
    }
  }

  static async getInstructorDashboard(contextId: string): Promise<any> {
    try {
      const { data: resourceLinks } = await supabase
        .from('lti_resource_links')
        .select('id')
        .eq('context_id', contextId);

      if (!resourceLinks || resourceLinks.length === 0) {
        return null;
      }

      const resourceLinkIds = resourceLinks.map(rl => rl.id);

      const { data: instances } = await supabase
        .from('simulation_instances')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .in('resource_link_id', resourceLinkIds);

      const { data: cohortStats } = await supabase
        .from('cohort_analytics')
        .select('*')
        .eq('context_id', contextId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        instances,
        cohortStats
      };
    } catch (error) {
      console.error('Error fetching instructor dashboard:', error);
      return null;
    }
  }

  static async recordEngagementMetrics(
    instanceId: string,
    learnerId: string,
    totalTimeSeconds: number,
    videosWatched: number,
    videoWatchTimeSeconds: number,
    scenariosVisited: number,
    avgDecisionTime: number
  ): Promise<void> {
    try {
      await supabase
        .from('engagement_metrics')
        .insert({
          instance_id: instanceId,
          learner_id: learnerId,
          total_time_seconds: totalTimeSeconds,
          videos_watched: videosWatched,
          total_video_watch_time_seconds: videoWatchTimeSeconds,
          scenarios_visited: scenariosVisited,
          average_decision_time_seconds: avgDecisionTime,
          recorded_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording engagement metrics:', error);
    }
  }
}
