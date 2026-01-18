'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Copy, Play } from 'lucide-react';
import Link from 'next/link';

interface Simulation {
  id: string;
  display_name: string;
  description?: string;
  difficulty: string;
  category_id?: string;
  category?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadSimulations();
    loadCategories();
  }, []);

  useEffect(() => {
    filterSimulations();
  }, [simulations, searchTerm, difficultyFilter, statusFilter, categoryFilter]);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulations');
      if (response.ok) {
        const data = await response.json();
        setSimulations(data);
      }
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterSimulations = () => {
    let filtered = simulations;

    if (searchTerm) {
      filtered = filtered.filter(
        (sim) =>
          sim.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sim.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((sim) => sim.difficulty === difficultyFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((sim) => sim.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((sim) => sim.category_id === categoryFilter);
    }

    setFilteredSimulations(filtered);
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category;
  };

  const handleDeleteSimulation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this simulation?')) return;

    try {
      const response = await fetch(`/api/simulations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadSimulations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete simulation');
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
      alert('Failed to delete simulation');
    }
  };

  const handleDuplicateSimulation = async (id: string) => {
    try {
      const response = await fetch(`/api/simulations/${id}/duplicate`, {
        method: 'POST'
      });

      if (response.ok) {
        loadSimulations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to duplicate simulation');
      }
    } catch (error) {
      console.error('Error duplicating simulation:', error);
      alert('Failed to duplicate simulation');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      advanced: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      published: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      archived: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Simulations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage training simulations
          </p>
        </div>
        <Link
          href="/admin/simulations/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Simulation
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search simulations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSimulations.map((simulation) => (
          <div
            key={simulation.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {simulation.display_name}
                  </h3>
                  {simulation.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {simulation.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(simulation.difficulty)}`}>
                  {simulation.difficulty}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(simulation.status)}`}>
                  {simulation.status}
                </span>
                {(() => {
                  const category = getCategoryName(simulation.category_id);
                  return category && (
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color
                      }}
                    >
                      {category.name}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/simulations/${simulation.id}/play`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </Link>
                <Link
                  href={`/admin/simulations/${simulation.id}/edit`}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDuplicateSimulation(simulation.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSimulation(simulation.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Updated {new Date(simulation.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSimulations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No simulations found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by creating your first simulation
          </p>
          <Link
            href="/admin/simulations/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Simulation
          </Link>
        </div>
      )}
    </div>
  );
}
