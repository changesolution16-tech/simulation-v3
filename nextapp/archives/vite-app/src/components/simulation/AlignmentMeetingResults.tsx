import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Target, BarChart3, CheckCircle2 } from 'lucide-react';
import {
  AlignmentMeetingScoringService,
  type ScoringResult,
  type CompetencyScore
} from '../../lib/alignmentMeetingScoring';

interface AlignmentMeetingResultsProps {
  scenarioId: string;
  optionId: string;
  learnerId?: string;
  simulationInstanceId?: string;
}

const AlignmentMeetingResults: React.FC<AlignmentMeetingResultsProps> = ({
  scenarioId,
  optionId,
  learnerId,
  simulationInstanceId
}) => {
  const [results, setResults] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [scenarioId, optionId]);

  const loadResults = async () => {
    setLoading(true);
    const scoringResult = await AlignmentMeetingScoringService.calculateFullAssessment(
      scenarioId,
      optionId
    );

    if (scoringResult && learnerId && simulationInstanceId) {
      await AlignmentMeetingScoringService.recordAssessment(
        learnerId,
        simulationInstanceId,
        scenarioId,
        optionId,
        scoringResult
      );
    }

    setResults(scoringResult);
    setLoading(false);
  };

  const getProficiencyColor = (level: string): string => {
    switch (level) {
      case 'Advanced': return 'bg-green-500';
      case 'Proficient': return 'bg-blue-500';
      case 'Developing': return 'bg-yellow-500';
      case 'Awareness': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getProficiencyTextColor = (level: string): string => {
    switch (level) {
      case 'Advanced': return 'text-green-700';
      case 'Proficient': return 'text-blue-700';
      case 'Developing': return 'text-yellow-700';
      case 'Awareness': return 'text-gray-700';
      default: return 'text-gray-600';
    }
  };

  const renderMetricCard = (label: string, value: number, icon: React.ReactNode) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600">{icon}</div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${value}%` }}
          />
        </div>
      </motion.div>
    );
  };

  const renderCompetencyCard = (comp: CompetencyScore, index: number) => {
    return (
      <motion.div
        key={comp.competency_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-mono text-gray-500">{comp.competency_code}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getProficiencyTextColor(comp.proficiency_level)} bg-opacity-10`}
                    style={{ backgroundColor: `${getProficiencyTextColor(comp.proficiency_level).replace('text-', 'bg-').replace('700', '100')}` }}>
                {comp.proficiency_level}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{comp.competency_name}</h3>
            <p className="text-xs text-gray-600 mt-1">{comp.proficiency_description}</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{comp.score}%</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${getProficiencyColor(comp.proficiency_level)}`}
            style={{ width: `${comp.score}%` }}
          />
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your competency scores...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">Unable to calculate scoring results. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Your Assessment Results</h2>
        </div>
        <p className="text-blue-100 text-lg">{results.overall_assessment}</p>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Metric Scores</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard('BRAVIN Alignment', results.metric_scores.bravin, <Target className="w-5 h-5" />)}
          {renderMetricCard('Trust Impact', results.metric_scores.trust, <CheckCircle2 className="w-5 h-5" />)}
          {renderMetricCard('EI Index', results.metric_scores.ei, <TrendingUp className="w-5 h-5" />)}
          {renderMetricCard('Ethical Quality', results.metric_scores.ethical, <Award className="w-5 h-5" />)}
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Competency Assessment</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Each competency is calculated using a weighted formula combining your metric scores.
          Scores are mapped to proficiency levels: Awareness (0-29%), Developing (30-59%), Proficient (60-79%), and Advanced (80-100%).
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.competency_scores.map((comp, index) => renderCompetencyCard(comp, index))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Understanding Your Scores</span>
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>TBR-03 (Trust Building & Repair):</strong> Calculated as BRAVIN×30% + Trust×50% + EI×20%</p>
          <p><strong>AC-06 (Adaptive Communication):</strong> Calculated as BRAVIN×20% + Trust×30% + EI×50%</p>
          <p><strong>EI-02 (Emotional Intelligence):</strong> Calculated as BRAVIN×20% + Trust×30% + EI×50%</p>
          <p><strong>EL-05 (Ethical Leadership):</strong> Calculated as BRAVIN×30% + Trust×10% + EI×10% + Ethics×50%</p>
          <p><strong>VBD-01 (Values-Based Decision-Making):</strong> Calculated as BRAVIN×40% + Trust×10% + EI×10% + Ethics×40%</p>
        </div>
      </div>
    </div>
  );
};

export default AlignmentMeetingResults;
