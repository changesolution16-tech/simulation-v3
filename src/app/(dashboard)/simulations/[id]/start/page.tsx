'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSimulationStore } from '@/stores/simulationStore';

export default function StartSimulationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { setActiveSession } = useSimulationStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const simulationId = params.id;
  const assignmentId = searchParams.get('assignmentId');
  const difficulty = searchParams.get('difficulty') || 'beginner';

  useEffect(() => {
    if (session?.user?.id && simulationId) {
      startSimulation();
    } else if (!session) {
      router.push('/login');
    }
  }, [session, simulationId]);

  const startSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch simulation details
      const simResponse = await fetch(`/api/simulations/${simulationId}`);
      if (!simResponse.ok) {
        throw new Error('Simulation not found');
      }
      const simulation = await simResponse.json();

      // Check if simulation is published
      if (simulation.status !== 'published' && session?.user?.role === 'learner') {
        throw new Error('This simulation is not available');
      }

      // Create simulation instance
      const instanceResponse = await fetch(`/api/simulations/${simulationId}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty,
          assignment_id: assignmentId,
        }),
      });

      if (!instanceResponse.ok) {
        const errorData = await instanceResponse.json();
        throw new Error(errorData.error || 'Failed to create simulation instance');
      }

      const instance = await instanceResponse.json();

      // Set active session in store
      setActiveSession({
        simulationId,
        instanceId: instance.id,
        currentScenarioIndex: 0,
        difficulty,
        assignmentId: assignmentId || undefined,
      });

      // Fetch scenarios to find entry point
      const scenariosResponse = await fetch(`/api/simulations/${simulationId}/scenarios`);
      if (!scenariosResponse.ok) {
        throw new Error('Failed to load scenarios');
      }
      const scenarios = await scenariosResponse.json();

      if (!scenarios || scenarios.length === 0) {
        throw new Error('This simulation has no scenarios configured');
      }

      // Find entry scenario or use first one
      const entryScenario = scenarios.find((s: any) => s.is_entry_point) || scenarios[0];

      // Navigate to simulation intro or first scenario
      if (simulation.introduction_page_enabled) {
        router.push(`/simulations/${simulationId}/intro`);
      } else {
        router.push(`/simulations/${simulationId}/scenario/${entryScenario.id}/introduction`);
      }
    } catch (err) {
      console.error('Error starting simulation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
      setLoading(false);
    }
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Starting simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4 text-red-600 dark:text-red-400">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Start Simulation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
