'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, Folder } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface SimulationCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface TopicSelectionProps {
  onCategorySelect: (categoryId: string) => void;
}

const TopicSelection: React.FC<TopicSelectionProps> = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState<SimulationCategory[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulations');
      if (!response.ok) throw new Error('Failed to load simulations');

      const simulations = await response.json();

      const categoryMap = new Map<string, { category: SimulationCategory; count: number }>();

      simulations.forEach((sim: any) => {
        if (sim.category_id && sim.category_name) {
          const existing = categoryMap.get(sim.category_id);
          if (existing) {
            existing.count++;
          } else {
            categoryMap.set(sim.category_id, {
              category: {
                id: sim.category_id,
                name: sim.category_name,
                description: sim.category_description,
                icon: sim.category_icon || 'Folder',
                color: sim.category_color || '#3B82F6'
              },
              count: 1
            });
          }
        }
      });

      const loadedCategories = Array.from(categoryMap.values()).map(item => item.category);
      const counts = Array.from(categoryMap.entries()).reduce((acc, [id, item]) => {
        acc[id] = item.count;
        return acc;
      }, {} as Record<string, number>);

      setCategories(loadedCategories);
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading simulation categories...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
          <p className="text-amber-800 dark:text-amber-300 font-medium">No simulation categories available</p>
          <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
            Please contact your administrator to set up simulation categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Choose a Simulation Category</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select a category to explore available simulations. Each category contains scenarios designed to help you develop specific professional skills.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {categories.map((category) => {
          const IconComponent = (LucideIcons as any)[category.icon || 'Folder'] || Folder;
          const simulationCount = categoryCounts[category.id] || 0;

          return (
            <motion.div
              key={category.id}
              variants={item}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => onCategorySelect(category.id)}
                className="w-full h-full text-left"
              >
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{category.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {simulationCount} {simulationCount === 1 ? 'simulation' : 'simulations'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{category.description}</p>
                  )}
                  <div className="mt-4 flex justify-end text-blue-600 dark:text-blue-400 font-medium text-sm items-center">
                    Browse <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default TopicSelection;
