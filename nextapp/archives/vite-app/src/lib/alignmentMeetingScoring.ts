import { supabase } from './supabase';

export interface MetricScores {
  bravin: number;
  trust: number;
  ei: number;
  ethical: number;
}

export interface CompetencyScore {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  score: number;
  proficiency_level: string;
  proficiency_description: string;
}

export interface ScoringResult {
  metric_scores: MetricScores;
  competency_scores: CompetencyScore[];
  overall_assessment: string;
}

export const COMPETENCY_WEIGHTS = {
  'TBR-03': {
    bravin: 0.3,
    trust: 0.5,
    ei: 0.2,
    ethical: 0.0
  },
  'AC-06': {
    bravin: 0.2,
    trust: 0.3,
    ei: 0.5,
    ethical: 0.0
  },
  'EI-02': {
    bravin: 0.2,
    trust: 0.3,
    ei: 0.5,
    ethical: 0.0
  },
  'EL-05': {
    bravin: 0.3,
    trust: 0.1,
    ei: 0.1,
    ethical: 0.5
  },
  'VBD-01': {
    bravin: 0.4,
    trust: 0.1,
    ei: 0.1,
    ethical: 0.4
  }
};

export const PROFICIENCY_THRESHOLDS = [
  { min: 0, max: 29, level: 'Awareness', description: 'Beginning to recognize and understand concepts' },
  { min: 30, max: 59, level: 'Developing', description: 'Applying skills with growing consistency' },
  { min: 60, max: 79, level: 'Proficient', description: 'Demonstrating competence independently' },
  { min: 80, max: 100, level: 'Advanced', description: 'Mastering and modeling for others' }
];

export class AlignmentMeetingScoringService {
  static calculateCompetencyScore(
    competencyCode: string,
    metricScores: MetricScores
  ): number {
    const weights = COMPETENCY_WEIGHTS[competencyCode as keyof typeof COMPETENCY_WEIGHTS];
    if (!weights) {
      console.error(`No weights defined for competency: ${competencyCode}`);
      return 0;
    }

    const score =
      (metricScores.bravin * weights.bravin) +
      (metricScores.trust * weights.trust) +
      (metricScores.ei * weights.ei) +
      (metricScores.ethical * weights.ethical);

    return Math.round(score * 10) / 10;
  }

  static getProficiencyLevel(score: number): { level: string; description: string } {
    const threshold = PROFICIENCY_THRESHOLDS.find(
      t => score >= t.min && score <= t.max
    );

    if (!threshold) {
      return { level: 'Unknown', description: 'Score out of range' };
    }

    return {
      level: threshold.level,
      description: threshold.description
    };
  }

  static async calculateFullAssessment(
    scenarioId: string,
    optionId: string
  ): Promise<ScoringResult | null> {
    if (!supabase) return null;

    try {
      const { data: metricData, error: metricError } = await supabase
        .from('scenario_option_metrics')
        .select(`
          score_value,
          metric:assessment_metrics(id, name, metric_type)
        `)
        .eq('scenario_id', scenarioId)
        .eq('option_id', optionId);

      if (metricError) throw metricError;
      if (!metricData || metricData.length === 0) {
        console.error('No metric scores found for this option');
        return null;
      }

      const metricScores: MetricScores = {
        bravin: 0,
        trust: 0,
        ei: 0,
        ethical: 0
      };

      metricData.forEach(m => {
        const metric = m.metric as any;
        const score = parseFloat(m.score_value.toString());

        switch (metric.metric_type) {
          case 'bravin_alignment':
            metricScores.bravin = score;
            break;
          case 'trust_impact':
            metricScores.trust = score;
            break;
          case 'emotional_intelligence_index':
            metricScores.ei = score;
            break;
          case 'ethical_decision_quality':
            metricScores.ethical = score;
            break;
        }
      });

      const { data: competencies, error: compError } = await supabase
        .from('competencies')
        .select('id, code, name')
        .in('code', ['TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01'])
        .eq('is_active', true);

      if (compError) throw compError;

      const competencyScores: CompetencyScore[] = [];

      for (const comp of competencies || []) {
        const score = this.calculateCompetencyScore(comp.code, metricScores);
        const proficiency = this.getProficiencyLevel(score);

        competencyScores.push({
          competency_id: comp.id,
          competency_code: comp.code,
          competency_name: comp.name,
          score,
          proficiency_level: proficiency.level,
          proficiency_description: proficiency.description
        });
      }

      competencyScores.sort((a, b) => b.score - a.score);

      const avgScore = competencyScores.reduce((sum, c) => sum + c.score, 0) / competencyScores.length;
      const overallProficiency = this.getProficiencyLevel(avgScore);

      const overallAssessment = `Overall ${overallProficiency.level} level performance (${Math.round(avgScore)}%). ` +
        `Strongest: ${competencyScores[0]?.competency_name} (${competencyScores[0]?.score}%). ` +
        `Development area: ${competencyScores[competencyScores.length - 1]?.competency_name} ` +
        `(${competencyScores[competencyScores.length - 1]?.score}%).`;

      return {
        metric_scores: metricScores,
        competency_scores: competencyScores,
        overall_assessment: overallAssessment
      };
    } catch (error) {
      console.error('[AlignmentMeetingScoring] Error calculating assessment:', error);
      return null;
    }
  }

  static async recordAssessment(
    learnerId: string,
    simulationInstanceId: string,
    scenarioId: string,
    optionId: string,
    scoringResult: ScoringResult
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const assessmentPromises = scoringResult.competency_scores.map(comp =>
        supabase.from('learner_competencies').upsert({
          learner_id: learnerId,
          competency_id: comp.competency_id,
          current_score: comp.score,
          current_level: this.proficiencyLevelToNumber(comp.proficiency_level),
          is_mastered: comp.score >= 80,
          last_assessed_at: new Date().toISOString(),
          total_practice_count: 1
        }, {
          onConflict: 'learner_id,competency_id',
          ignoreDuplicates: false
        })
      );

      await Promise.all(assessmentPromises);

      console.log('[AlignmentMeetingScoring] Successfully recorded assessment for learner:', learnerId);
      return true;
    } catch (error) {
      console.error('[AlignmentMeetingScoring] Error recording assessment:', error);
      return false;
    }
  }

  private static proficiencyLevelToNumber(level: string): number {
    switch (level) {
      case 'Awareness': return 1;
      case 'Developing': return 2;
      case 'Proficient': return 3;
      case 'Advanced': return 4;
      default: return 1;
    }
  }

  static getExpectedScores(optionNumber: number): { metrics: MetricScores; competencies: Record<string, number> } {
    const expectedMetrics: Record<number, MetricScores> = {
      1: { bravin: 30, trust: 25, ei: 20, ethical: 40 },
      2: { bravin: 50, trust: 50, ei: 40, ethical: 60 },
      3: { bravin: 80, trust: 75, ei: 80, ethical: 80 },
      4: { bravin: 100, trust: 100, ei: 100, ethical: 100 }
    };

    const metrics = expectedMetrics[optionNumber] || expectedMetrics[1];
    const competencies: Record<string, number> = {};

    ['TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01'].forEach(code => {
      competencies[code] = this.calculateCompetencyScore(code, metrics);
    });

    return { metrics, competencies };
  }
}
