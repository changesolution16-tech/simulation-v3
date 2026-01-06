'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function SimulationPlayerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const simulationId = params.id;
  const assignmentId = searchParams?.get('assignmentId');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (!simulationId) {
      router.push('/dashboard');
      return;
    }

    startSimulation();
  }, [session, status, simulationId]);

  const startSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch simulation details
      const simResponse = await fetch(`/api/simulations/${simulationId}`);

      if (!simResponse.ok) {
        throw new Error('Failed to load simulation');
      }

      const simulation = await simResponse.json();

      // Create a new simulation instance
      const instanceResponse = await fetch(`/api/simulations/${simulationId}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: simulation.difficulty || 'beginner',
          assignment_id: assignmentId,
        }),
      });

      if (!instanceResponse.ok) {
        throw new Error('Failed to start simulation');
      }

      const instance = await instanceResponse.json();

      // Store instance ID in sessionStorage for use during simulation
      sessionStorage.setItem('currentInstanceId', instance.id);
      sessionStorage.setItem('currentSimulationId', simulationId);

      // Navigate to appropriate page
      if (simulation.introduction_page_enabled) {
        router.push(`/simulations/${simulationId}/intro?instanceId=${instance.id}`);
      } else if (simulation.scenarios && simulation.scenarios.length > 0) {
        // Find entry point scenario
        const entryScenario = simulation.scenarios.find((s: any) => s.is_entry_point);
        const scenarioToShow = entryScenario || simulation.scenarios[0];

        if (scenarioToShow.scenarios.introductionVideoUrl || scenarioToShow.scenarios.introduction_video_url) {
          router.push(`/simulations/${simulationId}/scenario/${scenarioToShow.scenario_id}/introduction?instanceId=${instance.id}`);
        } else {
          router.push(`/simulations/${simulationId}/scenario/${scenarioToShow.scenario_id}/question?instanceId=${instance.id}`);
        }
      } else {
        throw new Error('This simulation has no scenarios configured');
      }
    } catch (err: any) {
      console.error('Error starting simulation:', err);
      setError(err.message || 'Failed to start simulation');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Start Simulation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Starting simulation...
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Please wait while we prepare your experience
        </p>
      </div>
    </div>
  );
}
