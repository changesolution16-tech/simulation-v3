import { LearnerCompetency } from './competencies';
import { MetricAssessment } from './metricScores';

export type ProficiencyLevel = 'awareness' | 'developing' | 'proficient' | 'advanced';

export interface CompetencyFeedback {
  competencyCode: string;
  competencyName: string;
  proficiencyLevel: ProficiencyLevel;
  feedbackText: string;
  growthSuggestion: string;
  relevantMetrics: string[];
}

export interface SimulationFeedbackSummary {
  overallMessage: string;
  competencyFeedback: CompetencyFeedback[];
  learningActions: string[];
  reflectionPrompts: string[];
  performanceTier: 'excellent' | 'good' | 'developing';
  percentageScore: number;
}

const COMPETENCY_FEEDBACK_TEMPLATES = {
  'TBR-03': {
    name: 'Trust Building & Repair',
    awareness: {
      feedback: 'You acknowledged discomfort but often moved past it too quickly. Trust repair begins with naming what others avoid.',
      growth: 'Try holding silence longer and inviting reflection before offering solutions.'
    },
    developing: {
      feedback: 'You recognized moments of tension and began addressing them. Trust repair requires consistent follow-through.',
      growth: 'Practice naming emotional tension explicitly and creating space for others to share their perspective.'
    },
    proficient: {
      feedback: 'You consistently named emotional tension and held space for discomfort. That\'s how trust is repaired.',
      growth: 'Sustain this by modeling vulnerability and inviting shared accountability.'
    },
    advanced: {
      feedback: 'You demonstrated exceptional trust repair skills by holding space, naming tension, and following through with visible action.',
      growth: 'Continue modeling vulnerability and help others develop their own trust repair capabilities.'
    }
  },
  'AC-06': {
    name: 'Adaptive Communication',
    awareness: {
      feedback: 'Your communication was clear, but not always responsive to emotional tone.',
      growth: 'Practice adjusting your message to match the moment — especially when tension is present.'
    },
    developing: {
      feedback: 'You adapted your communication style in some situations. Flexibility in tone and approach is key.',
      growth: 'Focus on reading emotional cues and adjusting your timing and delivery accordingly.'
    },
    proficient: {
      feedback: 'You adapted your tone and timing to meet the emotional needs of the team.',
      growth: 'Keep flexing your style to hold both clarity and care.'
    },
    advanced: {
      feedback: 'You skillfully adjusted your communication to match each unique situation, balancing empathy with directness.',
      growth: 'Share your adaptive communication approach with others and help them develop this skill.'
    }
  },
  'EI-02': {
    name: 'Emotional Intelligence',
    awareness: {
      feedback: 'You noticed some emotional signals, but missed others.',
      growth: 'Emotional intelligence means listening beyond words — to tone, silence, and body language.'
    },
    developing: {
      feedback: 'You picked up on key emotional signals and began responding to them. Awareness is the first step.',
      growth: 'Deepen your practice by naming what you notice and checking your interpretation with others.'
    },
    proficient: {
      feedback: 'You responded with empathy and precision.',
      growth: 'Deepen this by naming emotional truths and inviting others to do the same.'
    },
    advanced: {
      feedback: 'You demonstrated sophisticated emotional intelligence by reading subtle signals and responding with both empathy and strategic awareness.',
      growth: 'Help create environments where others feel safe expressing emotions and can develop their own emotional intelligence.'
    }
  },
  'EL-05': {
    name: 'Ethical Leadership',
    awareness: {
      feedback: 'You respected concerns but didn\'t always act on them.',
      growth: 'Ethical leadership means responding visibly — even when it\'s uncomfortable.'
    },
    developing: {
      feedback: 'You recognized ethical dilemmas and took initial action. Consistency builds credibility.',
      growth: 'Anchor your decisions in clear values and communicate the "why" behind ethical choices.'
    },
    proficient: {
      feedback: 'You made ethical choices under pressure.',
      growth: 'Sustain this by aligning decisions with shared values and following through publicly.'
    },
    advanced: {
      feedback: 'You demonstrated courageous ethical leadership by making difficult decisions aligned with values, even under pressure.',
      growth: 'Continue championing ethical practices and help build systems that support ethical decision-making.'
    }
  },
  'VBD-01': {
    name: 'Values-Based Decision-Making',
    awareness: {
      feedback: 'You explained decisions, but didn\'t always anchor them in values.',
      growth: 'Leadership means naming what matters — especially when trust is at risk.'
    },
    developing: {
      feedback: 'You began connecting decisions to values. Clarity about values builds trust.',
      growth: 'Practice explicitly naming the values driving each decision and inviting dialogue about value conflicts.'
    },
    proficient: {
      feedback: 'You led with values and invited others to do the same.',
      growth: 'Keep using values as a compass in moments of tension.'
    },
    advanced: {
      feedback: 'You consistently anchored decisions in shared values and helped others see the connection between values and action.',
      growth: 'Create structures that embed values-based decision-making into everyday practices.'
    }
  }
};

const BRAVIN_LEARNING_ACTIONS = [
  'Practice BRAVIN\'s core sequence: Notice → Name → Hold → Align → Repair',
  'Use silence as a signal, not a void',
  'Invite emotional reflection before offering solutions',
  'Surface misalignment early — don\'t wait for fracture',
  'Anchor decisions in shared values, not just outcomes',
  'Hold discomfort with curiosity rather than rushing to fix',
  'Name what others avoid — that\'s where trust begins'
];

