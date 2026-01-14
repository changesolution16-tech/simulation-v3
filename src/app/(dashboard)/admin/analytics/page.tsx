'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, BookOpen, Award, Activity } from 'lucide-react';

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalSimulations: number;
  totalCompletions: number;
  avgScore: number;
  popularSimulations: Array<{
    name: string;
    completions: number;
  }>;
  recentActivity: Array<{
    user: string;
    action: string;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [usersRes, simulationsRes, instancesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/simulations'),
        fetch('/api/instances')
      ]);

      const [users, simulations, instances] = await Promise.all([
        usersRes.ok ? usersRes.json() : [],
        simulationsRes.ok ? simulationsRes.json() : [],
        instancesRes.ok ? instancesRes.json() : []
      ]);

      const completedInstances = instances.filter((i: any) => i.status === 'completed');
      const avgScore =
        completedInstances.length > 0
          ? completedInstances.reduce((sum: number, i: any) => sum + (i.final_score || 0), 0) /
            completedInstances.length
          : 0;

      const activeUsers = users.filter((u: any) => u.is_active).length;

      setAnalytics({
        totalUsers: users.length,
        activeUsers,
        totalSimulations: simulations.length,
        totalCompletions: completedInstances.length,
        avgScore: Math.round(avgScore),
        popularSimulations: [],
        recentActivity: []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load analytics
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: analytics.totalUsers,
      change: '+12%',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Active Users',
      value: analytics.activeUsers,
      change: '+8%',
      icon: Activity,
      color: 'green'
    },
    {
      label: 'Simulations',
      value: analytics.totalSimulations,
      change: '+3',
      icon: BookOpen,
      color: 'purple'
    },
    {
      label: 'Completions',
      value: analytics.totalCompletions,
      change: '+24%',
      icon: Award,
      color: 'orange'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform usage and performance metrics
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
            purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
            orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
          }[stat.color];

          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Average Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Average Score
          </h2>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {analytics.avgScore}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Overall Performance</div>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Platform Activity
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  User Engagement
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(analytics.activeUsers / analytics.totalUsers) * 100}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Simulation Usage
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">85%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full w-[85%]" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Completion Rate
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">72%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full w-[72%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Simulations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Popular Simulations
          </h2>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No data available yet
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  );
}
