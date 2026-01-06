'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Play, Edit2, Copy, Trash2, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

interface Simulation {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  difficulty: string;
  estimated_duration_minutes: number;
  created_by?: string;
}

interface SimulationListViewProps {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
  onCreateNew: () => void;
  onEdit: (simulationId: string) => void;
  onPreview: (e: React.MouseEvent, simulationId: string) => void;
}

const SimulationListView: React.FC<SimulationListViewProps> = ({
  categoryId,
  categoryName,
  onBack,
  onCreateNew,
  onEdit,
  onPreview
}) => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  useEffect(() => {
    loadSimulations();
  }, [categoryId]);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/simulations?categoryId=${categoryId}`);
      if (!response.ok) throw new Error('Failed to load simulations');

      const data = await response.json();
      setSimulations(data);
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (simulation: Simulation) => {
    try {
      const response = await fetch(`/api/simulations/${simulation.id}/duplicate`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to duplicate');

      loadSimulations();
    } catch (error) {
      console.error('Error duplicating simulation:', error);
    }
  };

  const handleDelete = async (simulationId: string) => {
    if (!confirm('Are you sure you want to delete this simulation? This will also delete any assignments using it. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/simulations/${simulationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      loadSimulations();
      alert('Simulation deleted successfully');
    } catch (error: any) {
      console.error('Error deleting simulation:', error);
      alert(`Failed to delete simulation: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = async (simulationId: string, status: 'draft' | 'review' | 'published' | 'archived') => {
    try {
      const response = await fetch(`/api/simulations/${simulationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');

      loadSimulations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredSimulations = simulations.filter(sim => {
    if (filter === 'all') return true;
    return sim.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', icon: XCircle },
      review: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', icon: Clock },
      published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
      archived: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      beginner: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
      intermediate: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300' },
      advanced: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' }
    };

    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {difficulty}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Categories
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categoryName}</h2>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Simulation
        </button>
      </div>

      <div className="flex items-center space-x-2">
        {(['all', 'draft', 'published', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-20">
              {status === 'all'
                ? simulations.length
                : simulations.filter(s => s.status === status).length
              }
            </span>
          </button>
        ))}
      </div>

      {filteredSimulations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Simulations Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first simulation in this category to get started
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create First Simulation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulations.map((simulation) => (
            <motion.div
              key={simulation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {simulation.display_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {simulation.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(simulation.status)}
                  {getDifficultyBadge(simulation.difficulty)}
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="w-4 h-4 mr-1" />
                  {simulation.estimated_duration_minutes} min
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => onPreview(e, simulation.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    title="Preview simulation"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => onEdit(simulation.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    title="Edit simulation"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => handleDuplicate(simulation)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    title="Duplicate simulation"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(simulation.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                    title="Delete simulation"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>

                {simulation.status === 'draft' && (
                  <div className="mt-2">
                    <select
                      value={simulation.status}
                      onChange={(e) => handleStatusChange(simulation.id, e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Move to Review</option>
                      <option value="published">Publish</option>
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimulationListView;
