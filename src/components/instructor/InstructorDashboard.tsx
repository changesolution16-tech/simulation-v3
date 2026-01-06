'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  Download,
  Search
} from 'lucide-react';

interface LearnerProgress {
  id: string;
  full_name: string;
  email: string;
  status: string;
  total_scenarios_completed: number;
  final_score: number | null;
  time_spent_seconds: number;
  completed_at: string | null;
  started_at: string;
}

interface InstructorDashboardProps {
  cohortId?: string;
  simulationId?: string;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  cohortId,
  simulationId
}) => {
  const [learners, setLearners] = useState<LearnerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, [cohortId, simulationId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cohortId) params.append('cohortId', cohortId);
      if (simulationId) params.append('simulationId', simulationId);

      const response = await fetch(`/api/instructor/progress?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLearners(data.learners || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLearners = learners.filter(learner => {
    const matchesSearch =
      learner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || learner.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const calculateStats = () => {
    const completed = learners.filter(l => l.status === 'completed').length;
    const inProgress = learners.filter(l => l.status === 'in_progress').length;
    const avgScore = learners
      .filter(l => l.final_score !== null)
      .reduce((sum, l) => sum + (l.final_score || 0), 0) / (completed || 1);
    const avgTime = learners
      .filter(l => l.time_spent_seconds > 0)
      .reduce((sum, l) => sum + l.time_spent_seconds, 0) / (learners.length || 1);

    return {
      totalLearners: learners.length,
      completed,
      inProgress,
      avgScore: avgScore.toFixed(1),
      avgTimeMinutes: Math.round(avgTime / 60),
      completionRate: ((completed / (learners.length || 1)) * 100).toFixed(1)
    };
  };

  const stats = calculateStats();

  const exportToCsv = () => {
    const headers = ['Name', 'Email', 'Status', 'Scenarios Completed', 'Final Score', 'Time Spent (min)', 'Started', 'Completed'];
    const rows = filteredLearners.map(l => [
      l.full_name,
      l.email,
      l.status,
      l.total_scenarios_completed,
      l.final_score || 'N/A',
      Math.round(l.time_spent_seconds / 60),
      new Date(l.started_at).toLocaleDateString(),
      l.completed_at ? new Date(l.completed_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learner-progress-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Instructor Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor learner progress and performance across your course
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Learners"
          value={stats.totalLearners}
          color="blue"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Completed"
          value={stats.completed}
          subtitle={`${stats.completionRate}% completion rate`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Average Score"
          value={`${stats.avgScore}%`}
          color="amber"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Avg. Time"
          value={`${stats.avgTimeMinutes} min`}
          color="orange"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Learner Progress
            </h2>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search learners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="abandoned">Abandoned</option>
              </select>

              <button
                onClick={exportToCsv}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Learner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scenarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Started
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLearners.map((learner) => (
                <tr key={learner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{learner.full_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{learner.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={learner.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {learner.total_scenarios_completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {learner.final_score !== null ? `${learner.final_score}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {Math.round(learner.time_spent_seconds / 60)} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(learner.started_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLearners.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No learners found matching your criteria.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'amber' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'abandoned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  );
};

export default InstructorDashboard;
