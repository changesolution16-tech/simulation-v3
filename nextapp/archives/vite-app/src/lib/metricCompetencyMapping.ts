import { supabase } from './supabase';
import { AssessmentMetric, Competency } from './competencies';

export type CalculationMethod =
  | 'linear'
  | 'threshold_based'
  | 'exponential_growth'
  | 'compensatory'
  | 'conjunctive'
  | 'custom';

export type NormalizationMethod = 'sum' | 'average' | 'weighted_average' | 'max' | 'min';

export type MappingTemplateType =
  | 'lumina_leadership'
  | 'bravin_alignment'
  | 'emotional_intelligence'
  | 'strategic_leadership'
  | 'ethical_citizenship'
  | 'custom';

export interface CalculationAlgorithm {
  id: string;
  code: string;
  name: string;
  description?: string;
  formula_template: string;
  required_parameters: string[];
  example_config: Record<string, any>;
  best_for: string[];
  industry_standard_reference?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ScoreConversionRules {
  baseline_score?: number;
  scale_factor?: number;
  thresholds?: {
    below_threshold?: { max: number; impact: number; level?: string };
    meets_threshold?: { min: number; max: number; impact: number; level?: string };
    exceeds_threshold?: { min: number; max: number; impact: number; level?: string };
    exemplary?: { min: number; impact: number; level?: string };
  };
}

export interface AlgorithmConfig {
  excellence_threshold?: number;
  growth_rate?: number;
  metric_group?: string[];
  minimum_aggregate?: number;
  minimum_thresholds?: Record<string, number>;
  failure_penalty?: number;
  formula_expression?: string;
  variable_mappings?: Record<string, string>;
  [key: string]: any;
}

export interface SimulationMetricCompetencyMapping {
  id: string;
  simulation_id: string;
  metric_id: string;
  competency_id: string;
  algorithm_id?: string;
  calculation_method: CalculationMethod;
  mapping_weight: number;
  algorithm_config: AlgorithmConfig;
  score_conversion_rules: ScoreConversionRules;
  normalization_method: NormalizationMethod;
  is_inherited: boolean;
  template_id?: string;
  configured_by?: string;
  configuration_notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  metric?: AssessmentMetric;
  competency?: Competency;
  algorithm?: CalculationAlgorithm;
}

export interface MappingTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: MappingTemplateType;
  mappings: Array<{
    metric_id?: string;
    metric_type?: string;
    competency_id?: string;
    competency_code?: string;
    calculation_method: CalculationMethod;
    mapping_weight: number;
    algorithm_config?: AlgorithmConfig;
  }>;
  industry_standard?: string;
  reference_framework?: string;
  is_public: boolean;
  created_by?: string;
  organization_id?: string;
  times_used: number;
  tags: string[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetencyImpactOverride {
  id: string;
  scenario_id: string;
  option_id: string;
  competency_id: string;
  automatic_impact?: number;
  manual_impact: number;
  override_reason?: string;
  overridden_by?: string;
  overridden_at: string;
  show_in_deviation_report: boolean;
  created_at: string;
}

export interface AutomaticCompetencyImpact {
  competency_id: string;
  competency_name: string;
  automatic_impact: number;
  manual_impact: number;
  is_overridden: boolean;
  calculation_method: string;
  contributing_metrics: Array<{
    metric_name: string;
    metric_score: number;
    weight: number;
  }>;
}

export class MetricCompetencyMappingService {
  static async getCalculationAlgorithms(): Promise<CalculationAlgorithm[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('calculation_algorithms')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching algorithms:', error);
      return [];
    }
  }

  static async getSimulationMappings(
    simulationId: string
  ): Promise<SimulationMetricCompetencyMapping[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('simulation_metric_competency_mappings')
        .select(`
          *,
          metric:assessment_metrics(*),
          competency:competencies(*),
          algorithm:calculation_algorithms(*)
        `)
        .eq('simulation_id', simulationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching mappings:', error);
      return [];
    }
  }

  static async getMappingsForMetric(
    simulationId: string,
    metricId: string
  ): Promise<SimulationMetricCompetencyMapping[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('simulation_metric_competency_mappings')
        .select(`
          *,
          metric:assessment_metrics(*),
          competency:competencies(*),
          algorithm:calculation_algorithms(*)
        `)
        .eq('simulation_id', simulationId)
        .eq('metric_id', metricId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching metric mappings:', error);
      return [];
    }
  }

  static async createMapping(
    mapping: Partial<SimulationMetricCompetencyMapping>
  ): Promise<SimulationMetricCompetencyMapping | null> {
    if (!supabase) return null;

    try {
      const existingCheck = await supabase
        .from('simulation_metric_competency_mappings')
        .select('id')
        .eq('simulation_id', mapping.simulation_id)
        .eq('metric_id', mapping.metric_id)
        .eq('competency_id', mapping.competency_id)
        .maybeSingle();

      if (existingCheck.data) {
        console.warn('[MetricCompetencyMappingService] Mapping already exists');
        return null;
      }

      const { data, error } = await supabase
        .from('simulation_metric_competency_mappings')
        .insert({
          simulation_id: mapping.simulation_id,
          metric_id: mapping.metric_id,
          competency_id: mapping.competency_id,
          calculation_method: mapping.calculation_method || 'linear',
          mapping_weight: mapping.mapping_weight ?? 1.0,
          algorithm_config: mapping.algorithm_config || {},
          score_conversion_rules: mapping.score_conversion_rules || {},
          normalization_method: mapping.normalization_method || 'weighted_average',
          is_inherited: mapping.is_inherited || false,
          template_id: mapping.template_id,
          configured_by: mapping.configured_by,
          configuration_notes: mapping.configuration_notes,
          is_active: true
        })
        .select(`
          *,
          metric:assessment_metrics(*),
          competency:competencies(*),
          algorithm:calculation_algorithms(*)
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          console.warn('[MetricCompetencyMappingService] Duplicate mapping detected');
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error creating mapping:', error);
      return null;
    }
  }

  static async updateMapping(
    id: string,
    updates: Partial<SimulationMetricCompetencyMapping>
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulation_metric_competency_mappings')
        .update({
          calculation_method: updates.calculation_method,
          mapping_weight: updates.mapping_weight,
          algorithm_config: updates.algorithm_config,
          score_conversion_rules: updates.score_conversion_rules,
          normalization_method: updates.normalization_method,
          configuration_notes: updates.configuration_notes,
          is_active: updates.is_active
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error updating mapping:', error);
      return false;
    }
  }

  static async deleteMapping(id: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulation_metric_competency_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error deleting mapping:', error);
      return false;
    }
  }

  static async bulkCreateMappings(
    mappings: Partial<SimulationMetricCompetencyMapping>[]
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const inserts = mappings.map(m => ({
        simulation_id: m.simulation_id,
        metric_id: m.metric_id,
        competency_id: m.competency_id,
        calculation_method: m.calculation_method || 'linear',
        mapping_weight: m.mapping_weight ?? 1.0,
        algorithm_config: m.algorithm_config || {},
        score_conversion_rules: m.score_conversion_rules || {},
        normalization_method: m.normalization_method || 'weighted_average',
        is_inherited: m.is_inherited || false,
        template_id: m.template_id,
        configured_by: m.configured_by,
        configuration_notes: m.configuration_notes,
        is_active: true
      }));

      const { error } = await supabase
        .from('simulation_metric_competency_mappings')
        .insert(inserts);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error bulk creating mappings:', error);
      return false;
    }
  }

  static async getAutomaticCompetencyImpacts(
    simulationId: string,
    scenarioId: string,
    optionId: string
  ): Promise<AutomaticCompetencyImpact[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .rpc('get_automatic_competency_impacts', {
          p_simulation_id: simulationId,
          p_scenario_id: scenarioId,
          p_option_id: optionId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error getting automatic impacts:', error);
      return [];
    }
  }

  static async createOverride(
    override: Partial<CompetencyImpactOverride>
  ): Promise<CompetencyImpactOverride | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('competency_impact_overrides')
        .upsert({
          scenario_id: override.scenario_id,
          option_id: override.option_id,
          competency_id: override.competency_id,
          automatic_impact: override.automatic_impact,
          manual_impact: override.manual_impact,
          override_reason: override.override_reason,
          overridden_by: override.overridden_by,
          show_in_deviation_report: override.show_in_deviation_report ?? true
        }, {
          onConflict: 'scenario_id,option_id,competency_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error creating override:', error);
      return null;
    }
  }

  static async getOverrides(
    scenarioId: string,
    optionId: string
  ): Promise<CompetencyImpactOverride[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('competency_impact_overrides')
        .select('*')
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching overrides:', error);
      return [];
    }
  }

  static async deleteOverride(
    scenarioId: string,
    optionId: string,
    competencyId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('competency_impact_overrides')
        .delete()
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId)
        .eq('competency_id', competencyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error deleting override:', error);
      return false;
    }
  }

  static async getTemplates(): Promise<MappingTemplate[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('mapping_templates')
        .select('*')
        .eq('is_active', true)
        .order('times_used', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching templates:', error);
      return [];
    }
  }

  static async getPublicTemplates(): Promise<MappingTemplate[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('mapping_templates')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .order('times_used', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching public templates:', error);
      return [];
    }
  }

  static async createTemplate(
    template: Partial<MappingTemplate>
  ): Promise<MappingTemplate | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('mapping_templates')
        .insert({
          name: template.name,
          description: template.description,
          template_type: template.template_type || 'custom',
          mappings: template.mappings || [],
          industry_standard: template.industry_standard,
          reference_framework: template.reference_framework,
          is_public: template.is_public || false,
          created_by: template.created_by,
          organization_id: template.organization_id,
          tags: template.tags || [],
          version: 1,
          times_used: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error creating template:', error);
      return null;
    }
  }

  static async applyTemplate(
    templateId: string,
    simulationId: string,
    metrics: AssessmentMetric[],
    competencies: Competency[]
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const template = await this.getTemplateById(templateId);
      if (!template) return false;

      const mappings: Partial<SimulationMetricCompetencyMapping>[] = [];

      for (const mapping of template.mappings) {
        let metricId = mapping.metric_id;
        let competencyId = mapping.competency_id;

        if (!metricId && mapping.metric_type) {
          const metric = metrics.find(m => m.metric_type === mapping.metric_type);
          metricId = metric?.id;
        }

        if (!competencyId && mapping.competency_code) {
          const competency = competencies.find(c => c.code === mapping.competency_code);
          competencyId = competency?.id;
        }

        if (metricId && competencyId) {
          mappings.push({
            simulation_id: simulationId,
            metric_id: metricId,
            competency_id: competencyId,
            calculation_method: mapping.calculation_method,
            mapping_weight: mapping.mapping_weight,
            algorithm_config: mapping.algorithm_config || {},
            is_inherited: true,
            template_id: templateId
          });
        }
      }

      if (mappings.length === 0) return false;

      const success = await this.bulkCreateMappings(mappings);

      if (success) {
        await supabase
          .from('mapping_templates')
          .update({ times_used: template.times_used + 1 })
          .eq('id', templateId);
      }

      return success;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error applying template:', error);
      return false;
    }
  }

  static async getTemplateById(id: string): Promise<MappingTemplate | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('mapping_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MetricCompetencyMappingService] Error fetching template:', error);
      return null;
    }
  }

  static getDefaultConversionRules(method: CalculationMethod): ScoreConversionRules {
    switch (method) {
      case 'linear':
        return {
          baseline_score: 50,
          scale_factor: 0.1
        };

      case 'threshold_based':
        return {
          thresholds: {
            below_threshold: { max: 69, impact: -5, level: 'Below Proficiency' },
            meets_threshold: { min: 70, max: 84, impact: 0, level: 'Developing' },
            exceeds_threshold: { min: 85, max: 94, impact: 5, level: 'Proficient' },
            exemplary: { min: 95, impact: 10, level: 'Advanced' }
          }
        };

      case 'exponential_growth':
        return {
          baseline_score: 85,
          scale_factor: 10
        };

      default:
        return {};
    }
  }

  static getDefaultAlgorithmConfig(method: CalculationMethod): AlgorithmConfig {
    switch (method) {
      case 'exponential_growth':
        return {
          excellence_threshold: 85,
          growth_rate: 10
        };

      case 'compensatory':
        return {
          metric_group: [],
          minimum_aggregate: 210
        };

      case 'conjunctive':
        return {
          minimum_thresholds: {},
          failure_penalty: -10
        };

      default:
        return {};
    }
  }
}
