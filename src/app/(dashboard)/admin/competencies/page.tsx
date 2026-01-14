'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Award } from 'lucide-react';

interface Competency {
  id: string;
  name: string;
  description: string;
  competency_level: number;
  category?: string;
  tags?: string[];
  proficiency_levels?: any[];
  created_at: string;
  updated_at: string;
}

export default function CompetenciesPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [filteredCompetencies, setFilteredCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);

  useEffect(() => {
    loadCompetencies();
  }, []);

  useEffect(() => {
    filterCompetencies();
  }, [competencies, searchTerm, levelFilter, categoryFilter]);

  const loadCompetencies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/competencies');
      if (response.ok) {
        const data = await response.json();
        setCompetencies(data);
      }
    } catch (error) {
      console.error('Error loading competencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompetencies = () => {
    let filtered = competencies;

    if (searchTerm) {
      filtered = filtered.filter(
        (comp) =>
          comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter((comp) => comp.competency_level === parseInt(levelFilter));
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((comp) => comp.category === categoryFilter);
    }

    setFilteredCompetencies(filtered);
  };

  const handleCreateCompetency = async (data: any) => {
    try {
      const response = await fetch('/api/competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowModal(false);
        loadCompetencies();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create competency');
      }
    } catch (error) {
      console.error('Error creating competency:', error);
      alert('Failed to create competency');
    }
  };

  const handleUpdateCompetency = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/competencies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setEditingCompetency(null);
        loadCompetencies();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update competency');
      }
    } catch (error) {
      console.error('Error updating competency:', error);
      alert('Failed to update competency');
    }
  };

  const handleDeleteCompetency = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competency?')) return;

    try {
      const response = await fetch(`/api/competencies/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadCompetencies();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete competency');
      }
    } catch (error) {
      console.error('Error deleting competency:', error);
      alert('Failed to delete competency');
    }
  };

  const categories = Array.from(new Set(competencies.map((c) => c.category).filter(Boolean)));

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
            Competencies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Define and manage learning competencies
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Competency
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search competencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Competencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompetencies.map((competency) => (
          <div
            key={competency.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {competency.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Level {competency.competency_level}
                    </span>
                    {competency.category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {competency.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {competency.description}
            </p>

            {competency.tags && competency.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {competency.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {competency.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                    +{competency.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditingCompetency(competency)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteCompetency(competency.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCompetencies.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No competencies found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first competency to get started
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Competency
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showModal || editingCompetency) && (
        <CompetencyModal
          competency={editingCompetency}
          onClose={() => {
            setShowModal(false);
            setEditingCompetency(null);
          }}
          onSubmit={(data) => {
            if (editingCompetency) {
              handleUpdateCompetency(editingCompetency.id, data);
            } else {
              handleCreateCompetency(data);
            }
          }}
        />
      )}
    </div>
  );
}

function CompetencyModal({
  competency,
  onClose,
  onSubmit
}: {
  competency: Competency | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: competency?.name || '',
    description: competency?.description || '',
    competency_level: competency?.competency_level || 1,
    category: competency?.category || '',
    tags: competency?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {competency ? 'Edit Competency' : 'Create Competency'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level
                </label>
                <select
                  value={formData.competency_level}
                  onChange={(e) =>
                    setFormData({ ...formData, competency_level: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Leadership"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., communication, teamwork, decision-making"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {competency ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
