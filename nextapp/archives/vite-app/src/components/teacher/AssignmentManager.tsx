import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Calendar, Users, User, Eye, Edit2, Trash2, Search, BookOpen, UsersRound, AlertCircle } from 'lucide-react';
import { AssignmentService, TrainingAssignment, AssignmentLearner } from '../../lib/assignments';
import { CohortService, Cohort } from '../../lib/cohorts';
import { useSimulationStore } from '../../store';
import { useDialog } from '../../contexts/DialogContext';

const AssignmentManager: React.FC = () => {
  const { currentUser, getTopics } = useSimulationStore();
  const { showConfirm, showAlert, showSuccess, showError } = useDialog();
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TrainingAssignment | null>(null);
  const [assignmentLearners, setAssignmentLearners] = useState<AssignmentLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TrainingAssignment | null>(null);

  const topics = getTopics();

  useEffect(() => {
    if (currentUser?.id) {
      loadAssignments();
    }
  }, [currentUser]);

  const loadAssignments = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    const data = await AssignmentService.getTeacherAssignments(currentUser.id);
    setAssignments(data);
    setLoading(false);
  };

  const loadAssignmentDetails = async (assignmentId: string) => {
    console.log('[AssignmentManager] Loading details for assignment:', assignmentId);
    const learners = await AssignmentService.getAssignmentLearners(assignmentId);
    console.log('[AssignmentManager] Loaded learners:', learners.length);
    setAssignmentLearners(learners);
  };

  const handleSelectAssignment = async (assignment: TrainingAssignment) => {
    setSelectedAssignment(assignment);
    await loadAssignmentDetails(assignment.id);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
      variant: 'warning',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmButtonVariant: 'danger'
    });

    if (!confirmed) return;

    const success = await AssignmentService.deleteAssignment(assignmentId);
    if (success) {
      showSuccess('Assignment Deleted', 'The assignment has been successfully deleted.');
      await loadAssignments();
      if (selectedAssignment?.id === assignmentId) {
        setSelectedAssignment(null);
        setAssignmentLearners([]);
      }
    } else {
      showError('Delete Failed', 'Failed to delete the assignment. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      assigned: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      exempt: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      overdue: 'Overdue',
      exempt: 'Exempt'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.assigned}`}>
        {labels[status as keyof typeof labels] || status}
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
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">Create and manage training assignments for learners and cohorts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {assignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Assignments Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">Create your first training assignment to get started</p>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{assignment.title}</h3>
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
                        className="text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100"
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4 line-clamp-2">{assignment.description}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      {assignment.assignment_type === 'cohort' ? (
                        <Users className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      )}
                      <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                        {assignment.assignment_type === 'cohort'
                          ? `${assignment.cohort_ids?.length || 0} cohort(s)`
                          : `${assignment.individual_learner_ids?.length || 0} learner(s)`}
                      </span>
                    </div>

                    {assignment.start_date && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                          Start: {new Date(assignment.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {assignment.end_date && (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                          End: {new Date(assignment.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {assignment.simulation_id && (
                      <div className="flex items-center text-sm">
                        <ClipboardList className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Simulation assigned</span>
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
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-full">
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedAssignment.title}</h2>
                {selectedAssignment.description && (
                  <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{selectedAssignment.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {calculateCompletionRate(assignmentLearners)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Completion Rate</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Assigned Learners ({assignmentLearners.length})
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    console.log('[AssignmentManager] Running diagnostics...');
                    await AssignmentService.diagnoseAssignment(selectedAssignment.id);
                    console.log('[AssignmentManager] Diagnostics complete - check console above');
                  }}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 transition-colors"
                  title="Run diagnostics and check browser console"
                >
                  Run Diagnostics
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{selectedAssignment.id}</code>
                </div>
              </div>
            </div>

            {selectedAssignment.assignment_type === 'cohort' && selectedAssignment.cohort_ids && selectedAssignment.cohort_ids.length > 0 && assignmentLearners.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  No learners found in this assignment
                </p>
                <p className="text-sm text-yellow-700 mb-2">
                  This assignment is linked to {selectedAssignment.cohort_ids.length} cohort(s), but no learner records were created.
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Possible causes:</strong>
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside ml-2 space-y-1">
                  <li>The cohorts had no active members when the assignment was created</li>
                  <li>There was an error during assignment creation (check browser console for logs)</li>
                  <li>Database permissions may be blocking the query</li>
                </ul>
                <p className="text-sm text-yellow-700 mt-3">
                  <strong>To fix:</strong> Try deleting and recreating this assignment, ensuring the cohorts have active members first.
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Learner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Best Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Time Spent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {assignmentLearners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {learner.profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{learner.profile?.email}</div>
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
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
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
            if (!currentUser?.id) {
              await showError('Authentication Error', 'User not authenticated. Please log in again.');
              return;
            }

            const assignmentWithCreator = {
              ...data,
              created_by: currentUser.id
            };

            try {
              const newAssignment = await AssignmentService.createAssignment(assignmentWithCreator);
              if (newAssignment) {
                await loadAssignments();
                setShowCreateModal(false);
                showSuccess('Assignment Created', 'The assignment has been successfully created and assigned to learners.');
              }
            } catch (error) {
              console.error('Failed to create assignment:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to create assignment. Please try again.';
              await showError('Assignment Creation Failed', errorMessage);
            }
          }}
          topics={topics}
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
            try {
              const success = await AssignmentService.updateAssignment(editingAssignment.id, data);
              if (success) {
                await loadAssignments();
                setShowEditModal(false);
                setEditingAssignment(null);
                showSuccess('Assignment Updated', 'The assignment has been successfully updated.');
              }
            } catch (error) {
              console.error('Failed to update assignment:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment. Please try again.';
              await showError('Update Failed', errorMessage);
            }
          }}
          topics={topics}
        />
      )}
    </div>
  );
};

interface CreateAssignmentModalProps {
  onClose: () => void;
  onCreate: (data: Partial<TrainingAssignment>) => void;
  topics: any[];
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ onClose, onCreate }) => {
  const { showError } = useDialog();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [simulationId, setSimulationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<'individual' | 'cohort'>('cohort');

  const [categories, setCategories] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCohorts, setSelectedCohorts] = useState<Set<string>>(new Set());
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalLearnerCount, setTotalLearnerCount] = useState(0);

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
    const data = await AssignmentService.getCategories();
    setCategories(data);
  };

  const loadSimulations = async (catId: string) => {
    const data = await AssignmentService.getPublishedSimulationsByCategory(catId);
    console.log('[AssignmentManager] Loaded simulations for category:', catId, data);
    setSimulations(data);
  };

  const loadCohorts = async () => {
    const data = await AssignmentService.getActiveCohorts();
    setCohorts(data);
  };

  const searchLearners = async () => {
    setLoading(true);
    const data = await AssignmentService.searchLearners(searchQuery);
    setSearchResults(data);
    setLoading(false);
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
      showError('Validation Error', 'Please enter an assignment title');
      return;
    }

    if (!simulationId) {
      showError('Validation Error', 'Please select a simulation');
      return;
    }

    if (assignmentType === 'cohort') {
      if (selectedCohorts.size === 0) {
        showError('Validation Error', 'Please select at least one cohort');
        return;
      }

      if (totalLearnerCount === 0) {
        showError('Cannot Create Assignment', 'The selected cohorts have no active members. Please add learners to the cohorts first.');
        return;
      }
    }

    if (assignmentType === 'individual' && selectedLearners.size === 0) {
      showError('Validation Error', 'Please select at least one learner');
      return;
    }

    setSubmitting(true);

    try {
      await onCreate({
        title,
        description,
        simulation_id: simulationId,
        category_id: categoryId,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || undefined,
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
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Assign a simulation to learners or cohorts</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
              {simulationId && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  This simulation will be assigned to all selected learners
                </p>
              )}
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
                        The selected cohorts have no active members. You must add learners to the cohorts before creating this assignment.
                      </p>
                      <p className="text-sm text-red-700 mt-2">
                        Go to the Cohorts tab to add members, then return to create the assignment.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {selectedCohorts.size === 0 && (
                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Select at least one cohort to assign this training to all members of that cohort.
                  </p>
                </div>
              )}
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {cohorts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">
                    No active cohorts available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {cohorts.map((cohort) => (
                      <label
                        key={cohort.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCohorts.has(cohort.id)}
                          onChange={() => toggleCohort(cohort.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{cohort.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
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
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">
                    No learners found
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">
                    Type at least 2 characters to search
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {searchResults.map((learner) => (
                      <label
                        key={learner.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLearners.has(learner.id)}
                          onChange={() => toggleLearner(learner.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{learner.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Assignment'
              )}
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
  topics: any[];
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ assignment, onClose, onUpdate }) => {
  const { showError } = useDialog();
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description || '');
  const [startDate, setStartDate] = useState(
    assignment.start_date ? new Date(assignment.start_date).toISOString().slice(0, 16) : ''
  );
  const [endDate, setEndDate] = useState(
    assignment.end_date ? new Date(assignment.end_date).toISOString().slice(0, 16) : ''
  );
  const [isPublished, setIsPublished] = useState(assignment.is_published || false);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState<{
    simulation?: any;
    category?: any;
    cohorts?: any[];
    learnerCount?: number;
  }>({});
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    loadAssignmentDetails();
  }, [assignment.id]);

  const loadAssignmentDetails = async () => {
    setLoadingDetails(true);
    const details: any = {};

    if (assignment.simulation_id) {
      const sim = await AssignmentService.getSimulationDetails(assignment.simulation_id);
      details.simulation = sim;
    }

    if (assignment.category_id) {
      const cat = await AssignmentService.getCategoryDetails(assignment.category_id);
      details.category = cat;
    }

    if (assignment.assignment_type === 'cohort' && assignment.cohort_ids?.length > 0) {
      const cohorts = await AssignmentService.getCohortDetails(assignment.cohort_ids);
      details.cohorts = cohorts;
    }

    const learners = await AssignmentService.getAssignmentLearners(assignment.id);
    details.learnerCount = learners.length;

    setAssignmentDetails(details);
    setLoadingDetails(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!title.trim()) {
      showError('Validation Error', 'Please enter an assignment title');
      return;
    }

    setSubmitting(true);

    try {
      await onUpdate({
        title,
        description,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_published: isPublished
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Assignment</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Update assignment details</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Current Assignment Configuration</h4>
                {loadingDetails ? (
                  <p className="text-sm text-blue-700">Loading assignment details...</p>
                ) : (
                  <div className="space-y-2 text-sm text-blue-800">
                    {assignmentDetails.simulation && (
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span><strong>Simulation:</strong> {assignmentDetails.simulation.display_name || assignmentDetails.simulation.name}</span>
                      </div>
                    )}
                    {assignmentDetails.category && (
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span><strong>Category:</strong> {assignmentDetails.category.name}</span>
                      </div>
                    )}
                    {assignment.assignment_type === 'cohort' && assignmentDetails.cohorts && assignmentDetails.cohorts.length > 0 && (
                      <div className="flex items-start">
                        <UsersRound className="w-4 h-4 mr-2 mt-0.5" />
                        <div>
                          <strong>Cohorts:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {assignmentDetails.cohorts.map((cohort: any) => (
                              <li key={cohort.id}>{cohort.name} ({cohort.member_count || 0} members)</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {assignment.assignment_type === 'individual' && assignment.individual_learner_ids && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span><strong>Individual Learners:</strong> {assignment.individual_learner_ids.length} selected</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span><strong>Assigned Learners:</strong> {assignmentDetails.learnerCount || 0} total</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-blue-700 mt-3 italic">
                  Note: Simulation and cohort assignments cannot be changed. To modify these, please create a new assignment.
                </p>
              </div>
            </div>
          </div>

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
              placeholder="e.g., Communication Skills Assessment"
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
              placeholder="Brief description of this assignment..."
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

          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publish this assignment</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 ml-6">
              Published assignments are visible to assigned learners
            </p>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Assignment'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AssignmentManager;
