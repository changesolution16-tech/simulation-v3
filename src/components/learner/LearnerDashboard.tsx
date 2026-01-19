'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Eye,
  BookOpen,
  TrendingUp,
  Mail,
  Building,
  Briefcase,
  Folder
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import LearnerPathVisualization from '@/components/simulation/LearnerPathVisualization';
import CategoryBrowser from '@/components/learner/CategoryBrowser';
import BravinProfileWidget from '@/components/learner/BravinProfileWidget';

interface UserProfile {
  name?: string | null;
  email?: string | null;
  institution?: string | null;
  department?: string | null;
  position?: string | null;
}

interface AssignmentRecord {
  id: string;
  simulation_id: string;
  cohort_id?: string | null;
  instructor_id?: string | null;
  due_date?: string | null;
  instructions?: string | null;
  max_attempts?: number | null;
  passing_score?: number | null;
  is_required?: boolean | null;
  status?: string | null;
  simulation_name?: string | null;
  simulation_difficulty?: string | null;
  instructor_name?: string | null;
  cohort_name?: string | null;
  learner_stats?: {
    attempt_count: number;
    best_score: number;
    has_completed: boolean;
    is_passing: boolean;
  };
}

interface SimulationSummary {
  id: string;
  display_name?: string | null;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  difficulty?: string | null;
  landing_image_url?: string | null;
  landing_image_alt?: string | null;
}

type ViewType = 'my-simulations' | 'browse';

type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

