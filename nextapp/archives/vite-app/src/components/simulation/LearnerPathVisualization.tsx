import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSimulationStore } from '../../store';

interface JourneyStep {
  id: string;
  scenario_id: string;
  scenario_title: string;
  option_id: string;
  option_text: string;
  sequence_number: number;
  skill_impacts: Record<string, number>;
  cumulative_skills: Record<string, number>;
  decision_time_seconds: number;
  timestamp: string;
}

const LearnerPathVisualization: React.FC = () => {
  const { currentUser } = useSimulationStore();
  const [journey, setJourney] = useState<JourneyStep[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [skillGains, setSkillGains] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadJourneyData();
    }
  }, [currentUser]);

  const loadJourneyData = async () => {
    if (!currentUser) return;

    try {
      const { data: instanceData } = await supabase
        .from('simulation_instances')
        .select('id')
        .eq('learner_id', currentUser.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (instanceData) {
        const { data: journeyData } = await supabase
          .from('learner_journeys')
          .select('*')
          .eq('simulation_instance_id', instanceData.id)
          .order('sequence_number', { ascending: true });

        if (journeyData) {
          const enrichedJourney = await Promise.all(
            journeyData.map(async (step: any) => {
              const { data: scenario } = await supabase
                .from('scenarios')
                .select('title, options')
                .eq('id', step.scenario_id)
                .maybeSingle();

              const option = scenario?.options?.find((o: any) => o.id === step.option_id);

              return {
                ...step,
                scenario_title: scenario?.title || 'Unknown Scenario',
                option_text: option?.text || 'Unknown Option'
              };
            })
          );

          setJourney(enrichedJourney);

          const totalSeconds = enrichedJourney.reduce(
            (sum, step) => sum + (step.decision_time_seconds || 0),
            0
          );
          setTotalTime(totalSeconds);

          const lastStep = enrichedJourney[enrichedJourney.length - 1];
          if (lastStep?.cumulative_skills) {
            setSkillGains(lastStep.cumulative_skills);
          }
        }
      }
    } catch (error) {
      console.error('Error loading journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillColor = (value: number) => {
    if (value >= 50) return 'text-green-600 bg-green-100';
    if (value >= 25) return 'text-blue-600 bg-blue-100';
    if (value >= 0) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (journey.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700 p-8 text-center">
        <div className="max-w-md mx-auto">
          <TrendingUp className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            No Journey Yet
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
            Start a simulation to track your learning progress and see how your decisions shape your leadership development journey.
          </p>
          <div className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
            <Target className="w-4 h-4 mr-2" />
            Complete your first simulation to begin
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Steps Completed</p>
              <p className="text-3xl font-bold text-blue-600">{journey.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Time</p>
              <p className="text-3xl font-bold text-green-600">{formatTime(totalTime)}</p>
            </div>
            <Clock className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Skills Developed</p>
              <p className="text-3xl font-bold text-purple-600">
                {Object.keys(skillGains).length}
              </p>
            </div>
            <Award className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </motion.div>
      </div>

      {/* Skill Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      >
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Skill Development</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(skillGains).map(([skill, value]) => (
            <div key={skill} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {skill.replace(/_/g, ' ')}
                </span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${getSkillColor(value)}`}>
                  +{value}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Journey Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      >
        <div className="flex items-center mb-6">
          <Target className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Your Learning Journey</h3>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Journey Steps */}
          <div className="space-y-6">
            {journey.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="relative flex gap-4"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                  {step.sequence_number}
                </div>

                {/* Step Content */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{step.scenario_title}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Your choice:</span> {step.option_text}
                  </p>

                  {/* Skill Impacts */}
                  {step.skill_impacts && Object.keys(step.skill_impacts).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Object.entries(step.skill_impacts).map(([skill, impact]) => (
                        <span
                          key={skill}
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            impact > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {skill.replace(/_/g, ' ')}: {impact > 0 ? '+' : ''}{impact}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Decision Time */}
                  {step.decision_time_seconds > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Decision time: {formatTime(step.decision_time_seconds)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Path Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white"
      >
        <h3 className="text-xl font-bold mb-4">Journey Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Average Decision Time</p>
            <p className="text-2xl font-bold">
              {formatTime(Math.round(totalTime / journey.length))}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Strongest Skill</p>
            <p className="text-2xl font-bold capitalize">
              {Object.entries(skillGains).reduce((a, b) => (a[1] > b[1] ? a : b), ['', 0])[0].replace(/_/g, ' ') || 'N/A'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LearnerPathVisualization;
