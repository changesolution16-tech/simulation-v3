'use client';

import { useParams, useSearchParams } from 'next/navigation';
import LearnerPathVisualization from '@/components/simulation/LearnerPathVisualization';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Map } from 'lucide-react';
import Link from 'next/link';

export default function LearningPathPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const simulationId = params.id as string;

  const instanceId = searchParams.get('instanceId');

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to view your learning path
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/simulations/${simulationId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Simulation
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Map className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Learning Journey
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize the path you took through this simulation
              </p>
            </div>
          </div>
        </div>

        <LearnerPathVisualization instanceId={instanceId || undefined} />
      </div>
    </div>
  );
}
