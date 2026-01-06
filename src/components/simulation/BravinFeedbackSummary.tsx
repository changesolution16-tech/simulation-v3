'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Lightbulb, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';

export interface CompetencyFeedback {
  competencyCode: string;
  competencyName: string;
  proficiencyLevel: 'advanced' | 'proficient' | 'developing' | 'awareness';
  feedbackText: string;
  growthSuggestion: string;
}

export interface SimulationFeedbackSummary {
  overallMessage: string;
  competencyFeedback: CompetencyFeedback[];
  learningActions: string[];
  reflectionPrompts: string[];
}

interface BravinFeedbackSummaryProps {
  feedback: SimulationFeedbackSummary;
}

const getProficiencyColor = (level: string) => {
  switch (level) {
    case 'advanced':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-900 dark:text-green-100',
        badge: 'bg-green-500 text-white'
      };
    case 'proficient':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-900 dark:text-blue-100',
        badge: 'bg-blue-500 text-white'
      };
    case 'developing':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-900 dark:text-amber-100',
        badge: 'bg-amber-500 text-white'
      };
    case 'awareness':
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-900 dark:text-orange-100',
        badge: 'bg-orange-500 text-white'
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-900 dark:text-gray-100',
        badge: 'bg-gray-500 text-white'
      };
  }
};

const CompetencyFeedbackCard: React.FC<{ competency: CompetencyFeedback }> = ({ competency }) => {
  const colors = getProficiencyColor(competency.proficiencyLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {competency.competencyCode}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
              {competency.proficiencyLevel.charAt(0).toUpperCase() + competency.proficiencyLevel.slice(1)}
            </span>
          </div>
          <h4 className={`text-lg font-bold ${colors.text}`}>
            {competency.competencyName}
          </h4>
        </div>
      </div>

      <div className={`${colors.text} text-sm leading-relaxed mb-4`}>
        <p>{competency.feedbackText}</p>
      </div>

      <div className={`bg-white/50 dark:bg-black/20 rounded-lg p-4 border ${colors.border}`}>
        <div className="flex items-start gap-2">
          <TrendingUp className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Growth Action</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{competency.growthSuggestion}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BravinFeedbackSummary: React.FC<BravinFeedbackSummaryProps> = ({ feedback }) => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-blue-500 rounded-full">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              Your BRAVIN Journey
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed whitespace-pre-line">
              {feedback.overallMessage}
            </p>
          </div>
        </div>
      </motion.div>

      {feedback.competencyFeedback.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            Competency-Based Feedback
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {feedback.competencyFeedback.map((competency, index) => (
              <CompetencyFeedbackCard key={index} competency={competency} />
            ))}
          </div>
        </div>
      )}

      {feedback.learningActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-600" />
            Suggested Learning Actions
          </h3>
          <ul className="space-y-3">
            {feedback.learningActions.map((action, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{index + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{action}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {feedback.reflectionPrompts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6"
        >
          <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Reflection Prompts
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
            Take a moment to reflect on these questions. Consider journaling your thoughts or discussing them with a coach or peer.
          </p>
          <div className="space-y-3">
            {feedback.reflectionPrompts.map((prompt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-900 dark:text-purple-100 font-medium italic">
                    {prompt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BravinFeedbackSummary;
