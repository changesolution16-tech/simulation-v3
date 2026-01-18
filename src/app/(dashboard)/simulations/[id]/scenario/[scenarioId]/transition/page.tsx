'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TransitionPage from '@/components/simulation/TransitionPage';
import { Loader2 } from 'lucide-react';

export default function SimulationTransitionPage({
  params,
}: {
  params: { id: string; scenarioId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [scenario, setScenario] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const simulationId = params.id;
  const scenarioId = params.scenarioId;
  const instanceId = searchParams?.get('instanceId') || sessionStorage.getItem('currentInstanceId');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    loadData();
  }, [session, simulationId, scenarioId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load scenario
      const scenarioResponse = await fetch(`/api/scenarios/${scenarioId}`);
      if (!scenarioResponse.ok) throw new Error('Failed to load scenario');

      const scenarioData = await scenarioResponse.json();
      setScenario(scenarioData);

      // Get the learner's response to find selected option
      if (instanceId) {
        const responsesResponse = await fetch(
          `/api/instances/${instanceId}/responses?scenario_id=${scenarioId}`
        );
        if (responsesResponse.ok) {
          const responses = await responsesResponse.json();
          if (responses.length > 0) {
            const lastResponse = responses[responses.length - 1];
            const option = scenarioData.options?.find(
              (opt: any) => opt.id === lastResponse.option_id
            );
            setSelectedOption(option);
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load transition data');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedOption) {
      router.push(`/simulations/${simulationId}/results`);
      return;
    }

    // Check if there's a next scenario
    if (selectedOption.next_scenario_id) {
      router.push(
        `/simulations/${simulationId}/scenario/${selectedOption.next_scenario_id}/introduction?instanceId=${instanceId}`
      );
    } else {
      // Simulation is complete
      router.push(`/simulations/${simulationId}/results?instanceId=${instanceId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading transition...</p>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Transition
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Transition not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const transitionVideoUrl =
    selectedOption?.transition_video_url || scenario.transition_video_url;
  const isLastScenario = !selectedOption?.next_scenario_id;

  return (
    <TransitionPage
      videoUrl={transitionVideoUrl}
      message={
        isLastScenario
          ? 'You have completed all scenarios in this simulation'
          : 'Preparing the next scenario...'
      }
      isLastScenario={isLastScenario}
      onContinue={handleContinue}
    />
  );
}
