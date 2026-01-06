'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Role: {user.role}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              My Simulations
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Continue your learning journey
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-blue-600">0</span>
              <span className="text-sm text-gray-500 ml-2">in progress</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Competencies
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your skill development
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-green-600">0</span>
              <span className="text-sm text-gray-500 ml-2">mastered</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Assignments
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your tasks
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-orange-600">0</span>
              <span className="text-sm text-gray-500 ml-2">pending</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Component Migration in Progress
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            This dashboard is a placeholder. Full dashboard functionality will be available once component migration is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
