'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit3, BarChart3, Settings, CheckCircle } from 'lucide-react';
import SimulationBuilder from '@/components/admin/SimulationBuilder';

export default function EditSimulationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showBuilder, setShowBuilder] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    const loadSimulation = async () => {
      setLoadingName(true);
      try {
        const response = await fetch(`/api/simulations/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setSimulationName(data.display_name || data.name || 'Simulation');
        } else {
          setSimulationName('Simulation');
        }
      } catch (error) {
        console.error('Error loading simulation:', error);
        setSimulationName('Simulation');
      } finally {
        setLoadingName(false);
      }
    };

    loadSimulation();
  }, [params.id]);

  const handleSuccess = (simulationId: string) => {
    setShowBuilder(false);
    if (simulationId && simulationId !== params.id) {
      router.push(`/admin/simulations/${simulationId}/edit`);
      return;
    }
    router.refresh();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/admin/simulations" className="hover:text-blue-600">
              Simulations
            </Link>
            <span>/</span>
            <span>{loadingName ? 'Loading...' : simulationName || 'Simulation'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Simulation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Use the 7-step builder to update all simulation content and flow
              </p>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              Edit Simulation
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <Edit3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              7-Step Builder
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Edit every part of the simulation from landing pages through closing feedback in one guided flow
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Performance Tiers
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update closing videos and performance thresholds for excellent, good, and developing outcomes
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Full Customization
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Adjust objectives, role descriptions, images, videos, metrics, and recommendations
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What You Can Update
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Basic simulation information and category
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Landing page with objectives and intro video
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Introduction page with journey overview
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Scenario flow and branching logic
              </li>
            </ul>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Assessment metrics and competencies
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Performance-based closing videos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Learning analysis and recommendations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Custom images, videos, and descriptions
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Simulation Builder Modal */}
      {showBuilder && (
        <SimulationBuilder
          simulationId={params.id}
          onClose={() => setShowBuilder(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
