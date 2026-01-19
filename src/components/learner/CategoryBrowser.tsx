'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  PlayCircle,
  ChevronRight,
  Folder,
  Clock,
  Search,
  Filter,
  Heart,
  TrendingUp
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getCategoryName,
  getCategoryDescription,
  getSimulationDisplayName,
  getDifficultyTranslationKey
} from '@/lib/translationHelpers';

interface SimulationCategory {
  id: string;
  name: string;
  name_en?: string | null;
  name_es?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  icon?: string | null;
  color?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
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
  display_name?: string | null;
  display_name_en?: string | null;
  display_name_es?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  difficulty?: string | null;
  category_id?: string | null;
  estimated_duration_minutes?: number | null;
  status?: string | null;
  landing_image_url?: string | null;
  landing_image_alt?: string | null;
}

const CategoryBrowser: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { language, t } = useLanguage();

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
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadCategoryProgress(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      const activeCategories = (data || []).filter((category: SimulationCategory) => category.is_active !== false);
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulations');
      if (!response.ok) {
        throw new Error('Failed to load simulations');
      }
      const data = await response.json();
      setSimulations(data || []);
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryProgress = async (learnerId: string) => {
    try {
      const response = await fetch(`/api/categories/progress?learner_id=${learnerId}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
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

  const toggleFavorite = async (categoryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await fetch('/api/categories/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId })
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }

      const data = await response.json();
      setCategoryProgress((prev) => ({
        ...prev,
        [categoryId]: {
          ...(prev[categoryId] || {}),
          is_favorite: data.is_favorite
        }
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const trackCategoryView = async (categoryId: string) => {
    try {
      await fetch('/api/categories/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId })
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const getIconComponent = (iconName?: string | null) => {
    if (!iconName) return Folder;
    const Icon = (LucideIcons as any)[iconName] || Folder;
    return Icon;
  };

  const getCategorySimulations = (categoryId: string) => simulations.filter((sim) => sim.category_id === categoryId);

  const getUncategorizedSimulations = () => simulations.filter((sim) => !sim.category_id);

  const categoriesWithCounts = useMemo(() => {
    let filtered = categories.map((category) => ({
      ...category,
      scenario_count: getCategorySimulations(category.id).length
    }));

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((category) => {
        const name = getCategoryName(category, language).toLowerCase();
        const description = getCategoryDescription(category, language)?.toLowerCase();
        return name.includes(searchLower) || description?.includes(searchLower);
      });
    }

    if (showOnlyFavorites) {
      filtered = filtered.filter((category) => categoryProgress[category.id]?.is_favorite);
    }

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
        return filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
  }, [categories, simulations, categoryProgress, searchTerm, showOnlyFavorites, sortBy, language]);

  const uncategorizedCount = getUncategorizedSimulations().length;

  const handleStartSimulation = (simulation: Simulation) => {
    router.push(`/simulations/${simulation.id}`);
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
            onChange={(event) => setSearchTerm(event.target.value)}
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
            {[
              { id: 'order', label: 'Default', icon: Filter },
              { id: 'name', label: 'Name', icon: BookOpen },
              { id: 'progress', label: 'Progress', icon: TrendingUp }
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id as 'order' | 'progress' | 'name')}
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
        {categoriesWithCounts.map((category: any) => {
          const Icon = getIconComponent(category.icon || undefined);
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
                    style={{ backgroundColor: `${category.color || '#3B82F6'}20` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: category.color || '#3B82F6' }} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(event) => toggleFavorite(category.id, event)}
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
                        : t('categoryBrowser.simulationCountPlural', { count: category.scenario_count })}
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {getCategoryName(category, language)}
                </h3>
                {getCategoryDescription(category, language) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getCategoryDescription(category, language)}
                  </p>
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
                            {simulation.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed text-center">
                                {simulation.description}
                              </p>
                            )}
                            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${
                                  simulation.difficulty === 'beginner'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : simulation.difficulty === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}
                              >
                                {t(getDifficultyTranslationKey(simulation.difficulty || 'beginner'))}
                              </span>
                              {simulation.estimated_duration_minutes && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {simulation.estimated_duration_minutes} {t('categoryBrowser.minutes')}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
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
                if (session?.user?.id && selectedCategory !== 'uncategorized') {
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
                      : t('categoryBrowser.simulationCountPlural', { count: uncategorizedCount })}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedCategory === 'uncategorized' ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('categoryBrowser.otherSimulations')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('categoryBrowser.otherSimulationsDesc')}
              </p>
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
                          {simulation.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed text-center">
                              {simulation.description}
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${
                                simulation.difficulty === 'beginner'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : simulation.difficulty === 'intermediate'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {t(getDifficultyTranslationKey(simulation.difficulty || 'beginner'))}
                            </span>
                            {simulation.estimated_duration_minutes && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {simulation.estimated_duration_minutes} {t('categoryBrowser.minutes')}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('categoryBrowser.noSimulations')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('categoryBrowser.noSimulationsDesc')}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryBrowser;
