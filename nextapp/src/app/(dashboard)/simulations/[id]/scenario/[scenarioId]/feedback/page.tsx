'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FeedbackPageProps {}

export default function FeedbackPage({}: FeedbackPageProps) {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const simulationId = params.id as string;
  const scenarioId = params.scenarioId as string;

  const [simulation, setSimulation] = useState<any>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [decisionTimeSeconds, setDecisionTimeSeconds] = useState<number | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !simulationId || !scenarioId) {
      router.push('/dashboard');
      return;
    }

    loadFeedbackData();
  }, [session, simulationId, scenarioId]);

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      // Get simulation data
      const simResponse = await fetch(`/api/simulations/${simulationId}`);
      if (!simResponse.ok) throw new Error('Failed to load simulation');
      const simData = await simResponse.json();
      setSimulation(simData);

      // Get scenario data
      const scenarioResponse = await fetch(`/api/scenarios/${scenarioId}`);
      if (!scenarioResponse.ok) throw new Error('Failed to load scenario');
      const scenarioData = await scenarioResponse.json();
      setScenario(scenarioData);

      // Get instance data to find selected option
      const instanceResponse = await fetch(`/api/instances?simulation_id=${simulationId}&learner_id=${session?.user?.id}&status=in_progress`);
      if (instanceResponse.ok) {
        const instances = await instanceResponse.json();
        if (instances.length > 0) {
          const instance = instances[0];
          setInstanceId(instance.id);

          // Get the learner's response for this scenario
          const responsesResponse = await fetch(`/api/instances/${instance.id}/responses?scenario_id=${scenarioId}`);
          if (responsesResponse.ok) {
            const responses = await responsesResponse.json();
            if (responses.length > 0) {
              const lastResponse = responses[responses.length - 1];
              setDecisionTimeSeconds(lastResponse.time_to_decision_seconds);

              // Find the selected option
              const option = scenarioData.options?.find((opt: any) => opt.id === lastResponse.option_id);
              setSelectedOption(option);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading feedback data:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = () => {
    setVideoWatched(true);
  };

  const handleVideoSkip = () => {
    setVideoWatched(true);
  };

  const handleContinue = async () => {
    if (!simulation || !scenario || !selectedOption) return;

    // Check if there's a transition video
    if (selectedOption.transition_video_url || scenario.transition_video_url) {
      router.push(`/simulations/${simulationId}/scenario/${scenarioId}/transition`);
      return;
    }

    // Check if there's a next scenario
    if (selectedOption.next_scenario_id) {
      router.push(`/simulations/${simulationId}/scenario/${selectedOption.next_scenario_id}/introduction`);
    } else {
      // Simulation is complete
      if (instanceId) {
        // Mark instance as completed
        await fetch(`/api/instances/${instanceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      }

      router.push(`/simulations/${simulationId}/results`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (!simulation || !scenario || !selectedOption) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Feedback not available</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const difficulty = simulation.difficulty || 'beginner';
  const feedbackText = selectedOption.feedback?.[difficulty] || selectedOption.feedback_text || 'No feedback available';
  const hasFeedbackVideo = selectedOption.feedback_video_url;
  const canContinue = !hasFeedbackVideo || videoWatched;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Exit Simulation</span>
            </button>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Stage {scenario.hierarchy_level + 1}</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-green-600 text-white">
                  ✓
                </div>
                <span>Introduction</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-green-600 text-white">
                  ✓
                </div>
                <span>Decision</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-blue-600 text-white">
                  3
                </div>
                <span>Feedback</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Feedback Content */}
            {hasFeedbackVideo ? (
              <div className="mb-6">
                {/* Video Player Component */}
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <video
                    src={selectedOption.feedback_video_url}
                    controls
                    autoPlay
                    onEnded={handleVideoComplete}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={handleVideoSkip}
                  className="mt-4 text-sm text-gray-600 hover:text-blue-600"
                >
                  Skip video
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
                  Feedback
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feedbackText}
                </p>
              </div>
            )}

            {/* Decision Time Display */}
            {decisionTimeSeconds !== null && scenario.show_timer_in_feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Decision Time
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {Math.floor(decisionTimeSeconds / 60)}:{(decisionTimeSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {decisionTimeSeconds < 30
                      ? 'Quick decision - you acted decisively'
                      : decisionTimeSeconds < 90
                      ? 'Moderate pace - balanced consideration'
                      : 'Thoughtful decision - careful deliberation'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Continue Button */}
            {canContinue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  Continue <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
