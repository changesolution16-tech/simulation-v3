'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSimulations } from '@/hooks/useSimulations';
import { useUserAssignments } from '@/hooks/useAssignments';
import {
  Search,
  Filter,
  Clock,
  PlayCircle,
  BookOpen,
  TrendingUp,
  Users,
  CheckCircle,
  ChevronDown,
  X
} from 'lucide-react';
import SkeletonLoader from '../ui/SkeletonLoader';

interface SimulationCardProps {
  simulation: any;
  isAssigned?: boolean;
  onStart: () => void;
}

const SimulationCard: React.FC<SimulationCardProps> = ({ simulation, isAssigned, onStart }) => {
  const { t } = useLanguage();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'intermediate':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group"
    >
      {isAssigned && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">{t('common.assigned')}</span>
        </div>
      )}

      {simulation.landing_image_url && (
        <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={simulation.landing_image_url}
            alt={simulation.landing_image_alt || simulation.display_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
            {simulation.display_name || simulation.name}
          </h3>
          {simulation.difficulty && (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDifficultyColor(simulation.difficulty)}`}>
              {simulation.difficulty}
            </span>
          )}
        </div>

        {simulation.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {simulation.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-4">
          {simulation.estimated_duration_minutes && (
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>{simulation.estimated_duration_minutes} min</span>
            </div>
          )}
          {simulation.scenario_count > 0 && (
            <div className="flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              <span>{simulation.scenario_count} {t('common.scenarios')}</span>
            </div>
          )}
          {simulation.unique_users > 0 && (
            <div className="flex items-center">
              <Users className="w-3.5 h-3.5 mr-1" />
              <span>{simulation.unique_users}</span>
            </div>
          )}
        </div>

        <button
          onClick={onStart}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium flex items-center justify-center transition-all shadow-sm hover:shadow-md"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          {t('simulation.start')}
        </button>
      </div>
    </motion.div>
  );
};

const SimulationLibrary: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { data: simulations, isLoading: simulationsLoading } = useSimulations();
  const { data: assignments } = useUserAssignments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const assignedSimulationIds = useMemo(() => {
    return new Set(assignments?.map(a => a.simulation_id) || []);
  }, [assignments]);

  const filteredSimulations = useMemo(() => {
    if (!simulations) return [];

    return simulations.filter(sim => {
      const matchesSearch = !searchQuery ||
        sim.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sim.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sim.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDifficulty = !selectedDifficulty || sim.difficulty === selectedDifficulty;

      const matchesAssigned = !showAssignedOnly || assignedSimulationIds.has(sim.id);

      return matchesSearch && matchesDifficulty && matchesAssigned;
    });
  }, [simulations, searchQuery, selectedDifficulty, showAssignedOnly, assignedSimulationIds]);

  const handleStartSimulation = (simulationId: string) => {
    router.push(`/simulations/${simulationId}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty(null);
    setShowAssignedOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedDifficulty || showAssignedOnly;

  if (simulationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonLoader width="200px" height="32px" className="mb-2" />
            <SkeletonLoader width="300px" height="20px" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-100 dark:border-gray-700">
              <SkeletonLoader width="100%" height="160px" className="mb-4" />
              <SkeletonLoader width="80%" height="24px" className="mb-2" />
              <SkeletonLoader width="100%" height="40px" className="mb-4" />
              <SkeletonLoader width="100%" height="40px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <TrendingUp className="w-7 h-7 mr-3 text-blue-600 dark:text-blue-500" />
            {t('navigation.simulations')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredSimulations.length} {t('common.available')}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center font-medium"
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('common.filter')}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('common.difficulty')}
                        </label>
                        <div className="space-y-2">
                          {['beginner', 'intermediate', 'advanced'].map(diff => (
                            <label key={diff} className="flex items-center">
                              <input
                                type="radio"
                                name="difficulty"
                                checked={selectedDifficulty === diff}
                                onChange={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {diff}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {assignments && assignments.length > 0 && (
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={showAssignedOnly}
                              onChange={(e) => setShowAssignedOnly(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {t('common.assignedOnly')}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {assignments && assignments.length > 0 && !showAssignedOnly && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
            {t('common.myAssignments')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {simulations
              ?.filter(sim => assignedSimulationIds.has(sim.id))
              .map(simulation => (
                <SimulationCard
                  key={simulation.id}
                  simulation={simulation}
                  isAssigned
                  onStart={() => handleStartSimulation(simulation.id)}
                />
              ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {!showAssignedOnly && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('common.allSimulations')}
          </h2>
        )}

        {filteredSimulations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('common.noResults')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('common.tryDifferentFilter')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('common.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredSimulations
                .filter(sim => !assignedSimulationIds.has(sim.id) || showAssignedOnly)
                .map(simulation => (
                  <SimulationCard
                    key={simulation.id}
                    simulation={simulation}
                    isAssigned={assignedSimulationIds.has(simulation.id)}
                    onStart={() => handleStartSimulation(simulation.id)}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SimulationLibrary;