const BRAVIN_REFLECTION_PROMPTS = [
  'What emotional signals did I notice — and what did I do with them?',
  'When did I choose momentum over alignment? What was the cost?',
  'How did I hold discomfort in this simulation? Where did I avoid it?',
  'What values were at stake in each scenario? Did I lead with them?',
  'Where did I rush past silence or tension? What might I have missed?',
  'How did my choices impact trust? What would I do differently?',
  'What moments required courage? Did I act with integrity?'
];

export class CompetencyFeedbackService {

  static determineProficiencyLevel(score: number, maxScore: number): ProficiencyLevel {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 85) return 'advanced';
    if (percentage >= 70) return 'proficient';
    if (percentage >= 50) return 'developing';
    return 'awareness';
  }

  static generateCompetencyFeedback(
    competencyCode: string,
    proficiencyLevel: ProficiencyLevel,
    relevantMetrics: string[] = []
  ): CompetencyFeedback | null {
    const template = COMPETENCY_FEEDBACK_TEMPLATES[competencyCode as keyof typeof COMPETENCY_FEEDBACK_TEMPLATES];

    if (!template) return null;

    const levelFeedback = template[proficiencyLevel];

    return {
      competencyCode,
      competencyName: template.name,
      proficiencyLevel,
      feedbackText: levelFeedback.feedback,
      growthSuggestion: levelFeedback.growth,
      relevantMetrics
    };
  }

  static async generateSimulationFeedback(
    learnerCompetencies: LearnerCompetency[],
    assessments: MetricAssessment[],
    performanceTier: 'excellent' | 'good' | 'developing',
    percentageScore: number
  ): Promise<SimulationFeedbackSummary> {

    const overallMessage = this.generateOverallMessage(performanceTier, percentageScore);

    const competencyFeedback: CompetencyFeedback[] = [];

    for (const learnerComp of learnerCompetencies) {
      const competencyCode = learnerComp.competency?.code;
      if (!competencyCode) continue;

      const relevantMetrics = assessments
        .filter(a => a.metric?.name.toLowerCase().includes(competencyCode.toLowerCase().split('-')[0]))
        .map(a => a.metric?.name || '')
        .filter(Boolean);

      const proficiency = this.determineProficiencyLevel(
        learnerComp.current_score,
        100
      );

      const feedback = this.generateCompetencyFeedback(
        competencyCode,
        proficiency,
        relevantMetrics
      );

      if (feedback) {
        competencyFeedback.push(feedback);
      }
    }

    const learningActions = this.selectLearningActions(competencyFeedback);
    const reflectionPrompts = this.selectReflectionPrompts(performanceTier);

    return {
      overallMessage,
      competencyFeedback,
      learningActions,
      reflectionPrompts,
      performanceTier,
      percentageScore
    };
  }

  private static generateOverallMessage(
    tier: 'excellent' | 'good' | 'developing',
    score: number
  ): string {
    const baseMessage = `You've completed a leadership simulation built around BRAVIN — a framework for emotionally intelligent decision-making. Your responses show how you navigate tension, hold emotional signals, and lead with integrity.`;

    const tierMessages = {
      excellent: `${baseMessage}\n\nYour performance demonstrates advanced mastery of the BRAVIN framework. You consistently recognized emotional signals, held space for discomfort, and made values-aligned decisions.`,
      good: `${baseMessage}\n\nYou demonstrated solid understanding of the BRAVIN framework, with strong moments of emotional awareness and values-based leadership. Continue building on these foundations.`,
      developing: `${baseMessage}\n\nYou're developing your BRAVIN capabilities. Each simulation is an opportunity to practice noticing signals, naming tension, and aligning actions with values.`
    };

    return tierMessages[tier];
  }

  private static selectLearningActions(competencyFeedback: CompetencyFeedback[]): string[] {
    const allActions = [...BRAVIN_LEARNING_ACTIONS];

    const lowProficiencyCompetencies = competencyFeedback.filter(
      cf => cf.proficiencyLevel === 'awareness' || cf.proficiencyLevel === 'developing'
    );

    if (lowProficiencyCompetencies.some(cf => cf.competencyCode.includes('TBR'))) {
      return allActions.filter(a =>
        a.includes('trust') || a.includes('Notice') || a.includes('silence')
      ).concat(allActions.filter(a =>
        !a.includes('trust') && !a.includes('Notice') && !a.includes('silence')
      )).slice(0, 5);
    }

    if (lowProficiencyCompetencies.some(cf => cf.competencyCode.includes('EI'))) {
      return allActions.filter(a =>
        a.includes('emotional') || a.includes('discomfort')
      ).concat(allActions.filter(a =>
        !a.includes('emotional') && !a.includes('discomfort')
      )).slice(0, 5);
    }

    return allActions.slice(0, 5);
  }

  private static selectReflectionPrompts(tier: 'excellent' | 'good' | 'developing'): string[] {
    if (tier === 'excellent') {
      return BRAVIN_REFLECTION_PROMPTS.filter((_, i) => i >= 3);
    }

    if (tier === 'developing') {
      return BRAVIN_REFLECTION_PROMPTS.filter((_, i) => i < 4);
    }

    return BRAVIN_REFLECTION_PROMPTS.slice(1, 5);
  }
}
