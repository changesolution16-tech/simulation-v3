import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Competency } from '../../lib/competencies';

interface CompetencyImpact {
  impact: number;
  description?: string;
}

interface CompetencyChange {
  competency: Competency;
  impact: number;
  description?: string;
  previousScore?: number;
  newScore?: number;
  previousLevel?: number;
  newLevel?: number;
}

interface CompetencyFeedbackProps {
  changes: CompetencyChange[];
}

const CompetencyFeedback: React.FC<CompetencyFeedbackProps> = ({ changes }) => {
  if (!changes || changes.length === 0) return null;

  const getImpactColor = (impact: number): string => {
    if (impact > 5) return 'from-green-500 to-emerald-600';
    if (impact > 0) return 'from-green-400 to-green-500';
    if (impact < -5) return 'from-red-500 to-rose-600';
    if (impact < 0) return 'from-orange-400 to-red-500';
    return 'from-gray-400 to-gray-500';
  };

  const getImpactBgColor = (impact: number): string => {
    if (impact > 0) return 'bg-green-50 border-green-200';
    if (impact < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200 dark:border-gray-700';
  };

  const getImpactTextColor = (impact: number): string => {
    if (impact > 0) return 'text-green-700';
    if (impact < 0) return 'text-red-700';
    return 'text-gray-700';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="w-5 h-5" />;
    if (impact < 0) return <TrendingDown className="w-5 h-5" />;
    return null;
  };

  const getImpactLabel = (impact: number): string => {
    if (impact >= 8) return 'Excellent';
    if (impact >= 5) return 'Strong';
    if (impact >= 3) return 'Good';
    if (impact > 0) return 'Positive';
    if (impact <= -8) return 'Critical Issue';
    if (impact <= -5) return 'Significant Gap';
    if (impact <= -3) return 'Needs Improvement';
    return 'Minor Gap';
  };

  const getLevelName = (competency: Competency, level: number): string => {
    const profLevel = competency.proficiency_levels?.find(pl => pl.level === level);
    return profLevel?.name || `Level ${level}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Skills Developed</h3>
          <p className="text-sm text-gray-600">Your choice affected these competencies</p>
        </div>
      </div>

      <div className="space-y-4">
        {changes.map((change, index) => (
          <motion.div
            key={change.competency.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-lg p-4 ${getImpactBgColor(change.impact)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getImpactColor(change.impact)} flex items-center justify-center flex-shrink-0`}>
                  {getImpactIcon(change.impact)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{change.competency.name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{change.competency.description}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full font-bold text-sm ${getImpactTextColor(change.impact)} bg-white border-2 ${getImpactBgColor(change.impact).replace('bg-', 'border-').replace('-50', '-300')}`}>
                {change.impact > 0 ? '+' : ''}{change.impact}
              </div>
            </div>

            {change.description && (
              <div className="flex items-start gap-2 mb-3 p-3 bg-white bg-opacity-60 rounded">
                <Info className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                <p className="text-sm text-gray-700 italic">{change.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactTextColor(change.impact)} bg-white`}>
                  {getImpactLabel(change.impact)}
                </span>
                {change.competency.tags && change.competency.tags.length > 0 && (
                  <div className="flex gap-1">
                    {change.competency.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(change.previousLevel !== undefined && change.newLevel !== undefined) && (
                <div className="text-sm">
                  {change.previousLevel === change.newLevel ? (
                    <span className="text-gray-600">
                      {getLevelName(change.competency, change.newLevel)}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {getLevelName(change.competency, change.previousLevel)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">→</span>
                      <span className="font-semibold text-green-700">
                        {getLevelName(change.competency, change.newLevel)}
                      </span>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-green-600 text-lg"
                      >
                        🎉
                      </motion.span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(change.previousScore !== undefined && change.newScore !== undefined) && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{change.newScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: `${change.previousScore}%` }}
                    animate={{ width: `${change.newScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${getImpactColor(change.impact)}`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Keep developing these skills!</p>
            <p className="text-blue-700">
              Continue making thoughtful decisions to advance your proficiency in these competencies.
              Each scenario builds on the previous one to help you master leadership skills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetencyFeedback;
