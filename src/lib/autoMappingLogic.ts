export type CalculationMethod =
  | 'linear'
  | 'threshold_based'
  | 'exponential_growth'
  | 'compensatory'
  | 'conjunctive'
  | 'custom';

export interface MappingMetric {
  id: string;
  name: string;
  metric_type: string;
}

export interface TargetedCompetency {
  competency_id: string;
  competency_name: string;
  competency_code: string;
  is_primary: boolean;
  development_priority: 'primary' | 'secondary' | 'supplementary';
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

export const getCalculationMethodForPair = (
  metricType: string,
  competencyCode: string
): { method: CalculationMethod; rationale: string } => {
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
};

export const getMappingWeight = (
  metricType: string,
  competencyCode: string,
  isPrimary: boolean,
  developmentPriority: string
): { weight: number; rationale: string } => {
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
};

export const getConfidenceLevel = (
  metricType: string,
  competencyCode: string
): 'high' | 'medium' | 'low' => {
  const highConfidenceMatches: Record<string, string[]> = {
    communication: ['COM', 'IPC'],
    decision_quality: ['STR', 'DEC'],
    problem_solving: ['PRO', 'CRT'],
    emotional_intelligence: ['EI', 'REL', 'EMP']
  };

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
};

export const generateMappingMatches = (
  metrics: MappingMetric[],
  targetedCompetencies: TargetedCompetency[]
): MetricCompetencyMatch[] => {
  const matches: MetricCompetencyMatch[] = [];

  for (const metric of metrics) {
    for (const targetComp of targetedCompetencies) {
      const { method, rationale: methodRationale } = getCalculationMethodForPair(
        metric.metric_type,
        targetComp.competency_code
      );

      const { weight, rationale: weightRationale } = getMappingWeight(
        metric.metric_type,
        targetComp.competency_code,
        targetComp.is_primary,
        targetComp.development_priority
      );

      const confidence = getConfidenceLevel(metric.metric_type, targetComp.competency_code);

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
    const confidenceOrder = { high: 0, medium: 1, low: 2 } as const;
    if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
      return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    }
    return b.mapping_weight - a.mapping_weight;
  });
};

export const getDefaultAlgorithmConfig = (method: CalculationMethod) => {
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
};

export const getDefaultConversionRules = (method: CalculationMethod) => {
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
};
