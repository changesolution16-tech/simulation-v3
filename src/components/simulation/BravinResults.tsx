'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Target,
  Eye,
  Heart,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

type BravinDimensionCode = 'BOLDNESS' | 'RESPONSIBILITY' | 'ACCOUNTABILITY' | 'VISION' | 'INTEGRITY' | 'NURTURANCE';

interface BravinAssessmentResult {
  overall_alignment_score: number;
  decision_count: number;
  dimension_scores: Record<string, number>;
  strengths: BravinDimensionCode[];
  development_areas: BravinDimensionCode[];
  trust_impact_rating: number;
  ethical_decision_quality: number;
  emotional_intelligence_index: number;
  cultural_stewardship_score: number;
  trust_events_summary: {
    trust_built: number;
    trust_maintained: number;
    trust_repaired: number;
    trust_damaged: number;
  };
}

interface BravinResultsProps {
  learnerId: string;
  simulationInstanceId?: string;
  showDetailedBreakdown?: boolean;
}

const dimensionIcons: Record<string, React.ElementType> = {
  BOLDNESS: Zap,
  RESPONSIBILITY: Shield,
  ACCOUNTABILITY: Target,
  VISION: Eye,
  INTEGRITY: Heart,
  NURTURANCE: Users
};

const dimensionColors: Record<string, { bg: string; text: string; border: string }> = {
  BOLDNESS: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  RESPONSIBILITY: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  ACCOUNTABILITY: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  VISION: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  INTEGRITY: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  NURTURANCE: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' }
};

const BravinResults: React.FC<BravinResultsProps> = ({
  learnerId,
  simulationInstanceId,
  showDetailedBreakdown = true
}) => {
  const [result, setResult] = useState<BravinAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [learnerId, simulationInstanceId]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (simulationInstanceId) {
        params.append('instanceId', simulationInstanceId);
      }

      const response = await fetch(`/api/bravin/${learnerId}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Error loading BRAVIN results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-blue-900 mb-3">
          BRAVIN Assessment Not Available
        </h3>
        <div className="max-w-2xl mx-auto text-left space-y-3">
          <p className="text-blue-800">
            BRAVIN (Boldness, Responsibility, Accountability, Vision, Integrity, Nurturance)
            assessment requires scenarios with configured BRAVIN impact mappings.
          </p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Developing';
    return 'Needs Focus';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Leadership Culture Assessment</h2>
            <p className="text-blue-100">BRAVIN Framework Results</p>
          </div>
          <Award className="w-16 h-16 opacity-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <p className="text-blue-100 text-sm mb-2">Overall BRAVIN Alignment</p>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold">{Math.round(result.overall_alignment_score)}</span>
              <span className="text-xl ml-2">/100</span>
            </div>
            <p className="text-blue-100 mt-2">{getScoreLabel(result.overall_alignment_score)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <p className="text-blue-100 text-sm mb-2">Decisions Analyzed</p>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold">{result.decision_count}</span>
            </div>
            <p className="text-blue-100 mt-2">Leadership choices assessed</p>
          </div>
        </div>
      </motion.div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2 text-blue-600" />
          BRAVIN Dimension Scores
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(result.dimension_scores) as [string, number][]).map(([dimension, score]) => {
            const dimCode = dimension.toUpperCase() as BravinDimensionCode;
            const Icon = dimensionIcons[dimCode] || Award;
            const colors = dimensionColors[dimCode];
            const isStrength = result.strengths.includes(dimCode);
            const isDevelopmentArea = result.development_areas.includes(dimCode);

            return (
              <motion.div
                key={dimension}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 relative overflow-hidden`}
              >
                {isStrength && (
                  <div className="absolute top-2 right-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {isDevelopmentArea && (
                  <div className="absolute top-2 right-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                )}

                <div className="flex items-center mb-3">
                  <Icon className={`w-6 h-6 ${colors.text} mr-2`} />
                  <h4 className={`font-semibold ${colors.text} capitalize`}>
                    {dimension.replace('_', ' ')}
                  </h4>
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline">
                    <span className={`text-3xl font-bold ${colors.text}`}>
                      {Math.round(score)}
                    </span>
                    <span className={`text-lg ml-1 ${colors.text} opacity-60`}>/100</span>
                  </div>
                </div>

                <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${colors.text.replace('text-', 'bg-')} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <p className={`text-xs ${colors.text} opacity-75 mt-2`}>
                  {getScoreLabel(score)}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Top Strengths</h4>
            </div>
            <div className="space-y-1">
              {result.strengths.map(strength => (
                <p key={strength} className="text-sm text-green-700 capitalize">
                  {strength.replace('_', ' ').toLowerCase()}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
              <h4 className="font-medium text-amber-800">Development Focus</h4>
            </div>
            <div className="space-y-1">
              {result.development_areas.map(area => (
                <p key={area} className="text-sm text-amber-700 capitalize">
                  {area.replace('_', ' ').toLowerCase()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDetailedBreakdown && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start">
            <Info className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">About BRAVIN Assessment</h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                The BRAVIN framework measures how consistently your actions reflect leadership
                culture values: <strong>Boldness</strong>, <strong>Responsibility</strong>,{' '}
                <strong>Accountability</strong>, <strong>Vision</strong>, <strong>Integrity</strong>,
                and <strong>Nurturance</strong>. This assessment helps identify your strengths and
                areas for development as a leader.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BravinResults;
