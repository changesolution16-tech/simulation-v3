import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Folder, ChevronRight, BarChart3, Eye, TrendingUp, Users, ArrowUpDown, Star, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SimulationService } from '../../lib/simulations';
import * as LucideIcons from 'lucide-react';
import SimulationListView from './SimulationListView';
import SimulationBuilder from './SimulationBuilder';
import SimulationPreviewModal from './SimulationPreviewModal';

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

interface CategoryAnalytics {
  category_id: string;
  total_views: number;
  unique_learners: number;
  simulations_started: number;
  simulations_completed: number;
  completion_rate: number;
  average_time_spent: number;
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

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<SimulationCategory[]>([]);
  const [simulationCounts, setSimulationCounts] = useState<Record<string, number>>({});
  const [categoryAnalytics, setCategoryAnalytics] = useState<Record<string, CategoryAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'simulations' | 'views'>('order');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showSimulationBuilder, setShowSimulationBuilder] = useState(false);
  const [editingSimulationId, setEditingSimulationId] = useState<string | undefined>(undefined);
  const [previewSimulationId, setPreviewSimulationId] = useState<string | null>(null);
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
    loadCategoryAnalytics();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('simulation_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data || []);

      const counts: Record<string, number> = {};
      for (const category of data || []) {
        const count = await SimulationService.getSimulationCount(category.id);
        counts[category.id] = count;
      }
      setSimulationCounts(counts);
    }
    setLoading(false);
  };

  const loadCategoryAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('category_statistics')
        .select('*');

      if (error) {
        console.error('Error loading category analytics:', error);
        return;
      }

      const analyticsMap: Record<string, CategoryAnalytics> = {};
      (data || []).forEach((stat: any) => {
        analyticsMap[stat.category_id] = {
          category_id: stat.category_id,
          total_views: stat.total_views || 0,
          unique_learners: stat.unique_learners || 0,
          simulations_started: stat.total_simulations_started || 0,
          simulations_completed: stat.total_simulations_completed || 0,
          completion_rate: stat.average_completion_rate || 0,
          average_time_spent: 0
        };
      });
      setCategoryAnalytics(analyticsMap);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreate = async () => {
    const { error } = await supabase
      .from('simulation_categories')
      .insert([formData]);

    if (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    } else {
      loadCategories();
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('simulation_categories')
      .update(formData)
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    } else {
      loadCategories();
      setEditingId(null);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Scenarios in this category will be unassigned.')) {
      return;
    }

    const { error } = await supabase
      .from('simulation_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } else {
      loadCategories();
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

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Folder;
    return Icon;
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handlePreviewClick = (e: React.MouseEvent, simulationId: string) => {
    e.stopPropagation();
    setPreviewSimulationId(simulationId);
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
    loadCategories();
    loadCategoryAnalytics();
  };

  const getSortedCategories = () => {
    const sorted = [...categories];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'simulations':
        return sorted.sort((a, b) => (simulationCounts[b.id] || 0) - (simulationCounts[a.id] || 0));
      case 'views':
        return sorted.sort((a, b) => {
          const viewsA = categoryAnalytics[a.id]?.total_views || 0;
          const viewsB = categoryAnalytics[b.id]?.total_views || 0;
          return viewsB - viewsA;
        });
      case 'order':
      default:
        return sorted.sort((a, b) => a.display_order - b.display_order);
    }
  };

  const getTotalStats = () => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.is_active).length;
    const totalSimulations = Object.values(simulationCounts).reduce((sum, count) => sum + count, 0);
    const totalViews = Object.values(categoryAnalytics).reduce((sum, a) => sum + a.total_views, 0);
    return { totalCategories, activeCategories, totalSimulations, totalViews };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedCategoryId) {
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    return (
      <>
        <SimulationListView
          categoryId={selectedCategoryId}
          categoryName={selectedCategory?.name || 'Category'}
          onBack={handleBackToCategories}
          onCreateNew={() => {
            setEditingSimulationId(undefined);
            setShowSimulationBuilder(true);
          }}
          onEdit={(simulationId) => {
            setEditingSimulationId(simulationId);
            setShowSimulationBuilder(true);
          }}
          onPreview={handlePreviewClick}
        />
        {showSimulationBuilder && (
          <SimulationBuilder
            simulationId={editingSimulationId}
            categoryId={selectedCategoryId}
            onClose={() => {
              setShowSimulationBuilder(false);
              setEditingSimulationId(undefined);
            }}
            onSuccess={(simulationId) => {
              console.log('[CategoryManager] Simulation saved successfully, staying in category:', selectedCategoryId);
              setShowSimulationBuilder(false);
              setEditingSimulationId(undefined);
            }}
          />
        )}
        {previewSimulationId && (
          <SimulationPreviewModal
            simulationId={previewSimulationId}
            onClose={() => setPreviewSimulationId(null)}
          />
        )}
      </>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalCategories}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.activeCategories} active</p>
              </div>
              <Folder className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Simulations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalSimulations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all categories</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalViews}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Category views</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique Learners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {Object.values(categoryAnalytics).reduce((sum, a) => Math.max(sum, a.unique_learners), 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Engaged learners</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
        </div>
        <div className="flex space-x-2">
          {[{id: 'order', label: 'Order'}, {id: 'name', label: 'Name'}, {id: 'simulations', label: 'Simulations'}, {id: 'views', label: 'Views'}].map((option) => (
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

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-blue-500 p-6"
          >
            <CategoryForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleCreate}
              onCancel={cancelEdit}
              getIconComponent={getIconComponent}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCategories.map((category) => (
          <motion.div
            key={category.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              editingId === category.id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {editingId === category.id ? (
              <CategoryForm
                formData={formData}
                setFormData={setFormData}
                onSave={() => handleUpdate(category.id)}
                onCancel={cancelEdit}
                getIconComponent={getIconComponent}
              />
            ) : (
              <div
                className="space-y-4 cursor-pointer"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {React.createElement(getIconComponent(category.icon), {
                      className: 'w-8 h-8',
                      style: { color: category.color }
                    })}
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
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

                  {showAnalytics && categoryAnalytics[category.id] && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center text-xs">
                        <Eye className="w-3 h-3 mr-1 text-purple-500" />
                        <span className="text-gray-600 dark:text-gray-400">{categoryAnalytics[category.id].total_views} views</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <Users className="w-3 h-3 mr-1 text-orange-500" />
                        <span className="text-gray-600 dark:text-gray-400">{categoryAnalytics[category.id].unique_learners} learners</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">{categoryAnalytics[category.id].simulations_started} started</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        <span className="text-gray-600 dark:text-gray-400">{categoryAnalytics[category.id].completion_rate.toFixed(0)}% rate</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {categories.length === 0 && !isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Categories Yet</h3>
          <p className="text-gray-500 mb-4">
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
};

interface CategoryFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  getIconComponent: (iconName: string) => any;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  formData,
  setFormData,
  onSave,
  onCancel,
  getIconComponent
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Communication Skills"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Brief description of this category"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
          <select
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <div className="flex space-x-1">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <button
          onClick={onCancel}
          className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
};

export default CategoryManager;
