import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Target, Eye, Heart, Users, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BravinMetricsService } from '../../lib/bravinMetrics';
import { BravinLearnerScore, BravinDimensionCode } from '../../types';

interface BravinProfileWidgetProps {
  learnerId: string;
}

const dimensionIcons: Record<BravinDimensionCode, React.ElementType> = {
  BOLDNESS: Zap,
  RESPONSIBILITY: Shield,
  ACCOUNTABILITY: Target,
  VISION: Eye,
  INTEGRITY: Heart,
  NURTURANCE: Users
};

const BravinProfileWidget: React.FC<BravinProfileWidgetProps> = ({ learnerId }) => {
  const [scores, setScores] = useState<BravinLearnerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadScores();
  }, [learnerId]);

  const loadScores = async () => {
    setLoading(true);
    const data = await BravinMetricsService.getLearnerScores(learnerId);
    setScores(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
            <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            Start Your BRAVIN Journey
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
            Complete simulations to develop your leadership profile and track your progress across the six dimensions of JMMB's BRAVIN culture framework.
          </p>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Boldness</p>
              </div>
              <div>
                <Shield className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Responsibility</p>
              </div>
              <div>
                <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Accountability</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avgScore = scores.reduce((sum, s) => sum + s.current_score, 0) / scores.length;
  const topStrength = [...scores].sort((a, b) => b.current_score - a.current_score)[0];
  const improvingCount = scores.filter(s => s.trend === 'improving').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">BRAVIN Leadership Profile</h3>
            <p className="text-blue-100 text-sm">JMMB Culture Assessment</p>
          </div>
          <Award className="w-10 h-10 opacity-30" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Overall Score</p>
            <p className="text-2xl font-bold">{Math.round(avgScore)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Top Strength</p>
            <p className="text-sm font-semibold capitalize line-clamp-1">
              {topStrength?.dimension?.name || 'N/A'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Improving</p>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <p className="text-2xl font-bold">{improvingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {scores.slice(0, 3).map((score) => {
            const Icon = score.dimension?.code
              ? dimensionIcons[score.dimension.code as BravinDimensionCode]
              : Award;
            const colorHex = score.dimension?.color_hex || '#3B82F6';

            return (
              <div
                key={score.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div
                    className="p-2 rounded-lg mr-3"
                    style={{ backgroundColor: `${colorHex}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: colorHex }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {score.dimension?.name}
                      </span>
                      {score.trend === 'improving' && (
                        <TrendingUp className="w-4 h-4 text-green-600 ml-2" />
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${score.current_score}%`,
                          backgroundColor: colorHex
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-xl font-bold ml-3"
                    style={{ color: colorHex }}
                  >
                    {Math.round(score.current_score)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {scores.length > 3 && (
          <button
            onClick={() => navigate('/simulation/results')}
            className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Full BRAVIN Assessment →
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BravinProfileWidget;
