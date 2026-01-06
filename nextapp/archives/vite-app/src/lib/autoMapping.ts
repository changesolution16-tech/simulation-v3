import { supabase } from './supabase';
import { AssessmentMetric, Competency, CompetencyService } from './competencies';
import { ScenarioTargetedCompetencyWithDetails, ScenarioCompetencyService, CompetencySelectionData } from './scenarioCompetencies';
import { MetricCompetencyMappingService, CalculationMethod, SimulationMetricCompetencyMapping } from './metricCompetencyMapping';

export interface AutoMappingResult {
  created: number;
  skipped: number;
  errors: string[];
  mappings: SimulationMetricCompetencyMapping[];
}

export interface MetricCompetencyMatch {
  metric_id: string;
  metric_name: string;
  metric_type: string;
  competency_id: string;
  competency_name: string;
  competency_code: string;
  calculation_method: CalculationMethod;
  mapping_weight: number;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CompetencySuggestion {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  competency_description: string;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  is_primary: boolean;
  development_priority: 'primary' | 'secondary' | 'supplementary';
  target_weight: number;
  matching_metrics: string[];
}

export interface AutoMappingConfiguration {
  auto_mapping_enabled: boolean;
  auto_accept_high_confidence: boolean;
  auto_accept_medium_confidence: boolean;
  min_confidence_for_suggestion: 'high' | 'medium' | 'low';
  suggest_competencies_for_metrics: boolean;
  auto_create_targeted_competencies: boolean;
}

export class AutoMappingService {
  static async getConfiguration(simulationId?: string): Promise<AutoMappingConfiguration> {
    if (!supabase) {
      return this.getDefaultConfiguration();
    }

    try {
      const { data, error } = await supabase
        .from('auto_mapping_configuration')
        .select('*')
        .or(`applies_to_simulation_id.eq.${simulationId},applies_globally.eq.true`)
        .eq('is_active', true)
        .order('applies_to_simulation_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          auto_mapping_enabled: data.auto_mapping_enabled,
          auto_accept_high_confidence: data.auto_accept_high_confidence,
          auto_accept_medium_confidence: data.auto_accept_medium_confidence,
          min_confidence_for_suggestion: data.min_confidence_for_suggestion,
          suggest_competencies_for_metrics: data.suggest_competencies_for_metrics,
          auto_create_targeted_competencies: data.auto_create_targeted_competencies
        };
      }

      return this.getDefaultConfiguration();
    } catch (error) {
      console.error('[AutoMappingService] Error fetching configuration:', error);
      return this.getDefaultConfiguration();
    }
  }

  static getDefaultConfiguration(): AutoMappingConfiguration {
    return {
      auto_mapping_enabled: true,
      auto_accept_high_confidence: true,
      auto_accept_medium_confidence: false,
      min_confidence_for_suggestion: 'low',
      suggest_competencies_for_metrics: true,
      auto_create_targeted_competencies: true
    };
  }

