'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  User,
  Eye,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface TrainingAssignment {
  id: string;
  title?: string | null;
  description?: string | null;
  created_by?: string | null;
  instructor_id?: string | null;
  simulation_id?: string | null;
  category_id?: string | null;
  assignment_type?: 'individual' | 'cohort' | 'mixed';
  cohort_id?: string | null;
  cohort_ids?: string[];
  individual_learner_ids?: string[];
  start_date?: string | null;
  end_date?: string | null;
  due_date?: string | null;
  max_attempts?: number | null;
  passing_score?: number | null;
  is_published?: boolean | null;
  status?: string | null;
}

interface AssignmentLearner {
  id?: string;
  assignment_id: string;
  learner_id: string;
  status: string;
  attempt_count?: number | null;
  best_score?: number | null;
  time_spent_seconds?: number | null;
  full_name?: string | null;
  email?: string | null;
}

interface Cohort {
  id: string;
  name: string;
  member_count?: number;
  institution?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Simulation {
  id: string;
  display_name: string;
  difficulty: string;
  estimated_duration_minutes: number;
}

interface Learner {
  id: string;
  full_name: string;
  email: string;
  institution?: string | null;
}

const AssignmentManager: React.FC = () => {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TrainingAssignment | null>(null);
  const [assignmentLearners, setAssignmentLearners] = useState<AssignmentLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TrainingAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadAssignments();
    }
  }, [session?.user?.id]);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/assignments');
      if (!response.ok) {
        throw new Error('Failed to load assignments');
      }
      const data = await response.json();
      setAssignments(data || []);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentDetails = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/learners`);
      if (!response.ok) {
        throw new Error('Failed to load assignment learners');
      }
      const learners = await response.json();
      setAssignmentLearners(learners || []);
    } catch (err: any) {
      console.error('Error loading assignment learners:', err);
      setError(err.message || 'Failed to load assignment learners');
    }
  };

  const handleSelectAssignment = async (assignment: TrainingAssignment) => {
    setSelectedAssignment(assignment);
    await loadAssignmentDetails(assignment.id);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assignment');
      }
      await loadAssignments();
      if (selectedAssignment?.id === assignmentId) {
        setSelectedAssignment(null);
        setAssignmentLearners([]);
      }
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      assigned: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      exempt: 'bg-yellow-100 text-yellow-800'
    };

    const labels: Record<string, string> = {
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      overdue: 'Overdue',
      exempt: 'Exempt'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.assigned}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateCompletionRate = (learners: AssignmentLearner[]) => {
    if (learners.length === 0) return 0;
    const completed = learners.filter(l => l.status === 'completed').length;
    return Math.round((completed / learners.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Training Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage training assignments for learners and cohorts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Assignment
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-8">
        {assignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Assignments Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first training assignment to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {assignment.title || 'Untitled Assignment'}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAssignment(assignment)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setShowEditModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit Assignment"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {assignment.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      {assignment.assignment_type === 'cohort' ? (
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                      ) : (
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                      )}
                      <span className="text-gray-600 dark:text-gray-400">
                        {assignment.assignment_type === 'cohort'
                          ? `${assignment.cohort_ids?.length || (assignment.cohort_id ? 1 : 0)} cohort(s)`
                          : `${assignment.individual_learner_ids?.length || 0} learner(s)`}
                      </span>
                    </div>

                    {assignment.start_date && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Start: {new Date(assignment.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {assignment.end_date && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          End: {new Date(assignment.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                      {assignment.is_published ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedAssignment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAssignment.title || 'Assignment'}
                </h2>
                {selectedAssignment.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedAssignment.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {calculateCompletionRate(assignmentLearners)}%
                </div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Assigned Learners ({assignmentLearners.length})
              </h3>
              <div className="text-sm text-gray-500">
                ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedAssignment.id}</code>
              </div>
            </div>

            {selectedAssignment.assignment_type === 'cohort' &&
              assignmentLearners.length === 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium mb-1">
                        No learners found in this assignment
                      </p>
                      <p className="text-sm text-yellow-700">
                        This assignment is linked to cohorts, but no learner records were created.
                        Try recreating the assignment after confirming cohort membership.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Learner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Spent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {assignmentLearners.map((learner) => (
                    <tr key={`${learner.assignment_id}-${learner.learner_id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {learner.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{learner.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(learner.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {learner.attempt_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {learner.best_score !== null && learner.best_score !== undefined
                          ? `${learner.best_score}%`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {Math.round((learner.time_spent_seconds || 0) / 60)} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {assignmentLearners.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No learners assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            setError(null);
            try {
              const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create assignment');
              }
              await loadAssignments();
              setShowCreateModal(false);
            } catch (err: any) {
              console.error('Failed to create assignment:', err);
              setError(err.message || 'Failed to create assignment');
            }
          }}
        />
      )}

      {showEditModal && editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          onClose={() => {
            setShowEditModal(false);
            setEditingAssignment(null);
          }}
          onUpdate={async (data) => {
            setError(null);
            try {
              const response = await fetch(`/api/assignments/${editingAssignment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update assignment');
              }
              await loadAssignments();
              setShowEditModal(false);
              setEditingAssignment(null);
            } catch (err: any) {
              console.error('Failed to update assignment:', err);
              setError(err.message || 'Failed to update assignment');
            }
          }}
        />
      )}
    </div>
  );
};

interface CreateAssignmentModalProps {
  onClose: () => void;
  onCreate: (data: Partial<TrainingAssignment>) => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [simulationId, setSimulationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<'individual' | 'cohort'>('cohort');

  const [categories, setCategories] = useState<Category[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Learner[]>([]);
  const [selectedCohorts, setSelectedCohorts] = useState<Set<string>>(new Set());
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalLearnerCount, setTotalLearnerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    if (assignmentType === 'cohort') {
      loadCohorts();
    }
  }, [assignmentType]);

  useEffect(() => {
    if (categoryId) {
      loadSimulations(categoryId);
    } else {
      setSimulations([]);
      setSimulationId('');
    }
  }, [categoryId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && assignmentType === 'individual') {
        searchLearners();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, assignmentType]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) return;
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadSimulations = async (catId: string) => {
    try {
      const response = await fetch(`/api/simulations?category_id=${catId}&status=published`);
      if (!response.ok) return;
      const data = await response.json();
      setSimulations(data || []);
    } catch (err) {
      console.error('Error loading simulations:', err);
    }
  };

  const loadCohorts = async () => {
    try {
      const response = await fetch('/api/cohorts');
      if (!response.ok) return;
      const data = await response.json();
      setCohorts(data || []);
    } catch (err) {
      console.error('Error loading cohorts:', err);
    }
  };

  const searchLearners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/instructor/learners?search=${encodeURIComponent(searchQuery)}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to search learners');
      }
      const data = await response.json();
      setSearchResults(data || []);
    } catch (err: any) {
      console.error('Error searching learners:', err);
      setError(err.message || 'Failed to search learners');
    } finally {
      setLoading(false);
    }
  };

  const toggleCohort = (cohortId: string) => {
    const newSelection = new Set(selectedCohorts);
    if (newSelection.has(cohortId)) {
      newSelection.delete(cohortId);
    } else {
      newSelection.add(cohortId);
    }
    setSelectedCohorts(newSelection);
    calculateTotalLearners(newSelection);
  };

  const calculateTotalLearners = (selectedCohortIds: Set<string>) => {
    const total = cohorts
      .filter(cohort => selectedCohortIds.has(cohort.id))
      .reduce((sum, cohort) => sum + (cohort.member_count || 0), 0);
    setTotalLearnerCount(total);
  };

  const toggleLearner = (learnerId: string) => {
    const newSelection = new Set(selectedLearners);
    if (newSelection.has(learnerId)) {
      newSelection.delete(learnerId);
    } else {
      newSelection.add(learnerId);
    }
    setSelectedLearners(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!title.trim()) {
      setError('Please enter an assignment title');
      return;
    }

    if (!simulationId) {
      setError('Please select a simulation');
      return;
    }

    if (assignmentType === 'cohort') {
      if (selectedCohorts.size === 0) {
        setError('Please select at least one cohort');
        return;
      }

      if (totalLearnerCount === 0) {
        setError('Selected cohorts have no active members');
        return;
      }
    }

    if (assignmentType === 'individual' && selectedLearners.size === 0) {
      setError('Please select at least one learner');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onCreate({
        title,
        description,
        simulation_id: simulationId,
        category_id: categoryId,
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        due_date: endDate ? new Date(endDate).toISOString() : undefined,
        assignment_type: assignmentType,
        cohort_ids: assignmentType === 'cohort' ? Array.from(selectedCohorts) : [],
        individual_learner_ids: assignmentType === 'individual' ? Array.from(selectedLearners) : []
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 my-8"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create Training Assignment</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assign a simulation to learners or cohorts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="e.g., Communication Skills Assessment"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Brief description of this assignment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Simulation *
              </label>
              <select
                value={simulationId}
                onChange={(e) => setSimulationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!categoryId}
              >
                <option value="">
                  {categoryId ? 'Select a simulation...' : 'Select category first...'}
                </option>
                {simulations.map((sim) => (
                  <option key={sim.id} value={sim.id}>
                    {sim.display_name} ({sim.difficulty}) - {sim.estimated_duration_minutes}min
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="cohort"
                  checked={assignmentType === 'cohort'}
                  onChange={(e) => setAssignmentType(e.target.value as 'cohort')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cohorts</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="individual"
                  checked={assignmentType === 'individual'}
                  onChange={(e) => setAssignmentType(e.target.value as 'individual')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Individual Learners</span>
              </label>
            </div>
          </div>

          {assignmentType === 'cohort' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Cohorts * ({selectedCohorts.size} selected, {totalLearnerCount} learners)
              </label>
              {selectedCohorts.size > 0 && totalLearnerCount === 0 && (
                <div className="mb-2 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">
                        Cannot Create Assignment - No Learners Found
                      </p>
                      <p className="text-sm text-red-800">
                        The selected cohorts have no active members. Add learners to the cohorts first.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {cohorts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No active cohorts available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {cohorts.map((cohort) => (
                      <label
                        key={cohort.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCohorts.has(cohort.id)}
                          onChange={() => toggleCohort(cohort.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{cohort.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {cohort.member_count} members
                            {cohort.institution && ` • ${cohort.institution}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search and Select Learners * ({selectedLearners.size} selected)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              />
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No learners found
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Type at least 2 characters to search
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {searchResults.map((learner) => (
                      <label
                        key={learner.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLearners.has(learner.id)}
                          onChange={() => toggleLearner(learner.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{learner.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {learner.email}
                            {learner.institution && ` • ${learner.institution}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

interface EditAssignmentModalProps {
  assignment: TrainingAssignment;
  onClose: () => void;
  onUpdate: (data: Partial<TrainingAssignment>) => void;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ assignment, onClose, onUpdate }) => {
  const [title, setTitle] = useState(assignment.title || '');
  const [description, setDescription] = useState(assignment.description || '');
  const [startDate, setStartDate] = useState(
    assignment.start_date ? new Date(assignment.start_date).toISOString().slice(0, 16) : ''
  );
  const [endDate, setEndDate] = useState(
    assignment.end_date ? new Date(assignment.end_date).toISOString().slice(0, 16) : ''
  );
  const [isPublished, setIsPublished] = useState(assignment.is_published || false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdate({
        title,
        description,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        due_date: endDate ? new Date(endDate).toISOString() : null,
        is_published: isPublished
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Assignment</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is-published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is-published" className="text-sm text-gray-700 dark:text-gray-300">
              Published
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AssignmentManager;
