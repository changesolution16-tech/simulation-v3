import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, GitBranch, Clock, Award,
  Filter, Download, RefreshCw, BarChart3, PieChart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PathStat {
  path_signature: string;
  path_nodes: string[];
  completion_count: number;
  average_duration_seconds: number;
  average_skill_gain: Record<string, number>;
  success_rate: number;
  difficulty: string;
}

interface ScenarioUsage {
  scenario_id: string;
  scenario_title: string;
  times_visited: number;
  average_decision_time: number;
  options_distribution: Record<string, number>;
}

const PathAnalyticsDashboard: React.FC = () => {
  const [pathStats, setPathStats] = useState<PathStat[]>([]);
  const [scenarioUsage, setScenarioUsage] = useState<ScenarioUsage[]>([]);
  const [totalJourneys, setTotalJourneys] = useState(0);
  const [uniqueLearners, setUniqueLearners] = useState(0);
  const [avgCompletionTime, setAvgCompletionTime] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedDifficulty]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('path_analytics')
        .select('*')
        .order('completion_count', { ascending: false });

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty);
      }

      const { data: paths } = await query;
      if (paths) setPathStats(paths);

      const { data: journeyCount } = await supabase
        .from('learner_journeys')
        .select('id', { count: 'exact', head: true });

      if (journeyCount) setTotalJourneys(journeyCount.length || 0);

      const { data: learnerData } = await supabase
        .from('learner_journeys')
        .select('user_id');

      if (learnerData) {
        const uniqueUsers = new Set(learnerData.map(j => j.user_id));
        setUniqueLearners(uniqueUsers.size);
      }

      const { data: instanceData } = await supabase
        .from('simulation_instances')
        .select('started_at, completed_at')
        .not('completed_at', 'is', null);

      if (instanceData) {
        const times = instanceData.map(inst => {
          const start = new Date(inst.started_at).getTime();
          const end = new Date(inst.completed_at).getTime();
          return (end - start) / 1000;
        });
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length || 0;
        setAvgCompletionTime(Math.round(avg));
      }

      await loadScenarioUsage();
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioUsage = async () => {
    const { data: journeys } = await supabase
      .from('learner_journeys')
      .select('scenario_id, option_id, decision_time_seconds');

    if (journeys) {
      const usageMap: Record<string, any> = {};

      journeys.forEach((j: any) => {
        if (!usageMap[j.scenario_id]) {
          usageMap[j.scenario_id] = {
            times_visited: 0,
            total_time: 0,
            options: {}
          };
        }
        usageMap[j.scenario_id].times_visited++;
        usageMap[j.scenario_id].total_time += j.decision_time_seconds || 0;
        usageMap[j.scenario_id].options[j.option_id] =
          (usageMap[j.scenario_id].options[j.option_id] || 0) + 1;
      });

      const scenarioIds = Object.keys(usageMap);
      const { data: scenarios } = await supabase
        .from('scenarios')
        .select('id, title')
        .in('id', scenarioIds);

      const usage: ScenarioUsage[] = scenarioIds.map(id => {
        const scenarioData = usageMap[id];
        const scenario = scenarios?.find(s => s.id === id);
        return {
          scenario_id: id,
          scenario_title: scenario?.title || 'Unknown',
          times_visited: scenarioData.times_visited,
          average_decision_time: Math.round(scenarioData.total_time / scenarioData.times_visited),
          options_distribution: scenarioData.options
        };
      }).sort((a, b) => b.times_visited - a.times_visited);

      setScenarioUsage(usage.slice(0, 10));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Path', 'Completions', 'Avg Duration', 'Success Rate', 'Difficulty'],
      ...pathStats.map(p => [
        p.path_nodes.join(' → '),
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

  const topPathsData = {
    labels: pathStats.slice(0, 5).map((p, i) => `Path ${i + 1}`),
    datasets: [{
      label: 'Completions',
      data: pathStats.slice(0, 5).map(p => p.completion_count),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }]
  };

  const difficultyDistribution = {
    labels: ['Beginner', 'Intermediate', 'Advanced'],
    datasets: [{
      data: [
        pathStats.filter(p => p.difficulty === 'beginner').reduce((sum, p) => sum + p.completion_count, 0),
        pathStats.filter(p => p.difficulty === 'intermediate').reduce((sum, p) => sum + p.completion_count, 0),
        pathStats.filter(p => p.difficulty === 'advanced').reduce((sum, p) => sum + p.completion_count, 0)
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.5)',
        'rgba(251, 191, 36, 0.5)',
        'rgba(239, 68, 68, 0.5)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 1
    }]
  };

  const scenarioVisitsData = {
    labels: scenarioUsage.map(s => s.scenario_title.substring(0, 20)),
    datasets: [{
      label: 'Visits',
      data: scenarioUsage.map(s => s.times_visited),
      backgroundColor: 'rgba(168, 85, 247, 0.5)',
      borderColor: 'rgb(168, 85, 247)',
      borderWidth: 1
    }]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Path Analytics</h1>
          <p className="text-gray-600 mt-1">Insights into learner journeys and branching patterns</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={GitBranch}
          label="Total Paths"
          value={pathStats.length}
          color="blue"
        />
        <MetricCard
          icon={Users}
          label="Unique Learners"
          value={uniqueLearners}
          color="green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Total Journeys"
          value={totalJourneys}
          color="purple"
        />
        <MetricCard
          icon={Clock}
          label="Avg Completion"
          value={formatTime(avgCompletionTime)}
          color="amber"
          isString
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Top 5 Paths by Completion</h3>
          </div>
          <Bar
            data={topPathsData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Difficulty Distribution</h3>
          </div>
          <Doughnut
            data={difficultyDistribution}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </motion.div>
      </div>

      {/* Scenario Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      >
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold">Most Visited Scenarios</h3>
        </div>
        <Bar
          data={scenarioVisitsData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }}
        />
      </motion.div>

      {/* Path Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
      >
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Detailed Path Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pathStats.map((path, index) => (
                <tr key={path.path_signature} className="hover:bg-gray-50">
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
                      path.success_rate >= 70 ? 'bg-green-100 text-green-800' :
                      path.success_rate >= 40 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {path.success_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      path.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      path.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {path.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600'
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
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`${isString ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 dark:text-gray-100`}>{value}</p>
    </motion.div>
  );
};

export default PathAnalyticsDashboard;
