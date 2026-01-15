'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import SimulationIntroduction from '@/components/simulation/SimulationIntroduction';

interface Simulation {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  introduction_video_url?: string;
  scenarios?: Array<{
    scenario_id: string;
    is_entry_point: boolean;
    scenarios: {
      introduction_video_url?: string;
      introductionVideoUrl?: string;
    };
  }>;
}

export default function SimulationIntroPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const simulationId = params.id;
  const instanceId = searchParams?.get('instanceId');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (!simulationId || !instanceId) {
      router.push('/dashboard');
      return;
    }

    loadSimulation();
  }, [session, status, simulationId, instanceId]);

  const loadSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/simulations/${simulationId}`);

      if (!response.ok) {
        throw new Error('Failed to load simulation');
      }

      const data = await response.json();
      setSimulation(data);
    } catch (err: any) {
      console.error('Error loading simulation:', err);
      setError(err.message || 'Failed to load simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!simulation || !instanceId) return;

    // Find the first scenario to navigate to
    if (simulation.scenarios && simulation.scenarios.length > 0) {
      const entryScenario = simulation.scenarios.find((s) => s.is_entry_point);
      const scenarioToShow = entryScenario || simulation.scenarios[0];

      // Check if the scenario has an introduction video
      if (
        scenarioToShow.scenarios.introduction_video_url ||
        scenarioToShow.scenarios.introductionVideoUrl
      ) {
        router.push(
          `/simulations/${simulationId}/scenario/${scenarioToShow.scenario_id}/introduction?instanceId=${instanceId}`
        );
      } else {
        router.push(
          `/simulations/${simulationId}/scenario/${scenarioToShow.scenario_id}/question?instanceId=${instanceId}`
        );
      }
    } else {
      setError('This simulation has no scenarios configured');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Simulation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Simulation not found'}</p>
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

  return (
    <SimulationIntroduction
      title={simulation.name}
      displayName={simulation.display_name}
      description={simulation.description}
      videoUrl={simulation.introduction_video_url}
      onContinue={handleContinue}
    />
  );
}
