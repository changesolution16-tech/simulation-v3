'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Folder, ChevronRight, BarChart3, Eye, TrendingUp, Users, ArrowUpDown, Star, Activity } from 'lucide-react';

interface SimulationCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ICON_OPTIONS = [
  'MessageSquare', 'Users', 'HeartHandshake', 'BrainCircuit',
  'Target', 'BarChart4', 'Crown', 'BookOpen', 'Lightbulb',
  'Briefcase', 'TrendingUp', 'Award', 'Shield', 'Zap', 'Folder'
];

const COLOR_OPTIONS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#F97316', '#06B6D4',
  '#14B8A6', '#84CC16', '#6366F1', '#A855F7'
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<SimulationCategory[]>([]);
  const [simulationCounts, setSimulationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'simulations'>('order');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Folder',
    color: '#3B82F6',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);

        const counts: Record<string, number> = {};
        for (const category of data) {
          const simResponse = await fetch(`/api/simulations?category_id=${category.id}`);
          if (simResponse.ok) {
            const sims = await simResponse.json();
            counts[category.id] = sims.length;
          }
        }
        setSimulationCounts(counts);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        loadCategories();
        setIsCreating(false);
        resetForm();
      } else {
        alert('Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        loadCategories();
        setEditingId(null);
        resetForm();
      } else {
        alert('Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Simulations in this category will be unassigned.')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadCategories();
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const startEdit = (category: SimulationCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      display_order: category.display_order,
      is_active: category.is_active
    });
    setEditingId(category.id);
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Folder',
      color: '#3B82F6',
      display_order: categories.length,
      is_active: true
    });
  };

  const getSortedCategories = () => {
    const sorted = [...categories];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'simulations':
        return sorted.sort((a, b) => (simulationCounts[b.id] || 0) - (simulationCounts[a.id] || 0));
      case 'order':
      default:
        return sorted.sort((a, b) => a.display_order - b.display_order);
    }
  };

  const getTotalStats = () => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.is_active).length;
    const totalSimulations = Object.values(simulationCounts).reduce((sum, count) => sum + count, 0);
    return { totalCategories, activeCategories, totalSimulations };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getTotalStats();
  const sortedCategories = getSortedCategories();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Simulation Categories</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organize simulations into categories for easy browsing</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
          <button
            onClick={startCreate}
            disabled={isCreating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Category
          </button>
        </div>
      </div>

      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalCategories}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.activeCategories} active</p>
              </div>
              <Folder className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Simulations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalSimulations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all categories</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average per Category</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.totalCategories > 0 ? Math.round(stats.totalSimulations / stats.totalCategories) : 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Simulations</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
        </div>
        <div className="flex space-x-2">
          {[{id: 'order', label: 'Order'}, {id: 'name', label: 'Name'}, {id: 'simulations', label: 'Simulations'}].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-blue-500 p-6">
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleCreate}
            onCancel={cancelEdit}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCategories.map((category) => (
          <div
            key={category.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-6 ${
              editingId === category.id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {editingId === category.id ? (
              <CategoryForm
                formData={formData}
                setFormData={setFormData}
                onSave={() => handleUpdate(category.id)}
                onCancel={cancelEdit}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Folder className="w-8 h-8" style={{ color: category.color }} />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{simulationCounts[category.id] || 0} simulations</span>
                    <span className={`px-2 py-1 rounded ${
                      category.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && !isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Categories Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create categories to organize your simulations by topic or skill area
          </p>
          <button
            onClick={startCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create First Category
          </button>
        </div>
      )}
    </div>
  );
}

interface CategoryFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

function CategoryForm({ formData, setFormData, onSave, onCancel }: CategoryFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Communication Skills"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Brief description of this category"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
          <div className="flex flex-wrap gap-1">
            {COLOR_OPTIONS.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-lg border-2 ${
                  formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                } transition-all`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
        <select
          value={formData.is_active ? 'active' : 'inactive'}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <button
          onClick={onCancel}
          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!formData.name.trim()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
      </div>
    </div>
  );
}
