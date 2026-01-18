'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Target, BookOpen } from 'lucide-react';
type LearnerCompetency = {
  competency_id: string;
  competency_code: string;
  competency_name: string;
  current_score: number;
  level_reached: number;
  experiences_count: number;
  last_updated: string;
};

type Competency = {
  id: string;
  competency_code: string;
  competency_name: string;
  competency_description: string;
  competency_level: number;
};

interface CompetencyResultsProps {
  learnerId: string;
  simulationId: string;
}

const CompetencyResults: React.FC<CompetencyResultsProps> = ({ learnerId, simulationId }) => {
  const [competencies, setCompetencies] = useState<LearnerCompetency[]>([]);
  const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetencies();
  }, [learnerId]);

  const loadCompetencies = async () => {
    setLoading(true);
    try {
      const [learnerResponse, allResponse] = await Promise.all([
        fetch(`/api/competencies/learner/${learnerId}`),
        fetch('/api/competencies')
      ]);

      if (learnerResponse.ok && allResponse.ok) {
        const learnerData = await learnerResponse.json();
        const allData = await allResponse.json();

        setCompetencies(learnerData);
        setAllCompetencies(allData.filter((c: any) => c.competency_level === 2));
      }
    } catch (error) {
      console.error('Error loading competencies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (competencies.length === 0 && allCompetencies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Competency Development</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          No competencies available. Please contact your administrator.
        </p>
      </div>
    );
  }

  if (competencies.length === 0 && allCompetencies.length > 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Leadership Competencies</h2>
          </div>
          <p className="text-blue-100">
            Complete scenarios with competency impacts to track your development in these key leadership skills.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Available Competencies
          </h3>

          <div className="space-y-4">
            {allCompetencies.map((comp, index) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{comp.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                        Not Yet Practiced
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{comp.description}</p>
                  </div>
                </div>

                {comp.tags && comp.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {comp.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {comp.proficiency_levels && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proficiency Levels
                    </div>
                    <div className="flex gap-1">
                      {comp.proficiency_levels.map((level) => (
                        <div
                          key={level.level}
                          className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700"
                          title={`${level.name}: ${level.description}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Ready to Start Your Development Journey?
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Practice scenarios that include competency tracking to begin building these essential leadership skills.
                Each decision you make will contribute to your growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getMasteredCount = () => competencies.filter(c => c.is_mastered).length;
  const getAverageScore = () => {
    if (competencies.length === 0) return 0;
    const total = competencies.reduce((sum, c) => sum + c.current_score, 0);
    return Math.round(total / competencies.length);
  };

  const getImprovingCount = () => competencies.filter(c => c.trend === 'improving').length;

  const getLevelColor = (level: number): string => {
    if (level >= 4) return 'from-green-500 to-emerald-600';
    if (level >= 3) return 'from-blue-500 to-blue-600';
    if (level >= 2) return 'from-yellow-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Leadership Competencies</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{competencies.length}</div>
            <div className="text-sm opacity-90">Competencies Practiced</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{getAverageScore()}%</div>
            <div className="text-sm opacity-90">Average Proficiency</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/20 rounded-lg p-4"
          >
            <div className="text-3xl font-bold">{getMasteredCount()}</div>
            <div className="text-sm opacity-90">Competencies Mastered</div>
          </motion.div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Your Competency Progress
        </h3>

        <div className="space-y-4">
          {competencies
            .sort((a, b) => b.current_score - a.current_score)
            .map((comp, index) => {
              const proficiency = comp.competency?.proficiency_levels?.find(
                pl => pl.level === comp.current_level
              );

              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {comp.competency?.name}
                        </h4>
                        {comp.is_mastered && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                            Mastered
                          </span>
                        )}
                        {getTrendIcon(comp.trend)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {comp.competency?.description}
                      </p>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {comp.current_score}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {proficiency?.name || `Level ${comp.current_level}`}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress to next level</span>
                      <span>{comp.current_score}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.current_score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
                        className={`h-full bg-gradient-to-r ${getLevelColor(comp.current_level)}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Practiced {comp.total_practice_count} times</span>
                    {comp.growth_rate && comp.growth_rate > 0 && (
                      <span className="text-green-600 font-medium">
                        +{comp.growth_rate.toFixed(1)}% growth
                      </span>
                    )}
                  </div>

                  {comp.competency?.proficiency_levels && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Proficiency Levels
                      </div>
                      <div className="flex gap-1">
                        {comp.competency.proficiency_levels.map((level) => (
                          <div
                            key={level.level}
                            className={`flex-1 h-2 rounded-full ${
                              level.level <= comp.current_level
                                ? `bg-gradient-to-r ${getLevelColor(level.level)}`
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                            title={`${level.name}: ${level.description}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
        </div>
      </div>

      {getImprovingCount() > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Great Progress!
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm">
                You&apos;re showing improvement in {getImprovingCount()} competenc{getImprovingCount() === 1 ? 'y' : 'ies'}.
                Keep practicing to advance to the next proficiency level.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Continue Your Development
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
              Practice more scenarios to deepen your competencies and unlock new levels of proficiency.
              Each decision you make contributes to your growth as a leader.
            </p>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Focus on competencies below 50% to build a well-rounded skill set</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Challenge yourself with higher difficulty scenarios for faster growth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Revisit scenarios to practice different decision-making approaches</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetencyResults;
