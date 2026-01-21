'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, UserPlus, X, Search, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useSession } from 'next-auth/react';

interface Cohort {
  id: string;
  name: string;
  description?: string | null;
  instructor_id?: string | null;
  member_count?: number;
}

interface CohortMember {
  learner_id: string;
  joined_at?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  organization?: string | null;
  department?: string | null;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  institution?: string | null;
}

const CohortManager: React.FC = () => {
  const { data: session } = useSession();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadCohorts();
    }
  }, [session?.user?.id]);

  const loadCohorts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cohorts');
      if (!response.ok) {
        throw new Error('Failed to load cohorts');
      }
      const data = await response.json();
      setCohorts(data || []);
    } catch (err: any) {
      console.error('Error loading cohorts:', err);
      setError(err.message || 'Failed to load cohorts');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/cohorts/${cohortId}`);
      if (!response.ok) {
        throw new Error('Failed to load cohort members');
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err: any) {
      console.error('Error loading cohort members:', err);
      setError(err.message || 'Failed to load cohort members');
    }
  };

  const handleCreateCohort = async (cohortData: Partial<Cohort>) => {
    setError(null);
    try {
      const response = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cohortData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create cohort');
      }
      await loadCohorts();
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating cohort:', err);
      setError(err.message || 'Failed to create cohort');
    }
  };

  const handleDeleteCohort = async (cohortId: string) => {
    if (!confirm('Are you sure you want to delete this cohort?')) return;
    setError(null);
    try {
      const response = await fetch(`/api/cohorts/${cohortId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete cohort');
      }
      await loadCohorts();
      if (selectedCohort?.id === cohortId) {
        setSelectedCohort(null);
        setMembers([]);
      }
    } catch (err: any) {
      console.error('Error deleting cohort:', err);
      setError(err.message || 'Failed to delete cohort');
    }
  };

  const handleSelectCohort = async (cohort: Cohort) => {
    setSelectedCohort(cohort);
    await loadMembers(cohort.id);
  };

  const handleRemoveMember = async (cohortId: string, learnerId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/cohorts/${cohortId}/members?learner_ids=${learnerId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }
      await loadMembers(cohortId);
      await loadCohorts();
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleAddMembers = async (learnerIds: string[]) => {
    if (!selectedCohort) return;
    setError(null);
    try {
      const response = await fetch(`/api/cohorts/${selectedCohort.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learner_ids: learnerIds })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add members');
      }
      await loadMembers(selectedCohort.id);
      await loadCohorts();
      setShowAddMemberModal(false);
    } catch (err: any) {
      console.error('Error adding members:', err);
      setError(err.message || 'Failed to add members');
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cohort Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize learners into groups for efficient training assignment
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Cohort
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Cohorts</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {cohorts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No cohorts yet</p>
                  <p className="text-sm mt-1">Create your first cohort to get started</p>
                </div>
              ) : (
                cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    onClick={() => handleSelectCohort(cohort)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                      selectedCohort?.id === cohort.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{cohort.name}</h3>
                        {cohort.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cohort.description}</p>
                        )}
                        <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{cohort.member_count || 0} members</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCohort(cohort.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedCohort ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedCohort.name}</h2>
                    {selectedCohort.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedCohort.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Members
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Members ({members.length})
                </h3>
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No members in this cohort</p>
                      <p className="text-sm mt-1">Add learners to start assigning training</p>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.learner_id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {member.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(selectedCohort.id, member.learner_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a Cohort</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a cohort from the list to view and manage its members
              </p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateCohortModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCohort}
        />
      )}

      {showAddMemberModal && selectedCohort && (
        <AddMemberModal
          cohort={selectedCohort}
          existingMembers={members}
          onClose={() => setShowAddMemberModal(false)}
          onAddMembers={handleAddMembers}
        />
      )}
    </div>
  );
};

interface CreateCohortModalProps {
  onClose: () => void;
  onCreate: (data: Partial<Cohort>) => void;
}

const CreateCohortModal: React.FC<CreateCohortModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      description
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Cohort</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cohort Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="e.g., Leadership Training Spring 2024"
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
              placeholder="Brief description of this cohort..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Cohort
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

interface AddMemberModalProps {
  cohort: Cohort;
  existingMembers: CohortMember[];
  onClose: () => void;
  onAddMembers: (learnerIds: string[]) => Promise<void>;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ cohort, existingMembers, onClose, onAddMembers }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'select' | 'csv'>('select');
  const [csvError, setCsvError] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, allUsers]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/instructor/learners?limit=500');
      if (!response.ok) {
        throw new Error('Failed to load learners');
      }
      const users = await response.json();
      setAllUsers(users || []);
    } catch (err) {
      console.error('Error loading learners:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const existingMemberIds = new Set(existingMembers.map(m => m.learner_id));

    let filtered = allUsers.filter(user => !existingMemberIds.has(user.id));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.institution?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.size === 0) return;

    setSubmitting(true);
    await onAddMembers(Array.from(selectedUserIds));
    setSubmitting(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const emails = results.data
          .map((row: any) => row.email?.trim().toLowerCase())
          .filter((email): email is string => !!email);

        if (emails.length === 0) {
          setCsvError('No valid email addresses found in CSV file');
          return;
        }

        const matchedUserIds = allUsers
          .filter(user => emails.includes(user.email.toLowerCase()))
          .map(user => user.id);

        if (matchedUserIds.length === 0) {
          setCsvError('No matching users found for the emails in the CSV');
          return;
        }

        setSelectedUserIds(new Set(matchedUserIds));
        setCsvError('');
        setUploadMode('select');
      },
      error: (error) => {
        setCsvError(`Error parsing CSV: ${error.message}`);
      }
    });

    e.target.value = '';
  };

  const availableCount = Math.max(allUsers.length - existingMembers.length, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Members to {cohort.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {availableCount} {availableCount === 1 ? 'learner' : 'learners'} available to add
          </p>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setUploadMode('select')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                uploadMode === 'select'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Select Individually
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('csv')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                uploadMode === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Upload CSV
            </button>
          </div>

          {uploadMode === 'select' ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or institution..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload CSV (with email column)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {csvError && (
                <p className="text-sm text-red-600">{csvError}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
          {uploadMode === 'select' && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredUsers.length} learner{filteredUsers.length !== 1 ? 's' : ''} available
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedUserIds.size === filteredUsers.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
          )}

          <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No learners found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                        {user.institution && ` • ${user.institution}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
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
              disabled={submitting || selectedUserIds.size === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : `Add ${selectedUserIds.size} Member(s)`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CohortManager;
