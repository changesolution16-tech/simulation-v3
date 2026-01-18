import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Award, Save, X } from 'lucide-react';
import { CompetencyService, Competency, ProficiencyLevel } from '../../lib/competencies';
import { useSimulationStore } from '../../store';

const CompetencyManager: React.FC = () => {
  const { currentUser } = useSimulationStore();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<Competency>>({
    code: '',
    name: '',
    description: '',
    parent_competency_id: undefined,
    competency_level: 1,
    proficiency_levels: [
      { level: 1, name: 'Awareness', description: 'Basic understanding' },
      { level: 2, name: 'Developing', description: 'Can perform with guidance' },
      { level: 3, name: 'Proficient', description: 'Can perform independently' },
      { level: 4, name: 'Advanced', description: 'Can teach others' },
      { level: 5, name: 'Expert', description: 'Recognized authority' }
    ],
    industry_standard: '',
    tags: []
  });

  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    console.log('[CompetencyManager] Loading competencies...');
    setLoading(true);
    const data = await CompetencyService.getAll();
    console.log('[CompetencyManager] Received data:', data);
    console.log('[CompetencyManager] Data length:', data?.length || 0);
    setCompetencies(data);
    setLoading(false);
    console.log('[CompetencyManager] Loading complete, state updated');
  };

  const handleCreate = () => {
    setEditingCompetency(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_competency_id: undefined,
      competency_level: 1,
      proficiency_levels: [
        { level: 1, name: 'Awareness', description: 'Basic understanding' },
        { level: 2, name: 'Developing', description: 'Can perform with guidance' },
        { level: 3, name: 'Proficient', description: 'Can perform independently' },
        { level: 4, name: 'Advanced', description: 'Can teach others' },
        { level: 5, name: 'Expert', description: 'Recognized authority' }
      ],
      industry_standard: '',
      tags: []
    });
    setShowCreateModal(true);
  };

  const handleEdit = (competency: Competency) => {
    setEditingCompetency(competency);
    setFormData(competency);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert('Please fill in required fields');
      return;
    }

    if (editingCompetency) {
      await CompetencyService.update(editingCompetency.id, formData);
    } else {
      await CompetencyService.create(formData);
    }

    setShowCreateModal(false);
    loadCompetencies();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competency?')) return;

    await CompetencyService.delete(id);
    loadCompetencies();
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const updateProficiencyLevel = (index: number, field: keyof ProficiencyLevel, value: string | number) => {
    const newLevels = [...(formData.proficiency_levels || [])];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setFormData({ ...formData, proficiency_levels: newLevels });
  };

  const addProficiencyLevel = () => {
    const currentLevels = formData.proficiency_levels || [];
    const nextLevel = currentLevels.length + 1;
    setFormData({
      ...formData,
      proficiency_levels: [
        ...currentLevels,
        { level: nextLevel, name: '', description: '' }
      ]
    });
  };

  const removeProficiencyLevel = (index: number) => {
    const newLevels = (formData.proficiency_levels || []).filter((_, i) => i !== index);
    setFormData({ ...formData, proficiency_levels: newLevels });
  };

  const renderCompetencyTree = (parentId?: string | null, level = 0) => {
    const children = competencies.filter(c =>
      parentId === undefined || parentId === null
        ? (c.parent_competency_id === null || c.parent_competency_id === undefined)
        : c.parent_competency_id === parentId
    );
    console.log(`[CompetencyManager] renderCompetencyTree(parentId=${parentId}, level=${level}), found ${children.length} children`);

    return children.map(competency => (
      <div key={competency.id} style={{ marginLeft: `${level * 24}px` }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              {competencies.some(c => c.parent_competency_id === competency.id) && (
                <button
                  onClick={() => toggleExpand(competency.id)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {expandedIds.has(competency.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              <Award className="w-5 h-5 text-blue-600 mr-3" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{competency.name}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {competency.code}
                  </span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Level {competency.competency_level}
                  </span>
                </div>
                {competency.description && (
                  <p className="text-sm text-gray-600 mt-1">{competency.description}</p>
                )}
                {competency.tags && competency.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {competency.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleEdit(competency)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(competency.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {expandedIds.has(competency.id) && renderCompetencyTree(competency.id, level + 1)}
      </div>
    ));
  };

  console.log('[CompetencyManager] Rendering, loading:', loading, 'competencies count:', competencies.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Competency Management</h2>
          <p className="text-gray-600 mt-1">
            Define and organize the skills and competencies tracked across simulations
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Competency
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-600">Total Competencies</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{competencies.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-600">Root Competencies</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {competencies.filter(c => !c.parent_competency_id).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {competencies.filter(c => c.is_active).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <div className="text-gray-600">With Standards</div>
            <div className="text-2xl font-bold text-blue-600">
              {competencies.filter(c => c.industry_standard).length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {competencies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Award className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600">No competencies defined yet</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first competency
            </button>
          </div>
        ) : (
          renderCompetencyTree()
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {editingCompetency ? 'Edit Competency' : 'Create New Competency'}
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., COMM-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <input
                      type="number"
                      value={formData.competency_level || 1}
                      onChange={(e) => setFormData({ ...formData, competency_level: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Active Listening"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe this competency..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Competency
                  </label>
                  <select
                    value={formData.parent_competency_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_competency_id: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None (Root Competency)</option>
                    {competencies.filter(c => c.id !== editingCompetency?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry Standard
                  </label>
                  <input
                    type="text"
                    value={formData.industry_standard || ''}
                    onChange={(e) => setFormData({ ...formData, industry_standard: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ISO 9001, SHRM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(formData.tags || []).join(', ')}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="communication, soft-skills, leadership"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Proficiency Levels
                    </label>
                    <button
                      onClick={addProficiencyLevel}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Level
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.proficiency_levels || []).map((level, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="w-16">
                          <input
                            type="number"
                            value={level.level}
                            onChange={(e) => updateProficiencyLevel(index, 'level', parseInt(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={level.name}
                            onChange={(e) => updateProficiencyLevel(index, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                            placeholder="Level name"
                          />
                          <input
                            type="text"
                            value={level.description}
                            onChange={(e) => updateProficiencyLevel(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Level description"
                          />
                        </div>
                        {(formData.proficiency_levels || []).length > 1 && (
                          <button
                            onClick={() => removeProficiencyLevel(index)}
                            className="text-red-600 hover:text-red-700 mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingCompetency ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetencyManager;
