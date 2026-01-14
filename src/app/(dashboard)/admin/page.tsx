'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Users, BookOpen, Award, ClipboardList } from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    users: 0,
    simulations: 0,
    competencies: 0,
    assignments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usersRes, simulationsRes, competenciesRes, assignmentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/simulations'),
        fetch('/api/competencies'),
        fetch('/api/assignments')
      ]);

      const [users, simulations, competencies, assignments] = await Promise.all([
        usersRes.ok ? usersRes.json() : [],
        simulationsRes.ok ? simulationsRes.json() : [],
        competenciesRes.ok ? competenciesRes.json() : [],
        assignmentsRes.ok ? assignmentsRes.json() : []
      ]);

      setStats({
        users: users.length || 0,
        simulations: simulations.length || 0,
        competencies: competencies.length || 0,
        assignments: assignments.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'blue',
      href: '/admin/users'
    },
    {
      label: 'Simulations',
      value: stats.simulations,
      icon: BookOpen,
      color: 'green',
      href: '/admin/simulations'
    },
    {
      label: 'Competencies',
      value: stats.competencies,
      icon: Award,
      color: 'purple',
      href: '/admin/competencies'
    },
    {
      label: 'Active Assignments',
      value: stats.assignments,
      icon: ClipboardList,
      color: 'orange',
      href: '/admin/assignments'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your platform and monitor key metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
            purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
            orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
          }[stat.color];

          return (
            <a
              key={stat.label}
              href={stat.href}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </a>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Create User
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add a new user to the platform
            </p>
          </a>

          <a
            href="/admin/simulations"
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Create Simulation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Build a new training simulation
            </p>
          </a>

          <a
            href="/admin/assignments"
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Create Assignment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assign simulations to cohorts
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