const LearnerDashboard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('my-simulations');

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      setActiveView('browse');
    }
  }, [searchParams]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [assignmentsResponse, simulationsResponse, profileResponse] = await Promise.all([
        fetch(`/api/assignments?learner_id=${session?.user?.id}`),
        fetch('/api/simulations'),
        fetch('/api/users/me')
      ]);

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData || []);
      }

      if (simulationsResponse.ok) {
        const simulationsData = await simulationsResponse.json();
        setSimulations(simulationsData || []);
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData || null);
      }
    } catch (error) {
      console.error('Error loading learner dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulationsById = useMemo(() => {
    const map = new Map<string, SimulationSummary>();
    simulations.forEach((simulation) => map.set(simulation.id, simulation));
    return map;
  }, [simulations]);

  const getAssignmentStatus = (assignment: AssignmentRecord): AssignmentStatus => {
    const stats = assignment.learner_stats;
    if (stats?.has_completed) return 'completed';
    if ((stats?.attempt_count || 0) > 0) return 'in_progress';
    return 'assigned';
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === 'all') return true;
    return getAssignmentStatus(assignment) === filter;
  });

  const getStatusInfo = (assignment: AssignmentRecord) => {
    const status = getAssignmentStatus(assignment);
    const now = new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;

    if (status === 'completed') {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: t('dashboard.completed'),
        priority: 4
      };
    }

    if (dueDate && now > dueDate) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: t('assignments.status.overdue'),
        priority: 1
      };
    }

    if (status === 'in_progress') {
      return {
        icon: PlayCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: t('dashboard.inProgress'),
        priority: 2
      };
    }

    return {
      icon: ClipboardList,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50',
      label: t('assignments.status.notStarted'),
      priority: 3
    };
  };

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const aInfo = getStatusInfo(a);
    const bInfo = getStatusInfo(b);

    if (aInfo.priority !== bInfo.priority) {
      return aInfo.priority - bInfo.priority;
    }

    const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;

    return aDue - bDue;
  });

  const handleStartAssignment = (assignment: AssignmentRecord) => {
    if (!assignment.simulation_id) {
      alert(t('assignments.noSimulation'));
      return;
    }

    router.push(`/simulations/${assignment.simulation_id}/start?assignmentId=${assignment.id}`);
  };

  const handleViewResults = (assignment: AssignmentRecord) => {
    if (!assignment.simulation_id) {
      alert(t('assignments.noSimulation'));
      return;
    }

    router.push(`/simulations/${assignment.simulation_id}/results`);
  };

  const stats = {
    total: assignments.length,
    completed: assignments.filter((assignment) => getAssignmentStatus(assignment) === 'completed').length,
    inProgress: assignments.filter((assignment) => getAssignmentStatus(assignment) === 'in_progress').length,
    pending: assignments.filter((assignment) => getAssignmentStatus(assignment) === 'assigned').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <section className="bg-brand-primary rounded-xl shadow-md">
        <div className="p-8 pb-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-white mb-4">
                {t('dashboard.welcomeBack', { name: profile?.name || session?.user?.name || 'User' })}
              </h1>
              <p className="text-white mb-6 opacity-90">
                {t('dashboard.pendingAssignments', {
                  count: stats.pending,
                  plural: stats.pending !== 1 ? 's' : '',
                  inProgress: stats.inProgress
                })}
              </p>

              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-sm">
                  {profile.email && (
                    <div className="flex items-center text-white opacity-90">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile.institution && (
                    <div className="flex items-center text-white opacity-90">
                      <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{profile.institution}</span>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-center text-white opacity-90">
                      <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{profile.department}</span>
                    </div>
                  )}
                  {profile.position && (
                    <div className="flex items-center text-white opacity-90">
                      <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{profile.position}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="px-8 pb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('my-simulations')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeView === 'my-simulations'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg'
                  : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              {t('navigation.mySimulations')}
            </button>
            <button
              onClick={() => setActiveView('browse')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeView === 'browse'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg'
                  : 'text-blue-100 hover:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              <Folder className="w-5 h-5 mr-2" />
              {t('navigation.browseCategories')}
            </button>
          </div>
        </div>
      </section>

      {activeView === 'my-simulations' && (
        <>
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <StatCard
              icon={ClipboardList}
              label={t('dashboard.totalAssignments')}
              value={stats.total}
              color="blue"
            />
            <StatCard
              icon={Clock}
              label={t('dashboard.pending')}
              value={stats.pending}
              color="gray"
            />
            <StatCard
              icon={PlayCircle}
              label={t('dashboard.inProgress')}
              value={stats.inProgress}
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              label={t('dashboard.completed')}
              value={stats.completed}
              color="green"
            />
          </motion.section>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('dashboard.myAssignments')}
              </h2>
              <div className="flex space-x-2">
                {(['all', 'assigned', 'in_progress', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status === 'all'
                      ? t('dashboard.filterAll')
                      : status === 'assigned'
                      ? t('dashboard.filterAssigned')
                      : status === 'in_progress'
                      ? t('dashboard.filterInProgress')
                      : t('dashboard.filterCompleted')}
                  </button>
                ))}
              </div>
            </div>

            {sortedAssignments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {filter === 'all'
                    ? t('dashboard.noAssignments')
                    : t('dashboard.noFilteredAssignments', { filter: filter.replace('_', ' ') })}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'all' ? t('dashboard.noAssignmentsDesc') : t('dashboard.tryDifferentFilter')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAssignments.map((assignment) => {
                  const statusInfo = getStatusInfo(assignment);
                  const StatusIcon = statusInfo.icon;
                  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                  const simulation = simulationsById.get(assignment.simulation_id);

                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-lg transition-all ${
                        statusInfo.priority === 1 ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`${statusInfo.bgColor} p-4 border-b border-gray-200 dark:border-gray-700`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color} mr-2`} />
                            <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          {dueDate && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {t('assignments.due')}: {dueDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {simulation?.landing_image_url && (
                        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                          <img
                            src={simulation.landing_image_url}
                            alt={simulation.landing_image_alt || simulation.display_name || assignment.simulation_name || 'Simulation'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                          {assignment.simulation_name || simulation?.display_name || t('navigation.simulations')}
                        </h3>

                        {assignment.instructions && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {assignment.instructions}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          {simulation ? (
                            <>
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 font-medium">
                                <BookOpen className="w-4 h-4 mr-2 text-brand-primary" />
                                <span>{simulation.display_name || assignment.simulation_name}</span>
                              </div>
                              {simulation.estimated_duration_minutes && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>
                                    {simulation.estimated_duration_minutes} {t('categoryBrowser.minutes')} • {simulation.difficulty}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center text-sm text-amber-600">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              <span>{t('assignments.simulationLoading')}</span>
                            </div>
                          )}

                          {(assignment.learner_stats?.attempt_count || 0) > 0 && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              <span>{t('assignments.attempts')}: {assignment.learner_stats?.attempt_count}</span>
                            </div>
                          )}

                          {(assignment.learner_stats?.best_score || 0) > 0 && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span>{t('assignments.bestScore')}: {Math.round(assignment.learner_stats?.best_score || 0)}%</span>
                            </div>
                          )}
                        </div>

                        {getAssignmentStatus(assignment) === 'completed' ? (
                          <button
                            onClick={() => handleViewResults(assignment)}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t('assignments.viewResults')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartAssignment(assignment)}
                            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {getAssignmentStatus(assignment) === 'in_progress'
                              ? t('assignments.continueTraining')
                              : t('assignments.startTraining')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('dashboard.learningJourney')}
                </h2>
              </div>
              <LearnerPathVisualization />
            </section>

            <section>{session?.user?.id && <BravinProfileWidget learnerId={session.user.id} />}</section>
          </div>
        </>
      )}

      {activeView === 'browse' && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CategoryBrowser />
        </motion.section>
      )}
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'gray';
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    gray: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </motion.div>
  );
};

export default LearnerDashboard;
