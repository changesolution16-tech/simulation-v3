'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Map,
  Award,
  CheckCircle,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SimulationResultsPage() {
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
            Please log in to view your simulation results
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

  const resultSections = [
    {
      title: 'BRAVIN Leadership Assessment',
      description: 'View your leadership dimensions analysis across Boldness, Responsibility, Accountability, Vision, Integrity, and Nurturance',
      icon: Award,
      color: 'blue',
      href: `/simulations/${simulationId}/results/bravin${instanceId ? `?instanceId=${instanceId}` : ''}`,
      available: true
    },
    {
      title: 'Learning Path Visualization',
      description: 'See the journey you took through the simulation and track your decision-making path',
      icon: Map,
      color: 'green',
      href: `/simulations/${simulationId}/results/learning-path${instanceId ? `?instanceId=${instanceId}` : ''}`,
      available: true
    },
    {
      title: 'Alignment Meeting Results',
      description: 'Review detailed scoring and feedback from your alignment meeting decisions',
      icon: BarChart3,
      color: 'purple',
      href: `/simulations/${simulationId}/results/alignment`,
      available: false,
      note: 'Available after completing an alignment meeting scenario'
    },
    {
      title: 'Competency Progress',
      description: 'Track your competency development across different skill areas',
      icon: TrendingUp,
      color: 'orange',
      href: `/dashboard`,
      available: true
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:border-blue-300 dark:hover:border-blue-700'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      hover: 'hover:border-green-300 dark:hover:border-green-700'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      hover: 'hover:border-purple-300 dark:hover:border-purple-700'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      hover: 'hover:border-orange-300 dark:hover:border-orange-700'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/simulations/${simulationId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Simulation
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Simulation Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review your performance and insights from the simulation
              </p>
            </div>
          </div>

          {instanceId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Viewing Instance Results
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  These results are for simulation instance: {instanceId.slice(0, 8)}...
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resultSections.map((section, index) => {
            const Icon = section.icon;
            const colors = colorClasses[section.color as keyof typeof colorClasses];

            if (!section.available) {
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${colors.border} p-6 opacity-60`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${colors.bg} rounded-lg flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {section.description}
                      </p>
                      {section.note && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                          {section.note}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={section.href}
                  className={`block bg-white dark:bg-gray-800 rounded-xl border-2 ${colors.border} ${colors.hover} p-6 transition-all hover:shadow-lg group`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${colors.bg} rounded-lg flex-shrink-0 transition-transform group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {section.description}
                      </p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-100 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Want to improve your results?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Try the simulation again with different approaches to strengthen your competencies and leadership skills.
          </p>
          <Link
            href={`/simulations/${simulationId}/start`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retake Simulation
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
