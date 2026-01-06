import db from './db';
import type { Competency } from './competencies';

export type DevelopmentPriority = 'primary' | 'secondary' | 'supplementary';

export interface ScenarioTargetedCompetency {
  id: string;
  scenario_id: string;
  competency_id: string;
  target_weight: number;
  is_primary: boolean;
  development_priority: DevelopmentPriority;
  notes?: string;
  created_at: string;
  updated_at: string;
  competency?: Competency;
}

export interface ScenarioTargetedCompetencyWithDetails extends ScenarioTargetedCompetency {
  competency_code: string;
  competency_name: string;
  competency_description: string;
  competency_level: number;
}

export interface CompetencySelectionData {
  competency_id: string;
  target_weight?: number;
  is_primary?: boolean;
  development_priority?: DevelopmentPriority;
  notes?: string;
}

export class ScenarioCompetencyService {
  static async getTargetedCompetencies(scenarioId: string): Promise<ScenarioTargetedCompetencyWithDetails[]> {
    try {
      const result = await db`
        SELECT
          stc.*,
          c.code as competency_code,
          c.name as competency_name,
          c.description as competency_description,
          c.competency_level
        FROM scenario_targeted_competencies stc
        LEFT JOIN competencies c ON stc.competency_id = c.id
        WHERE stc.scenario_id = ${scenarioId}
        ORDER BY stc.is_primary DESC, stc.development_priority, stc.target_weight DESC
      `;
      return result as unknown as ScenarioTargetedCompetencyWithDetails[];
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error fetching targeted competencies:', error);
      return [];
    }
  }

  static async setTargetedCompetencies(
    scenarioId: string,
    competencies: CompetencySelectionData[]
  ): Promise<boolean> {
    try {
      await db`
        DELETE FROM scenario_targeted_competencies
        WHERE scenario_id = ${scenarioId}
      `;

      if (competencies.length === 0) return true;

      const values = competencies.map(comp => ({
        scenario_id: scenarioId,
        competency_id: comp.competency_id,
        target_weight: comp.target_weight ?? 1.0,
        is_primary: comp.is_primary ?? false,
        development_priority: comp.development_priority ?? 'secondary',
        notes: comp.notes || null
      }));

      await db`
        INSERT INTO scenario_targeted_competencies ${db(values)}
      `;

      return true;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error setting targeted competencies:', error);
      return false;
    }
  }

  static async addTargetedCompetency(
    scenarioId: string,
    competencyData: CompetencySelectionData
  ): Promise<ScenarioTargetedCompetency | null> {
    try {
      const result = await db`
        INSERT INTO scenario_targeted_competencies (
          scenario_id, competency_id, target_weight, is_primary,
          development_priority, notes
        ) VALUES (
          ${scenarioId},
          ${competencyData.competency_id},
          ${competencyData.target_weight ?? 1.0},
          ${competencyData.is_primary ?? false},
          ${competencyData.development_priority ?? 'secondary'},
          ${competencyData.notes || null}
        )
        RETURNING *
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error adding targeted competency:', error);
      return null;
    }
  }

  static async updateTargetedCompetency(
    id: string,
    updates: Partial<CompetencySelectionData>
  ): Promise<boolean> {
    try {
      const updateFields: any = {};
      if (updates.target_weight !== undefined) updateFields.target_weight = updates.target_weight;
      if (updates.is_primary !== undefined) updateFields.is_primary = updates.is_primary;
      if (updates.development_priority !== undefined) updateFields.development_priority = updates.development_priority;
      if (updates.notes !== undefined) updateFields.notes = updates.notes;

      if (Object.keys(updateFields).length === 0) return false;

      updateFields.updated_at = new Date();

      await db`
        UPDATE scenario_targeted_competencies
        SET ${db(updateFields)}
        WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error updating targeted competency:', error);
      return false;
    }
  }

  static async removeTargetedCompetency(
    scenarioId: string,
    competencyId: string
  ): Promise<boolean> {
    try {
      await db`
        DELETE FROM scenario_targeted_competencies
        WHERE scenario_id = ${scenarioId} AND competency_id = ${competencyId}
      `;
      return true;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error removing targeted competency:', error);
      return false;
    }
  }

  static async getMappingRecommendations(
    metricType: string,
    competencyCodes: string[]
  ): Promise<Array<{
    competency_code: string;
    recommended_method: string;
    recommended_weight: number;
    rationale: string;
  }>> {
    try {
      const recommendations: any[] = [];

      const competencyMap: Record<string, any> = {
        'decision_quality': {
          codes: ['CRITICAL_THINKING', 'PROBLEM_SOLVING', 'DECISION_MAKING'],
          method: 'automatic',
          weight: 0.8,
          rationale: 'Decision quality directly measures critical thinking and problem-solving skills'
        },
        'timing': {
          codes: ['TIME_MANAGEMENT', 'ADAPTABILITY', 'STRESS_MANAGEMENT'],
          method: 'automatic',
          weight: 0.6,
          rationale: 'Timing reflects time management and adaptability under pressure'
        },
        'emotional_intelligence': {
          codes: ['EMOTIONAL_INTELLIGENCE', 'EMPATHY', 'SELF_AWARENESS'],
          method: 'rubric',
          weight: 0.9,
          rationale: 'Emotional intelligence is best assessed through multi-dimensional rubrics'
        },
        'communication': {
          codes: ['COMMUNICATION', 'ACTIVE_LISTENING', 'CLARITY'],
          method: 'observation',
          weight: 0.85,
          rationale: 'Communication skills require contextual observation and assessment'
        },
        'collaboration': {
          codes: ['TEAMWORK', 'COLLABORATION', 'INTERPERSONAL'],
          method: 'peer_assessment',
          weight: 0.75,
          rationale: 'Collaboration is best assessed through peer feedback'
        }
      };

      const mapping = competencyMap[metricType];
      if (!mapping) return [];

      for (const code of competencyCodes) {
        if (mapping.codes.includes(code)) {
          recommendations.push({
            competency_code: code,
            recommended_method: mapping.method,
            recommended_weight: mapping.weight,
            rationale: mapping.rationale
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('[ScenarioCompetencyService] Error getting mapping recommendations:', error);
      return [];
    }
  }
}