  static async suggestCompetenciesForMetrics(
    metricIds: string[],
    existingCompetencyIds: string[] = []
  ): Promise<CompetencySuggestion[]> {
    if (!supabase) return [];

    try {
      const { data: metrics, error: metricsError } = await supabase
        .from('assessment_metrics')
        .select('*')
        .in('id', metricIds);

      if (metricsError) throw metricsError;
      if (!metrics || metrics.length === 0) return [];

      const allCompetencies = await CompetencyService.getAll();
      const level2Competencies = allCompetencies.filter(c => c.competency_level === 2);

      const suggestionMap = new Map<string, CompetencySuggestion>();

      for (const metric of metrics) {
        const rules = await this.getDefaultRulesForMetric(metric.metric_type);

        for (const rule of rules) {
          const matchingCompetencies = level2Competencies.filter(comp => {
            const pattern = new RegExp(rule.competency_code_pattern.replace('%', '.*'));
            return pattern.test(comp.code);
          });

          for (const competency of matchingCompetencies) {
            if (existingCompetencyIds.includes(competency.id)) {
              continue;
            }

            const existing = suggestionMap.get(competency.id);

            if (existing) {
              existing.matching_metrics.push(metric.name);
              if (rule.confidence_level === 'high' && existing.confidence !== 'high') {
                existing.confidence = rule.confidence_level as 'high' | 'medium' | 'low';
              }
              existing.target_weight = Math.max(existing.target_weight, rule.default_weight);
            } else {
              const isPrimary = rule.confidence_level === 'high' && rule.mapping_priority >= 90;
              const devPriority = rule.mapping_priority >= 90 ? 'primary' :
                                 rule.mapping_priority >= 70 ? 'secondary' : 'supplementary';

              suggestionMap.set(competency.id, {
                competency_id: competency.id,
                competency_code: competency.code,
                competency_name: competency.name,
                competency_description: competency.description,
                confidence: rule.confidence_level as 'high' | 'medium' | 'low',
                rationale: rule.rationale,
                is_primary: isPrimary,
                development_priority: devPriority as 'primary' | 'secondary' | 'supplementary',
                target_weight: rule.default_weight,
                matching_metrics: [metric.name]
              });
            }
          }
        }
      }

      return Array.from(suggestionMap.values()).sort((a, b) => {
        const confidenceOrder = { high: 0, medium: 1, low: 2 };
        if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
          return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
        }
        return b.matching_metrics.length - a.matching_metrics.length;
      });
    } catch (error) {
      console.error('[AutoMappingService] Error suggesting competencies:', error);
      return [];
    }
  }

  static async getDefaultRulesForMetric(metricType: string): Promise<any[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('default_metric_competency_rules')
        .select('*')
        .eq('metric_type', metricType)
        .eq('is_active', true)
        .order('mapping_priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AutoMappingService] Error fetching default rules:', error);
      return [];
    }
  }

  static async autoCreateTargetedCompetencies(
    scenarioId: string,
    suggestions: CompetencySuggestion[],
    minConfidence: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const threshold = confidenceOrder[minConfidence];

      const competenciesToCreate: CompetencySelectionData[] = suggestions
        .filter(s => confidenceOrder[s.confidence] >= threshold)
        .map(s => ({
          competency_id: s.competency_id,
          target_weight: s.target_weight,
          is_primary: s.is_primary,
          development_priority: s.development_priority,
          notes: `Auto-suggested: ${s.rationale} (Confidence: ${s.confidence})`
        }));

      if (competenciesToCreate.length === 0) return false;

      const success = await ScenarioCompetencyService.setTargetedCompetencies(
        scenarioId,
        competenciesToCreate
      );

      return success;
    } catch (error) {
      console.error('[AutoMappingService] Error auto-creating targeted competencies:', error);
      return false;
    }
  }
  static getCalculationMethodForPair(
    metricType: string,
    competencyCode: string
  ): { method: CalculationMethod; rationale: string } {
    const methodMap: Record<string, { patterns: RegExp[]; method: CalculationMethod; rationale: string }> = {
      direct_linear: {
        patterns: [/^COM/, /^IPC/, /^PRO/, /^ADT/],
        method: 'linear',
        rationale: 'Direct linear relationship between metric and competency'
      },
      threshold_strategic: {
        patterns: [/^STR/, /^CRT/],
        method: 'threshold_based',
        rationale: 'Strategic competencies require threshold-based assessment'
      },
      exponential_leadership: {
        patterns: [/^LDR/, /^SLF/, /^VIS/],
        method: 'exponential_growth',
        rationale: 'Advanced leadership competencies benefit from exponential growth'
      },
      threshold_ei: {
        patterns: [/^EI/, /^REL/, /^EMP/],
        method: 'threshold_based',
        rationale: 'Emotional intelligence competencies use threshold-based assessment'
      }
    };

    for (const [, config] of Object.entries(methodMap)) {
      if (config.patterns.some(pattern => pattern.test(competencyCode))) {
        return { method: config.method, rationale: config.rationale };
      }
    }

    return {
      method: 'linear',
      rationale: 'Default linear mapping for general competency development'
    };
  }

  static getMappingWeight(
    metricType: string,
    competencyCode: string,
    isPrimary: boolean,
    developmentPriority: string
  ): { weight: number; rationale: string } {
    let baseWeight = 1.0;
    let rationale = 'Standard weight';

    const directMatches: Record<string, string[]> = {
      communication: ['COM', 'IPC'],
      decision_quality: ['STR', 'DEC'],
      problem_solving: ['PRO', 'CRT'],
      emotional_intelligence: ['EI', 'REL', 'EMP', 'SLF'],
      critical_thinking: ['CRT', 'STR'],
      collaboration: ['COL', 'IPC'],
      adaptability: ['ADT', 'FLX'],
      timing: ['DEC', 'STR']
    };

    const codePrefix = competencyCode.substring(0, 3);
    const isDirectMatch = directMatches[metricType]?.some(prefix =>
      competencyCode.startsWith(prefix)
    );

    if (isDirectMatch) {
      baseWeight = 1.0;
      rationale = 'Direct metric-to-competency match';
    } else {
      baseWeight = 0.6;
      rationale = 'Supporting relationship';
    }

    if (isPrimary) {
      baseWeight = Math.min(baseWeight * 1.2, 1.0);
      rationale += ', primary competency boost';
    }

    if (developmentPriority === 'supplementary') {
      baseWeight *= 0.7;
      rationale += ', supplementary priority reduction';
    }

    return { weight: Math.round(baseWeight * 100) / 100, rationale };
  }

  static getConfidenceLevel(
    metricType: string,
    competencyCode: string
  ): 'high' | 'medium' | 'low' {
    const highConfidenceMatches: Record<string, string[]> = {
      communication: ['COM', 'IPC'],
      decision_quality: ['STR', 'DEC'],
      problem_solving: ['PRO', 'CRT'],
      emotional_intelligence: ['EI', 'REL', 'EMP']
    };

    const codePrefix = competencyCode.substring(0, 3);
    const isHighConfidence = highConfidenceMatches[metricType]?.some(prefix =>
      competencyCode.startsWith(prefix)
    );

    if (isHighConfidence) return 'high';

    const mediumConfidenceMatches: Record<string, string[]> = {
      communication: ['COL', 'LDR'],
      decision_quality: ['LDR', 'PRO'],
      critical_thinking: ['STR', 'PRO', 'DEC'],
      collaboration: ['IPC', 'EMP']
    };

    const isMediumConfidence = mediumConfidenceMatches[metricType]?.some(prefix =>
      competencyCode.startsWith(prefix)
    );

    if (isMediumConfidence) return 'medium';

    return 'low';
  }

  static async generateMappingMatches(
    metrics: AssessmentMetric[],
    targetedCompetencies: ScenarioTargetedCompetencyWithDetails[]
  ): Promise<MetricCompetencyMatch[]> {
    const matches: MetricCompetencyMatch[] = [];

    for (const metric of metrics) {
      for (const targetComp of targetedCompetencies) {
        const { method, rationale: methodRationale } = this.getCalculationMethodForPair(
          metric.metric_type,
          targetComp.competency_code
        );

        const { weight, rationale: weightRationale } = this.getMappingWeight(
          metric.metric_type,
          targetComp.competency_code,
          targetComp.is_primary,
          targetComp.development_priority
        );

        const confidence = this.getConfidenceLevel(
          metric.metric_type,
          targetComp.competency_code
        );

        const rationale = `${methodRationale}. ${weightRationale}`;

        matches.push({
          metric_id: metric.id,
          metric_name: metric.name,
          metric_type: metric.metric_type,
          competency_id: targetComp.competency_id,
          competency_name: targetComp.competency_name,
          competency_code: targetComp.competency_code,
          calculation_method: method,
          mapping_weight: weight,
          rationale,
          confidence
        });
      }
    }

    return matches.sort((a, b) => {
      const confidenceOrder = { high: 0, medium: 1, low: 2 };
      if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
        return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      }
      return b.mapping_weight - a.mapping_weight;
    });
  }

  static async autoGenerateMappings(
    scenarioId: string,
    simulationId: string,
    metricIds: string[]
  ): Promise<AutoMappingResult> {
    const result: AutoMappingResult = {
      created: 0,
      skipped: 0,
      errors: [],
      mappings: []
    };

    if (!supabase) {
      result.errors.push('Supabase client not available');
      return result;
    }

    try {
      const targetedCompetencies = await ScenarioCompetencyService.getTargetedCompetencies(scenarioId);

      if (targetedCompetencies.length === 0) {
        result.errors.push('No targeted competencies defined for this scenario');
        return result;
      }

      const { data: metricsData, error: metricsError } = await supabase
        .from('assessment_metrics')
        .select('*')
        .in('id', metricIds);

      if (metricsError) throw metricsError;
      if (!metricsData || metricsData.length === 0) {
        result.errors.push('No valid metrics found');
        return result;
      }

      const existingMappings = await MetricCompetencyMappingService.getSimulationMappings(simulationId);
      const existingKeys = new Set(
        existingMappings.map(m => `${m.metric_id}_${m.competency_id}`)
      );

      const matches = await this.generateMappingMatches(metricsData, targetedCompetencies);

      for (const match of matches) {
        const key = `${match.metric_id}_${match.competency_id}`;

        if (existingKeys.has(key)) {
          result.skipped++;
          continue;
        }

        const mapping = await MetricCompetencyMappingService.createMapping({
          simulation_id: simulationId,
          metric_id: match.metric_id,
          competency_id: match.competency_id,
          calculation_method: match.calculation_method,
          mapping_weight: match.mapping_weight,
          algorithm_config: MetricCompetencyMappingService.getDefaultAlgorithmConfig(match.calculation_method),
          score_conversion_rules: MetricCompetencyMappingService.getDefaultConversionRules(match.calculation_method),
          normalization_method: 'weighted_average',
          is_inherited: false,
          configuration_notes: `Auto-generated: ${match.rationale} (Confidence: ${match.confidence})`
        });

        if (mapping) {
          result.created++;
          result.mappings.push(mapping);
        } else {
          result.errors.push(`Failed to create mapping for ${match.metric_name} -> ${match.competency_name}`);
        }
      }

      return result;
    } catch (error) {
      console.error('[AutoMappingService] Error generating mappings:', error);
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  static async previewMappings(
    scenarioId: string,
    metricIds: string[]
  ): Promise<MetricCompetencyMatch[]> {
    if (!supabase) return [];

    try {
      const targetedCompetencies = await ScenarioCompetencyService.getTargetedCompetencies(scenarioId);

      if (targetedCompetencies.length === 0) {
        return [];
      }

      const { data: metricsData, error: metricsError } = await supabase
        .from('assessment_metrics')
        .select('*')
        .in('id', metricIds);

      if (metricsError) throw metricsError;
      if (!metricsData) return [];

      return await this.generateMappingMatches(metricsData, targetedCompetencies);
    } catch (error) {
      console.error('[AutoMappingService] Error previewing mappings:', error);
      return [];
    }
  }
}
