'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, GitBranch, Clock,
  RefreshCw, Download, BarChart3
} from 'lucide-react';

interface PathStat {
  path_signature: string;
  completion_count: number;
  average_duration_seconds: number;
  success_rate: number;
  difficulty: string;
}

interface AnalyticsSummary {
  totalPaths: number;
  uniqueLearners: number;
  totalJourneys: number;
  avgCompletionTime: number;
}

const PathAnalyticsDashboard: React.FC = () => {
  const [pathStats, setPathStats] = useState<PathStat[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalPaths: 0,
    uniqueLearners: 0,
    totalJourneys: 0,
    avgCompletionTime: 0
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedDifficulty]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDifficulty !== 'all') {
        params.append('difficulty', selectedDifficulty);
      }

      const [pathsRes, summaryRes] = await Promise.all([
        fetch(`/api/analytics/paths?${params}`),
        fetch('/api/analytics/summary')
      ]);

      if (pathsRes.ok) {
        const pathsData = await pathsRes.json();
        setPathStats(pathsData);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Path ID', 'Completions', 'Avg Duration', 'Success Rate', 'Difficulty'],
      ...pathStats.map(p => [
        p.path_signature,
        p.completion_count,
        formatTime(p.average_duration_seconds),
        `${p.success_rate}%`,
        p.difficulty
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `path-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Path Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Insights into learner journeys and branching patterns</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={GitBranch}
          label="Total Paths"
          value={summary.totalPaths}
          color="blue"
        />
        <MetricCard
          icon={Users}
          label="Unique Learners"
          value={summary.uniqueLearners}
          color="green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Total Journeys"
          value={summary.totalJourneys}
          color="purple"
        />
        <MetricCard
          icon={Clock}
          label="Avg Completion"
          value={formatTime(summary.avgCompletionTime)}
          color="amber"
          isString
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detailed Path Statistics</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pathStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No path data available yet
                  </td>
                </tr>
              ) : (
                pathStats.map((path, index) => (
                  <tr key={path.path_signature} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      Path {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {path.completion_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatTime(path.average_duration_seconds)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        path.success_rate >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        path.success_rate >= 40 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {path.success_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        path.difficulty === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        path.difficulty === 'intermediate' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {path.difficulty}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'amber';
  isString?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color, isString }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className={`${isString ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 dark:text-gray-100`}>{value}</p>
    </motion.div>
  );
};

export default PathAnalyticsDashboard;
