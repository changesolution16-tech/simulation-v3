'use client';

import { useParams, useSearchParams } from 'next/navigation';
import CompetencyResults from '@/components/simulation/CompetencyResults';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Award } from 'lucide-react';
import Link from 'next/link';

export default function CompetencyResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const simulationId = params.id as string;

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to view your competency results
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
            href={`/simulations/${simulationId}/results`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Leadership Competencies
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your competency development across key leadership skills
              </p>
            </div>
          </div>
        </div>

        <CompetencyResults learnerId={session.user.id} simulationId={simulationId} />
      </div>
    </div>
  );
}
