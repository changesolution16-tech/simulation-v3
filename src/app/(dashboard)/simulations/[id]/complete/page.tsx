'use client';

import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  Star,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Eye,
  Sparkles
} from 'lucide-react';

interface CompetencyHighlight {
  name: string;
  score: number;
  improvement: number;
}

interface SimulationStats {
  final_score: number;
  completion_time: number;
  decisions_made: number;
  scenarios_completed: number;
}

type PerformanceTier = 'excellent' | 'good' | 'developing';

export default function SimulationCompletePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const simulationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('good');
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [topCompetencies, setTopCompetencies] = useState<CompetencyHighlight[]>([]);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    loadCompletionData();
  }, [session, simulationId]);

  useEffect(() => {
    // Trigger score animation after component mounts
    const timer = setTimeout(() => {
      setShowScoreAnimation(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const loadCompletionData = async () => {
    setLoading(true);
    try {
      // Load completion statistics
      const response = await fetch(`/api/simulations/${simulationId}/completion`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setTopCompetencies(data.top_competencies || []);
        setPerformanceTier(calculateTier(data.stats.final_score));
      }
    } catch (error) {
      console.error('Error loading completion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTier = (score: number): PerformanceTier => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    return 'developing';
  };

  const getTierConfig = (tier: PerformanceTier) => {
    switch (tier) {
      case 'excellent':
        return {
          icon: Trophy,
          title: 'Outstanding Performance!',
          subtitle: 'You demonstrated exceptional decision-making skills',
          color: 'from-yellow-400 to-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          badge: '🏆 Gold'
        };
      case 'good':
        return {
          icon: Award,
          title: 'Great Performance!',
          subtitle: 'You showed strong competency development',
          color: 'from-blue-400 to-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-300 dark:border-blue-700',
          textColor: 'text-blue-700 dark:text-blue-300',
          badge: '🥈 Silver'
        };
      default:
        return {
          icon: Star,
          title: 'Good Start!',
          subtitle: "You're on your way to mastering these skills",
          color: 'from-orange-400 to-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-300 dark:border-orange-700',
          textColor: 'text-orange-700 dark:text-orange-300',
          badge: '🥉 Bronze'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Preparing your results...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.id || !stats) {
    return null;
  }

  const tierConfig = getTierConfig(performanceTier);
  const TierIcon = tierConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${tierConfig.color} shadow-2xl mb-6`}>
            <TierIcon className="w-14 h-14 text-white" />
          </div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold text-gray-900 dark:text-white mb-3"
          >
            {tierConfig.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 dark:text-gray-300"
          >
            {tierConfig.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`inline-block mt-4 px-6 py-2 ${tierConfig.bgColor} border-2 ${tierConfig.borderColor} rounded-full`}
          >
            <span className={`text-lg font-bold ${tierConfig.textColor}`}>
              {tierConfig.badge}
            </span>
          </motion.div>
        </motion.div>

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Final Score
            </h2>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: showScoreAnimation ? 1 : 0 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
              className="relative inline-block"
            >
              <div className={`text-8xl font-bold bg-gradient-to-br ${tierConfig.color} bg-clip-text text-transparent`}>
                {Math.round(stats.final_score)}
              </div>
              <div className="text-3xl text-gray-500 dark:text-gray-400 mt-2">
                out of 100
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.completion_time / 60)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
            </div>
            <div className="text-center">
              <Target className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.scenarios_completed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Scenarios</div>
            </div>
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.decisions_made}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Decisions</div>
            </div>
          </div>
        </motion.div>

        {/* Top Competencies */}
        {topCompetencies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-7 h-7 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Top Skills Developed
              </h2>
            </div>

            <div className="space-y-4">
              {topCompetencies.slice(0, 3).map((competency, index) => (
                <motion.div
                  key={competency.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + (index * 0.1) }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                    }`}>
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {competency.name}
                      </div>
                      {competency.improvement > 0 && (
                        <div className="text-sm text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +{competency.improvement.toFixed(1)}% improvement
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(competency.score)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Link
            href={`/simulations/${simulationId}/results`}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
          >
            <Eye className="w-5 h-5" />
            View Detailed Results
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href={`/simulations/${simulationId}/start`}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Simulation
          </Link>
        </motion.div>

        {/* Encouragement Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className={`mt-8 p-6 ${tierConfig.bgColor} border ${tierConfig.borderColor} rounded-xl`}
        >
          <h3 className={`font-bold ${tierConfig.textColor} mb-2`}>
            Keep Growing!
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {performanceTier === 'excellent' &&
              "You have demonstrated mastery of these skills. Consider challenging yourself with more advanced scenarios or helping others develop their competencies."}
            {performanceTier === 'good' &&
              "You are doing great! Review the detailed feedback to identify specific areas where you can refine your approach and reach the next level."}
            {performanceTier === 'developing' &&
              "Every expert was once a beginner. Use the learning recommendations and retake the simulation to strengthen your skills. Progress comes with practice!"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
