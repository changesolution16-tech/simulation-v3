import { supabase } from './supabase';
import {
  BravinDimension,
  BravinLearnerScore,
  BravinDecisionAssessment,
  TrustImpactEvent,
  EthicalDecisionQualityAssessment,
  EmotionalIntelligenceAssessment,
  CulturalStewardshipLog,
  BravinScenarioOptionMapping,
  BravinAssessmentResult,
  BravinDimensionCode,
  TrustEventType,
  PressureLevel,
  ComplexityLevel
} from '../types';

export class BravinMetricsService {
  static async getAllDimensions(): Promise<BravinDimension[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('bravin_dimensions')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[BravinMetrics] Error fetching dimensions:', error);
      return [];
    }
  }

  static async getDimensionByCode(code: BravinDimensionCode): Promise<BravinDimension | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('bravin_dimensions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BravinMetrics] Error fetching dimension:', error);
      return null;
    }
  }

  static async getLearnerScores(learnerId: string): Promise<BravinLearnerScore[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('bravin_learner_scores')
        .select(`
          *,
          dimension:bravin_dimensions(*)
        `)
        .eq('learner_id', learnerId)
        .order('dimension(display_order)', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[BravinMetrics] Error fetching learner scores:', error);
      return [];
    }
  }

  static async getScenarioOptionMapping(
    scenarioId: string,
    optionId: string
  ): Promise<BravinScenarioOptionMapping | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('bravin_scenario_option_mappings')
        .select('*')
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BravinMetrics] Error fetching option mapping:', error);
      return null;
    }
  }

  static async recordDecision(params: {
    learnerId: string;
    scenarioId: string;
    optionId: string;
    simulationInstanceId?: string;
    mapping: BravinScenarioOptionMapping;
  }): Promise<BravinDecisionAssessment | null> {
    if (!supabase) return null;

    const { learnerId, scenarioId, optionId, simulationInstanceId, mapping } = params;

    try {
      const trustScore = this.calculateTrustImpactScore(mapping);
      const ethicalScore = this.calculateEthicalQualityScore(mapping);
      const eiRecognitionScore = this.calculateEIRecognitionScore(mapping);
      const eiResponseScore = this.calculateEIResponseScore(mapping);
      const culturalScore = this.calculateCulturalAlignmentScore(mapping);

      const assessment: Partial<BravinDecisionAssessment> = {
        learner_id: learnerId,
        simulation_instance_id: simulationInstanceId,
        scenario_id: scenarioId,
        option_id: optionId,
        decision_timestamp: new Date().toISOString(),

        boldness_impact: mapping.boldness_impact || 0,
        responsibility_impact: mapping.responsibility_impact || 0,
        accountability_impact: mapping.accountability_impact || 0,
        vision_impact: mapping.vision_impact || 0,
        integrity_impact: mapping.integrity_impact || 0,
        nurturance_impact: mapping.nurturance_impact || 0,

        trust_impact_score: trustScore,
        ethical_quality_score: ethicalScore,
        ei_recognition_score: eiRecognitionScore,
        ei_response_score: eiResponseScore,
        cultural_alignment_score: culturalScore,

        pressure_level: mapping.pressure_level,
        complexity_level: mapping.complexity_level,
        context_notes: {}
      };

      const { data, error } = await supabase
        .from('bravin_decision_assessments')
        .insert(assessment)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await this.processDecisionEffects(data, mapping);
        await this.updateLearnerScores(learnerId, data);
      }

      return data;
    } catch (error) {
      console.error('[BravinMetrics] Error recording decision:', error);
      return null;
    }
  }

  private static async processDecisionEffects(
    assessment: BravinDecisionAssessment,
    mapping: BravinScenarioOptionMapping
  ): Promise<void> {
    await Promise.all([
      this.processTrustImpact(assessment, mapping),
      this.processEthicalQuality(assessment, mapping),
      this.processEmotionalIntelligence(assessment, mapping),
      this.processCulturalStewardship(assessment, mapping)
    ]);
  }

  private static async processTrustImpact(
    assessment: BravinDecisionAssessment,
    mapping: BravinScenarioOptionMapping
  ): Promise<void> {
    if (!supabase || !mapping.trust_impact_config) return;

    const config = mapping.trust_impact_config as any;
    const trustScore = assessment.trust_impact_score || 0;

    let eventType: TrustEventType;
    if (trustScore > 10) eventType = 'trust_built';
    else if (trustScore < -10) eventType = 'trust_damaged';
    else if (Math.abs(trustScore) > 5) eventType = 'trust_maintained';
    else return;

    try {
      const event: Partial<TrustImpactEvent> = {
        learner_id: assessment.learner_id,
        decision_assessment_id: assessment.id,
        event_type: eventType,
        impact_magnitude: Math.abs(trustScore),

        boundaries_impact: config.boundaries_impact || 0,
        reliability_impact: config.reliability_impact || 0,
        accountability_impact: config.accountability_impact || 0,
        vault_confidentiality_impact: config.vault_impact || 0,
        integrity_impact: config.integrity_impact || 0,
        non_judgment_impact: config.non_judgment_impact || 0,
        generosity_impact: config.generosity_impact || 0,

        psychological_safety_indicator: config.psychological_safety || false,
        team_cohesion_impact: config.team_cohesion_impact || 0,
        transparency_level: config.transparency_level,
        recovery_possible: eventType !== 'trust_built',
        recovery_difficulty: this.assessRecoveryDifficulty(trustScore)
      };

      await supabase
        .from('trust_impact_events')
        .insert(event);
    } catch (error) {
      console.error('[BravinMetrics] Error processing trust impact:', error);
    }
  }

  private static async processEthicalQuality(
    assessment: BravinDecisionAssessment,
    mapping: BravinScenarioOptionMapping
  ): Promise<void> {
    if (!supabase || !mapping.ethical_quality_config) return;

    const config = mapping.ethical_quality_config as any;

    try {
      const ethicalAssessment: Partial<EthicalDecisionQualityAssessment> = {
        learner_id: assessment.learner_id,
        decision_assessment_id: assessment.id,

        values_alignment_score: config.values_alignment || 50,
        performance_impact_score: config.performance_impact || 50,
        stakeholder_consideration_score: config.stakeholder_consideration || 50,
        long_term_thinking_score: config.long_term_thinking || 50,

        under_pressure: mapping.pressure_level === 'high' || mapping.pressure_level === 'critical',
        pressure_source: config.pressure_source,
        pressure_intensity: this.pressureLevelToIntensity(mapping.pressure_level),

        values_performance_balance: this.calculateValuesPerformanceBalance(config),
        ethical_framework_used: config.framework_used,
        reasoning_quality: config.reasoning_quality || 'adequate'
      };

      await supabase
        .from('ethical_decision_quality_assessments')
        .insert(ethicalAssessment);
    } catch (error) {
      console.error('[BravinMetrics] Error processing ethical quality:', error);
    }
  }

  private static async processEmotionalIntelligence(
    assessment: BravinDecisionAssessment,
    mapping: BravinScenarioOptionMapping
  ): Promise<void> {
    if (!supabase || !mapping.ei_indicators_config) return;

    const config = mapping.ei_indicators_config as any;

    try {
      const eiAssessment: Partial<EmotionalIntelligenceAssessment> = {
        learner_id: assessment.learner_id,
        decision_assessment_id: assessment.id,

        self_awareness_score: config.self_awareness || 50,
        self_regulation_score: config.self_regulation || 50,
        motivation_score: config.motivation || 50,
        empathy_score: config.empathy || 50,
        social_skills_score: config.social_skills || 50,

        emotion_recognition_accuracy: assessment.ei_recognition_score,
        empathetic_response_quality: assessment.ei_response_score,
        emotional_regulation_demonstrated: config.regulation_demonstrated || false,

        authentic_dialogue_created: config.authentic_dialogue || false,
        psychological_space_provided: config.psychological_space || false,
        active_listening_indicators: config.listening_indicators || [],

        emotional_complexity: config.emotional_complexity,
        interpersonal_challenge_level: config.challenge_level
      };

      await supabase
        .from('emotional_intelligence_assessments')
        .insert(eiAssessment);
    } catch (error) {
      console.error('[BravinMetrics] Error processing EI:', error);
    }
  }

  private static async processCulturalStewardship(
    assessment: BravinDecisionAssessment,
    mapping: BravinScenarioOptionMapping
  ): Promise<void> {
    if (!supabase || !mapping.cultural_stewardship_config) return;

    const config = mapping.cultural_stewardship_config as any;
    if (!config.action_type) return;

    try {
      const stewardshipLog: Partial<CulturalStewardshipLog> = {
        learner_id: assessment.learner_id,
        decision_assessment_id: assessment.id,

        action_type: config.action_type,
        action_impact: assessment.cultural_alignment_score || 0,

        bravin_values_reinforced: config.values_reinforced || [],
        cultural_norms_influenced: config.norms_influenced || [],
        team_culture_impact: config.team_impact || 0,
        organizational_culture_impact: config.org_impact || 0,

        visibility_level: config.visibility_level,
        influence_scope: config.influence_scope,

        role_modeling_quality: config.role_modeling || 0,
        values_consistency_score: config.values_consistency || 0,
        cultural_courage_demonstrated: config.courage_demonstrated || false
      };

      await supabase
        .from('cultural_stewardship_logs')
        .insert(stewardshipLog);
    } catch (error) {
      console.error('[BravinMetrics] Error processing cultural stewardship:', error);
    }
  }

  private static async updateLearnerScores(
    learnerId: string,
    assessment: BravinDecisionAssessment
  ): Promise<void> {
    if (!supabase) return;

    const dimensions = await this.getAllDimensions();
    const impacts = [
      { code: 'BOLDNESS', impact: assessment.boldness_impact || 0 },
      { code: 'RESPONSIBILITY', impact: assessment.responsibility_impact || 0 },
      { code: 'ACCOUNTABILITY', impact: assessment.accountability_impact || 0 },
      { code: 'VISION', impact: assessment.vision_impact || 0 },
      { code: 'INTEGRITY', impact: assessment.integrity_impact || 0 },
      { code: 'NURTURANCE', impact: assessment.nurturance_impact || 0 }
    ];

    for (const { code, impact } of impacts) {
      const dimension = dimensions.find(d => d.code === code);
      if (!dimension) continue;

      try {
        const { data: existing } = await supabase
          .from('bravin_learner_scores')
          .select('*')
          .eq('learner_id', learnerId)
          .eq('dimension_id', dimension.id)
          .maybeSingle();

        if (existing) {
          const newScore = Math.max(0, Math.min(100, existing.current_score + impact));
          const newAssessmentCount = existing.total_assessments + 1;
          const newAverage = ((existing.average_score || existing.current_score) * existing.total_assessments + newScore) / newAssessmentCount;

          const growthRate = existing.current_score > 0
            ? ((newScore - existing.current_score) / existing.current_score) * 100
            : 0;

          let trend: 'improving' | 'stable' | 'declining' = 'stable';
          if (growthRate > 5) trend = 'improving';
          else if (growthRate < -5) trend = 'declining';

          await supabase
            .from('bravin_learner_scores')
            .update({
              current_score: newScore,
              total_assessments: newAssessmentCount,
              highest_score: Math.max(existing.highest_score || 0, newScore),
              lowest_score: existing.lowest_score ? Math.min(existing.lowest_score, newScore) : newScore,
              average_score: newAverage,
              trend,
              growth_rate: growthRate,
              last_assessed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          const initialScore = 50 + impact;
          await supabase
            .from('bravin_learner_scores')
            .insert({
              learner_id: learnerId,
              dimension_id: dimension.id,
              current_score: Math.max(0, Math.min(100, initialScore)),
              total_assessments: 1,
              highest_score: initialScore,
              lowest_score: initialScore,
              average_score: initialScore,
              trend: 'stable',
              growth_rate: 0,
              first_assessed_at: new Date().toISOString(),
              last_assessed_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error(`[BravinMetrics] Error updating score for ${code}:`, error);
      }
    }
  }

  static async getAssessmentResult(
    learnerId: string,
    simulationInstanceId?: string
  ): Promise<BravinAssessmentResult | null> {
    if (!supabase) return null;

    try {
      const scores = await this.getLearnerScores(learnerId);

      let decisionQuery = supabase
        .from('bravin_decision_assessments')
        .select('*')
        .eq('learner_id', learnerId);

      if (simulationInstanceId) {
        decisionQuery = decisionQuery.eq('simulation_instance_id', simulationInstanceId);
      }

      const { data: decisions } = await decisionQuery.order('decision_timestamp', { ascending: false });

      // If no decisions have been recorded, return null instead of fake scores
      if (!decisions || decisions.length === 0) {
        console.log('[BravinMetrics] No decision assessments found for learner');
        return null;
      }

      // Check if any learner scores have actual assessments (not just default values)
      const hasActualScores = scores.some(s => s.total_assessments > 0);
      if (!hasActualScores) {
        console.log('[BravinMetrics] No actual score assessments found for learner');
        return null;
      }

      const { data: trustEvents } = await supabase
        .from('trust_impact_events')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false });

      // Only use scores from dimensions that have been assessed
      const dimensionScores = {
        boldness: scores.find(s => s.dimension?.code === 'BOLDNESS' && s.total_assessments > 0)?.current_score || 50,
        responsibility: scores.find(s => s.dimension?.code === 'RESPONSIBILITY' && s.total_assessments > 0)?.current_score || 50,
        accountability: scores.find(s => s.dimension?.code === 'ACCOUNTABILITY' && s.total_assessments > 0)?.current_score || 50,
        vision: scores.find(s => s.dimension?.code === 'VISION' && s.total_assessments > 0)?.current_score || 50,
        integrity: scores.find(s => s.dimension?.code === 'INTEGRITY' && s.total_assessments > 0)?.current_score || 50,
        nurturance: scores.find(s => s.dimension?.code === 'NURTURANCE' && s.total_assessments > 0)?.current_score || 50
      };

      const overallScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0) / 6;

      const sortedScores = Object.entries(dimensionScores).sort(([, a], [, b]) => b - a);
      const strengths = sortedScores.slice(0, 2).map(([code]) => code.toUpperCase() as BravinDimensionCode);
      const developmentAreas = sortedScores.slice(-2).map(([code]) => code.toUpperCase() as BravinDimensionCode);

      const trustEventsSummary = {
        trust_built: trustEvents?.filter(e => e.event_type === 'trust_built').length || 0,
        trust_damaged: trustEvents?.filter(e => e.event_type === 'trust_damaged').length || 0,
        trust_repaired: trustEvents?.filter(e => e.event_type === 'trust_repaired').length || 0,
        trust_maintained: trustEvents?.filter(e => e.event_type === 'trust_maintained').length || 0
      };

      const avgTrustImpact = decisions.reduce((sum, d) => sum + (d.trust_impact_score || 0), 0) / decisions.length;
      const avgEthicalQuality = decisions.reduce((sum, d) => sum + (d.ethical_quality_score || 0), 0) / decisions.length;
      const avgEIIndex = decisions.reduce((sum, d) => sum + ((d.ei_recognition_score || 0) + (d.ei_response_score || 0)) / 2, 0) / decisions.length;
      const avgCulturalStewardship = decisions.reduce((sum, d) => sum + (d.cultural_alignment_score || 0), 0) / decisions.length;

      return {
        overall_alignment_score: overallScore,
        dimension_scores: dimensionScores,
        trust_impact_rating: avgTrustImpact,
        ethical_decision_quality: avgEthicalQuality,
        emotional_intelligence_index: avgEIIndex,
        cultural_stewardship_score: avgCulturalStewardship,
        strengths,
        development_areas: developmentAreas,
        trust_events_summary: trustEventsSummary,
        decision_count: decisions.length,
        assessment_date: new Date().toISOString()
      };
    } catch (error) {
      console.error('[BravinMetrics] Error generating assessment result:', error);
      return null;
    }
  }

  private static calculateTrustImpactScore(mapping: BravinScenarioOptionMapping): number {
    const config = mapping.trust_impact_config as any || {};
    const impacts = [
      config.boundaries_impact || 0,
      config.reliability_impact || 0,
      config.accountability_impact || 0,
      config.integrity_impact || 0
    ];

    return impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
  }

  private static calculateEthicalQualityScore(mapping: BravinScenarioOptionMapping): number {
    const config = mapping.ethical_quality_config as any || {};
    const values = config.values_alignment || 50;
    const performance = config.performance_impact || 50;
    const stakeholder = config.stakeholder_consideration || 50;
    const longTerm = config.long_term_thinking || 50;

    return (values * 0.3 + performance * 0.2 + stakeholder * 0.25 + longTerm * 0.25);
  }

  private static calculateEIRecognitionScore(mapping: BravinScenarioOptionMapping): number {
    const config = mapping.ei_indicators_config as any || {};
    return config.emotion_recognition || 50;
  }

  private static calculateEIResponseScore(mapping: BravinScenarioOptionMapping): number {
    const config = mapping.ei_indicators_config as any || {};
    return config.empathetic_response || 50;
  }

  private static calculateCulturalAlignmentScore(mapping: BravinScenarioOptionMapping): number {
    const config = mapping.cultural_stewardship_config as any || {};
    const impacts = [
      mapping.boldness_impact || 0,
      mapping.responsibility_impact || 0,
      mapping.accountability_impact || 0,
      mapping.vision_impact || 0,
      mapping.integrity_impact || 0,
      mapping.nurturance_impact || 0
    ];

    const avgImpact = impacts.reduce((sum, impact) => sum + impact, 0) / 6;
    return 50 + avgImpact;
  }

  private static assessRecoveryDifficulty(trustScore: number): 'easy' | 'moderate' | 'difficult' | 'severe' {
    const absScore = Math.abs(trustScore);
    if (absScore < 15) return 'easy';
    if (absScore < 30) return 'moderate';
    if (absScore < 50) return 'difficult';
    return 'severe';
  }

  private static pressureLevelToIntensity(level?: PressureLevel): number {
    switch (level) {
      case 'low': return 25;
      case 'medium': return 50;
      case 'high': return 75;
      case 'critical': return 100;
      default: return 50;
    }
  }

  private static calculateValuesPerformanceBalance(config: any): number {
    const values = config.values_alignment || 50;
    const performance = config.performance_impact || 50;
    return Math.abs(values - performance);
  }

  static async upsertScenarioOptionMapping(
    mapping: Partial<BravinScenarioOptionMapping>
  ): Promise<BravinScenarioOptionMapping | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('bravin_scenario_option_mappings')
        .upsert(mapping, {
          onConflict: 'scenario_id,option_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BravinMetrics] Error upserting mapping:', error);
      return null;
    }
  }

  static async deleteScenarioOptionMapping(scenarioId: string, optionId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('bravin_scenario_option_mappings')
        .delete()
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[BravinMetrics] Error deleting mapping:', error);
      return false;
    }
  }
}
