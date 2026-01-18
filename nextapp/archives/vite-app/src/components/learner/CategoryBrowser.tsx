import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, ChevronRight, Folder, Clock, Search, Filter, Star, TrendingUp, Award, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSimulationStore } from '../../store';
import { getCategoryName, getCategoryDescription, getSimulationDisplayName, getDifficultyTranslationKey } from '../../lib/translationHelpers';
import * as LucideIcons from 'lucide-react';

interface SimulationCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  scenario_count?: number;
}

interface CategoryProgress {
  category_id: string;
  simulations_started: number;
  simulations_completed: number;
  total_available: number;
  completion_percentage: number;
  is_favorite: boolean;
}

interface Simulation {
  id: string;
  display_name: string;
  description: string;
  difficulty: string;
  category_id: string | null;
  estimated_duration_minutes: number;
  status: string;
  landing_image_url?: string;
  landing_image_alt?: string;
}

const CategoryBrowser: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const { currentUser } = useSimulationStore();
  const [categories, setCategories] = useState<SimulationCategory[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, CategoryProgress>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'progress' | 'name'>('order');

  useEffect(() => {
    loadCategories();
    loadSimulations();
    if (currentUser?.id) {
      loadCategoryProgress();
    }

    // Check if category is pre-selected from URL
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [searchParams, currentUser]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('simulation_categories')
      .select('*, name_en, name_es, description_en, description_es')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const loadSimulations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('simulations')
      .select('id, display_name, display_name_en, display_name_es, description, description_en, description_es, difficulty, category_id, estimated_duration_minutes, status, landing_image_url, landing_image_alt')
      .eq('status', 'published');

    if (error) {
      console.error('Error loading simulations:', error);
    } else {
      console.log('[CategoryBrowser] Loaded simulations:', data);
      data?.forEach(sim => {
        if (sim.landing_image_url) {
          console.log(`[CategoryBrowser] Simulation "${sim.display_name}" has image: ${sim.landing_image_url}`);
        }
      });
      setSimulations(data || []);
    }
    setLoading(false);
  };

  const loadCategoryProgress = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_learner_category_progress', {
        p_learner_id: currentUser.id
      });

      if (error) {
        console.error('Error loading category progress:', error);
        return;
      }

      const progressMap: Record<string, CategoryProgress> = {};
      (data || []).forEach((progress: any) => {
        progressMap[progress.category_id] = {
          category_id: progress.category_id,
          simulations_started: progress.simulations_started || 0,
          simulations_completed: progress.simulations_completed || 0,
          total_available: progress.total_available || 0,
          completion_percentage: progress.completion_percentage || 0,
          is_favorite: progress.is_favorite || false
        };
      });
      setCategoryProgress(progressMap);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const toggleFavorite = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase.rpc('toggle_category_favorite', {
        p_category_id: categoryId,
        p_learner_id: currentUser.id
      });

      if (error) {
        console.error('Error toggling favorite:', error);
        return;
      }

      // Update local state
      setCategoryProgress(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          is_favorite: data
        }
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const trackCategoryView = async (categoryId: string) => {
    if (!currentUser?.id) return;

    try {
      await supabase.rpc('track_category_view', {
        p_category_id: categoryId,
        p_learner_id: currentUser.id
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Folder;
    return Icon;
  };

  const getCategorySimulations = (categoryId: string) => {
    return simulations.filter(s => s.category_id === categoryId);
  };

  const getUncategorizedSimulations = () => {
    return simulations.filter(s => !s.category_id);
  };

  const getFilteredAndSortedCategories = () => {
    let filtered = categories.map(cat => ({
      ...cat,
      scenario_count: getCategorySimulations(cat.id).length
    }));

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cat =>
        getCategoryName(cat, language).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryDescription(cat, language)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply favorites filter
    if (showOnlyFavorites) {
      filtered = filtered.filter(cat => categoryProgress[cat.id]?.is_favorite);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        return filtered.sort((a, b) => getCategoryName(a, language).localeCompare(getCategoryName(b, language)));
      case 'progress':
        return filtered.sort((a, b) => {
          const progressA = categoryProgress[a.id]?.completion_percentage || 0;
          const progressB = categoryProgress[b.id]?.completion_percentage || 0;
          return progressB - progressA;
        });
      case 'order':
      default:
        return filtered.sort((a, b) => a.display_order - b.display_order);
    }
  };

  const categoriesWithCounts = getFilteredAndSortedCategories();

  const uncategorizedCount = getUncategorizedSimulations().length;

  const handleStartSimulation = (simulation: Simulation) => {
    navigate(`/simulation/${simulation.id}/landing`);
  };

  const handleCategoryClick = (categoryId: string) => {
    trackCategoryView(categoryId);
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('categoryBrowser.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('categoryBrowser.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showOnlyFavorites
                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${showOnlyFavorites ? 'fill-current' : ''}`} />
            Favorites
          </button>

          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[{id: 'order', label: 'Default', icon: Filter}, {id: 'name', label: 'Name', icon: BookOpen}, {id: 'progress', label: 'Progress', icon: TrendingUp}].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id as any)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    sortBy === option.id
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title={option.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithCounts.map((category) => {
          const Icon = getIconComponent(category.icon);
          const categorySimulations = getCategorySimulations(category.id);
          const isSelected = selectedCategory === category.id;

          return (
            <motion.div
              key={category.id}
              layout
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all overflow-hidden"
            >
              <div
                onClick={() => handleCategoryClick(category.id)}
                className="w-full p-6 text-left cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{ color: category.color }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => toggleFavorite(category.id, e)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={categoryProgress[category.id]?.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          categoryProgress[category.id]?.is_favorite
                            ? 'fill-pink-500 text-pink-500'
                            : 'text-gray-400 hover:text-pink-500'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {category.scenario_count === 1
                        ? t('categoryBrowser.simulationCount', { count: category.scenario_count })
                        : t('categoryBrowser.simulationCountPlural', { count: category.scenario_count })
                      }
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{getCategoryName(category, language)}</h3>
                {getCategoryDescription(category, language) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{getCategoryDescription(category, language)}</p>
                )}

                {categoryProgress[category.id] && categoryProgress[category.id].total_available > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {categoryProgress[category.id].simulations_completed} of {categoryProgress[category.id].total_available} completed
                      </span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {categoryProgress[category.id].completion_percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${categoryProgress[category.id].completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {isSelected && categorySimulations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
                    {categorySimulations.map((simulation) => (
                      <motion.div
                        key={simulation.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-primary hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                        onClick={() => handleStartSimulation(simulation)}
                      >
                        <div className="flex flex-col">
                          {simulation.landing_image_url ? (
                            <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <img
                                src={simulation.landing_image_url}
                                alt={simulation.landing_image_alt || simulation.display_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center">
                              <BookOpen className="w-16 h-16 text-white opacity-50" />
                            </div>
                          )}
                          <div className="p-5">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xl mb-2 group-hover:text-brand-primary transition-colors text-center">
                              {getSimulationDisplayName(simulation, language)}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed text-center">
                              {simulation.description}
                            </p>
                            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${
                                simulation.difficulty === 'beginner'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : simulation.difficulty === 'intermediate'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {t(getDifficultyTranslationKey(simulation.difficulty))}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {simulation.estimated_duration_minutes} {t('categoryBrowser.minutes')}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartSimulation(simulation);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm hover:shadow-md font-semibold text-base"
                            >
                              <PlayCircle className="w-5 h-5" />
                              <span>{t('categoryBrowser.startSimulation')}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {uncategorizedCount > 0 && (
          <motion.div
            layout
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all overflow-hidden"
          >
            <div
              onClick={() => {
                if (currentUser?.id && selectedCategory !== 'uncategorized') {
                  trackCategoryView('uncategorized');
                }
                setSelectedCategory(selectedCategory === 'uncategorized' ? null : 'uncategorized');
              }}
              className="w-full p-6 text-left cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Folder className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {uncategorizedCount === 1
                      ? t('categoryBrowser.simulationCount', { count: uncategorizedCount })
                      : t('categoryBrowser.simulationCountPlural', { count: uncategorizedCount })
                    }
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedCategory === 'uncategorized' ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('categoryBrowser.otherSimulations')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('categoryBrowser.otherSimulationsDesc')}</p>
            </div>

            {selectedCategory === 'uncategorized' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
                  {getUncategorizedSimulations().map((simulation) => (
                    <motion.div
                      key={simulation.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-primary hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                      onClick={() => handleStartSimulation(simulation)}
                    >
                      <div className="flex flex-col">
                        {simulation.landing_image_url ? (
                          <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                            <img
                              src={simulation.landing_image_url}
                              alt={simulation.landing_image_alt || getSimulationDisplayName(simulation, language)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                        <div className="p-5">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xl mb-2 group-hover:text-brand-primary transition-colors text-center">
                            {getSimulationDisplayName(simulation, language)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed text-center">
                            {simulation.description}
                          </p>
                          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${
                              simulation.difficulty === 'beginner'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : simulation.difficulty === 'intermediate'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {t(getDifficultyTranslationKey(simulation.difficulty))}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {simulation.estimated_duration_minutes} {t('categoryBrowser.minutes')}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSimulation(simulation);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm hover:shadow-md font-semibold text-base"
                          >
                            <PlayCircle className="w-5 h-5" />
                            <span>{t('categoryBrowser.startSimulation')}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {categories.length === 0 && uncategorizedCount === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('categoryBrowser.noSimulations')}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('categoryBrowser.noSimulationsDesc')}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryBrowser;
