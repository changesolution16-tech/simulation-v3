import db from './db';

export type MetricType =
  | 'decision_quality'
  | 'timing'
  | 'critical_thinking'
  | 'emotional_intelligence'
  | 'communication'
  | 'problem_solving'
  | 'adaptability'
  | 'collaboration'
  | 'custom'
  | 'bravin_alignment'
  | 'trust_impact'
  | 'ethical_decision_quality'
  | 'emotional_intelligence_index'
  | 'cultural_stewardship';

export type MeasurementMethod =
  | 'automatic'
  | 'rubric'
  | 'observation'
  | 'self_assessment'
  | 'peer_assessment';

export interface ProficiencyLevel {
  level: number;
  name: string;
  description: string;
}

export interface Competency {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_competency_id?: string;
  competency_level: number;
  proficiency_levels: ProficiencyLevel[];
  industry_standard?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentMetric {
  id: string;
  name: string;
  description?: string;
  metric_type: MetricType;
  measurement_method?: MeasurementMethod;
  min_score: number;
  max_score: number;
  passing_threshold: number;
  applies_to_topics?: string[];
  applies_to_scenarios?: string[];
  is_global: boolean;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetencyMapping {
  id: string;
  competency_id: string;
  scenario_id?: string;
  option_id?: string;
  proficiency_impact: number;
  required_for_mastery: boolean;
  created_at: string;
}

export interface LearnerCompetency {
  id: string;
  learner_id: string;
  competency_id: string;
  current_level: number;
  current_score: number;
  is_mastered: boolean;
  first_assessed_at?: string;
  last_assessed_at?: string;
  total_practice_count: number;
  trend: 'improving' | 'stable' | 'declining';
  growth_rate?: number;
  created_at: string;
  updated_at: string;
  competency?: Competency;
}

export interface SimulationMetric {
  id: string;
  simulation_id: string;
  metric_id: string;
  weight: number;
  is_required: boolean;
  custom_passing_threshold?: number;
  show_to_learner: boolean;
  display_order: number;
  custom_label?: string;
  created_at: string;
  updated_at: string;
  metric?: AssessmentMetric;
}

export interface SimulationCompetency {
  id: string;
  simulation_id: string;
  competency_id: string;
  is_primary: boolean;
  target_level: number;
  is_prerequisite: boolean;
  prerequisite_level?: number;
  display_order: number;
  show_in_results: boolean;
  created_at: string;
  competency?: Competency;
}

export class CompetencyService {
  static async getAll(): Promise<Competency[]> {
    try {
      const result = await db`
        SELECT * FROM competencies
        WHERE is_active = true
        ORDER BY competency_level ASC, name ASC
      `;
      return result as unknown as Competency[];
    } catch (error) {
      console.error('Error fetching competencies:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Competency | null> {
    try {
      const result = await db`
        SELECT * FROM competencies
        WHERE id = ${id}
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('Error fetching competency:', error);
      return null;
    }
  }

  static async getHierarchy(): Promise<Competency[]> {
    try {
      const result = await db`
        SELECT * FROM competencies
        WHERE is_active = true AND parent_competency_id IS NULL
        ORDER BY name ASC
      `;
      return result as unknown as Competency[];
    } catch (error) {
      console.error('Error fetching competency hierarchy:', error);
      return [];
    }
  }

  static async getChildren(parentId: string): Promise<Competency[]> {
    try {
      const result = await db`
        SELECT * FROM competencies
        WHERE parent_competency_id = ${parentId} AND is_active = true
        ORDER BY name ASC
      `;
      return result as unknown as Competency[];
    } catch (error) {
      console.error('Error fetching child competencies:', error);
      return [];
    }
  }

  static async create(competency: Partial<Competency>): Promise<Competency | null> {
    try {
      const result = await db`
        INSERT INTO competencies (
          code, name, description, parent_competency_id, competency_level,
          proficiency_levels, industry_standard, tags, is_active
        ) VALUES (
          ${competency.code},
          ${competency.name},
          ${competency.description || null},
          ${competency.parent_competency_id || null},
          ${competency.competency_level || 1},
          ${JSON.stringify(competency.proficiency_levels || [
            { level: 1, name: 'Awareness', description: 'Basic understanding' },
            { level: 2, name: 'Developing', description: 'Can perform with guidance' },
            { level: 3, name: 'Proficient', description: 'Can perform independently' },
            { level: 4, name: 'Advanced', description: 'Can teach others' },
            { level: 5, name: 'Expert', description: 'Recognized authority' }
          ])},
          ${competency.industry_standard || null},
          ${JSON.stringify(competency.tags || [])},
          true
        )
        RETURNING *
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('Error creating competency:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Competency>): Promise<boolean> {
    try {
      if (Object.keys(updates).length === 0) return false;

      await db`
        UPDATE competencies
        SET ${db(updates as any)}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error updating competency:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db`
        UPDATE competencies
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error deleting competency:', error);
      return false;
    }
  }

  static async getLearnerCompetencies(learnerId: string): Promise<LearnerCompetency[]> {
    try {
      const result = await db`
        SELECT
          lc.*,
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'description', c.description,
            'competency_level', c.competency_level,
            'proficiency_levels', c.proficiency_levels
          ) as competency
        FROM learner_competencies lc
        LEFT JOIN competencies c ON lc.competency_id = c.id
        WHERE lc.learner_id = ${learnerId}
        ORDER BY lc.last_assessed_at DESC NULLS LAST
      `;
      return result as unknown as LearnerCompetency[];
    } catch (error) {
      console.error('Error fetching learner competencies:', error);
      return [];
    }
  }

  static async updateLearnerCompetency(
    learnerId: string,
    competencyId: string,
    impact: number
  ): Promise<boolean> {
    try {
      const existing = await db`
        SELECT * FROM learner_competencies
        WHERE learner_id = ${learnerId} AND competency_id = ${competencyId}
      `;

      if (existing.length > 0) {
        const current = existing[0];
        const newScore = Math.max(0, Math.min(100, current.current_score + impact));
        const newLevel = Math.floor(newScore / 20) + 1;
        const isMastered = newScore >= 90;

        const growthRate = current.current_score > 0
          ? ((newScore - current.current_score) / current.current_score) * 100
          : 0;

        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (growthRate > 5) trend = 'improving';
        else if (growthRate < -5) trend = 'declining';

        await db`
          UPDATE learner_competencies
          SET
            current_score = ${newScore},
            current_level = ${newLevel},
            is_mastered = ${isMastered},
            last_assessed_at = NOW(),
            total_practice_count = ${current.total_practice_count + 1},
            trend = ${trend},
            growth_rate = ${growthRate},
            updated_at = NOW()
          WHERE id = ${current.id}
        `;
      } else {
        const newScore = Math.max(0, Math.min(100, 50 + impact));
        const newLevel = Math.floor(newScore / 20) + 1;

        await db`
          INSERT INTO learner_competencies (
            learner_id, competency_id, current_score, current_level,
            is_mastered, first_assessed_at, last_assessed_at,
            total_practice_count, trend, growth_rate
          ) VALUES (
            ${learnerId}, ${competencyId}, ${newScore}, ${newLevel},
            false, NOW(), NOW(), 1, 'stable', 0
          )
        `;
      }

      return true;
    } catch (error) {
      console.error('Error updating learner competency:', error);
      return false;
    }
  }
}

export class MetricsService {
  static async getAll(): Promise<AssessmentMetric[]> {
    try {
      const result = await db`
        SELECT * FROM assessment_metrics
        WHERE is_active = true
        ORDER BY name ASC
      `;
      return result as unknown as AssessmentMetric[];
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<AssessmentMetric | null> {
    try {
      const result = await db`
        SELECT * FROM assessment_metrics
        WHERE id = ${id}
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('Error fetching metric:', error);
      return null;
    }
  }

  static async create(metric: Partial<AssessmentMetric>): Promise<AssessmentMetric | null> {
    try {
      const result = await db`
        INSERT INTO assessment_metrics (
          name, description, metric_type, measurement_method,
          min_score, max_score, passing_threshold, applies_to_topics,
          applies_to_scenarios, is_global, created_by, is_active
        ) VALUES (
          ${metric.name},
          ${metric.description || null},
          ${metric.metric_type},
          ${metric.measurement_method || 'automatic'},
          ${metric.min_score || 0},
          ${metric.max_score || 100},
          ${metric.passing_threshold || 70},
          ${JSON.stringify(metric.applies_to_topics || null)},
          ${JSON.stringify(metric.applies_to_scenarios || null)},
          ${metric.is_global || false},
          ${metric.created_by || null},
          true
        )
        RETURNING *
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('Error creating metric:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<AssessmentMetric>): Promise<boolean> {
    try {
      if (Object.keys(updates).length === 0) return false;

      await db`
        UPDATE assessment_metrics
        SET ${db(updates as any)}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error updating metric:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db`
        UPDATE assessment_metrics
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      console.error('Error deleting metric:', error);
      return false;
    }
  }

  static async getSimulationMetrics(simulationId: string): Promise<SimulationMetric[]> {
    try {
      const result = await db`
        SELECT
          sm.*,
          jsonb_build_object(
            'id', am.id,
            'name', am.name,
            'description', am.description,
            'metric_type', am.metric_type,
            'min_score', am.min_score,
            'max_score', am.max_score,
            'passing_threshold', am.passing_threshold
          ) as metric
        FROM simulation_metrics sm
        LEFT JOIN assessment_metrics am ON sm.metric_id = am.id
        WHERE sm.simulation_id = ${simulationId}
        ORDER BY sm.display_order ASC
      `;
      return result as unknown as SimulationMetric[];
    } catch (error) {
      console.error('Error fetching simulation metrics:', error);
      return [];
    }
  }

  static async addMetricToSimulation(
    simulationId: string,
    metricId: string,
    config: Partial<SimulationMetric>
  ): Promise<SimulationMetric | null> {
    try {
      const result = await db`
        INSERT INTO simulation_metrics (
          simulation_id, metric_id, weight, is_required,
          custom_passing_threshold, show_to_learner, display_order, custom_label
        ) VALUES (
          ${simulationId}, ${metricId}, ${config.weight || 1.0},
          ${config.is_required !== undefined ? config.is_required : true},
          ${config.custom_passing_threshold || null},
          ${config.show_to_learner !== undefined ? config.show_to_learner : true},
          ${config.display_order || 0},
          ${config.custom_label || null}
        )
        RETURNING *
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('Error adding metric to simulation:', error);
      return null;
    }
  }

  static async removeMetricFromSimulation(
    simulationId: string,
    metricId: string
  ): Promise<boolean> {
    try {
      await db`
        DELETE FROM simulation_metrics
        WHERE simulation_id = ${simulationId} AND metric_id = ${metricId}
      `;
      return true;
    } catch (error) {
      console.error('Error removing metric from simulation:', error);
      return false;
    }
  }

  static async getSimulationCompetencies(simulationId: string): Promise<SimulationCompetency[]> {
    try {
      const result = await db`
        SELECT
          sc.*,
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'description', c.description,
            'competency_level', c.competency_level,
            'proficiency_levels', c.proficiency_levels
          ) as competency
        FROM simulation_competencies sc
        LEFT JOIN competencies c ON sc.competency_id = c.id
        WHERE sc.simulation_id = ${simulationId}
        ORDER BY sc.display_order ASC
      `;
      return result as unknown as SimulationCompetency[];
    } catch (error) {
      console.error('Error fetching simulation competencies:', error);
      return [];
    }
  }

  static async addCompetencyToSimulation(
    simulationId: string,
    competencyId: string,
    config: Partial<SimulationCompetency>
  ): Promise<SimulationCompetency | null> {
    try {
      const result = await db`
        INSERT INTO simulation_competencies (
          simulation_id, competency_id, is_primary, target_level,
          is_prerequisite, prerequisite_level, display_order, show_in_results
        ) VALUES (
          ${simulationId}, ${competencyId},
          ${config.is_primary || false},
          ${config.target_level || 3},
          ${config.is_prerequisite || false},
          ${config.prerequisite_level || null},
          ${config.display_order || 0},
          ${config.show_in_results !== undefined ? config.show_in_results : true}
        )
        RETURNING *
      `;
      return (result[0] as any) || null;
    } catch (error) {
      console.error('Error adding competency to simulation:', error);
      return null;
    }
  }

  static async removeCompetencyFromSimulation(
    simulationId: string,
    competencyId: string
  ): Promise<boolean> {
    try {
      await db`
        DELETE FROM simulation_competencies
        WHERE simulation_id = ${simulationId} AND competency_id = ${competencyId}
      `;
      return true;
    } catch (error) {
      console.error('Error removing competency from simulation:', error);
      return false;
    }
  }
}
