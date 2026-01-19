'use client';

import React, { useState, useEffect } from 'react';
import { Target, Plus, X, AlertCircle, Star, TrendingUp } from 'lucide-react';
import type { Competency } from '@/lib/competencies';
import type {
  ScenarioTargetedCompetencyWithDetails,
  DevelopmentPriority,
  CompetencySelectionData
} from '@/lib/scenarioCompetencies';

interface ScenarioCompetencySelectorProps {
  scenarioId: string;
  onCompetenciesChanged?: (competencies: ScenarioTargetedCompetencyWithDetails[]) => void;
}

const ScenarioCompetencySelector: React.FC<ScenarioCompetencySelectorProps> = ({
  scenarioId,
  onCompetenciesChanged
}) => {
  const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
  const [targetedCompetencies, setTargetedCompetencies] = useState<ScenarioTargetedCompetencyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [selectedCompetencyId, setSelectedCompetencyId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [developmentPriority, setDevelopmentPriority] = useState<DevelopmentPriority>('secondary');
  const [targetWeight, setTargetWeight] = useState(1.0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [scenarioId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [competencies, targeted] = await Promise.all([
        fetch('/api/competencies').then(async (res) => {
          if (!res.ok) {
            throw new Error('Failed to load competencies');
          }
          return res.json();
        }),
        fetch(`/api/scenarios/${scenarioId}/competencies`).then(async (res) => {
          if (!res.ok) {
            throw new Error('Failed to load targeted competencies');
          }
          return res.json();
        })
      ]);

      setAllCompetencies(competencies.filter(c => c.competency_level === 2));
      setTargetedCompetencies(targeted);
    } catch (error) {
      console.error('Error loading competencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetency = async () => {
    if (!selectedCompetencyId) return;

    const alreadyTargeted = targetedCompetencies.some(
      tc => tc.competency_id === selectedCompetencyId
    );

    if (alreadyTargeted) {
      alert('This competency is already targeted');
      return;
    }

    const newTargeted: CompetencySelectionData[] = [
      ...targetedCompetencies.map(tc => ({
        competency_id: tc.competency_id,
        target_weight: tc.target_weight,
        is_primary: tc.is_primary,
        development_priority: tc.development_priority,
        notes: tc.notes
      })),
      {
        competency_id: selectedCompetencyId,
        target_weight: targetWeight,
        is_primary: isPrimary,
        development_priority: developmentPriority,
        notes: notes || undefined
      }
    ];

    setSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/competencies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTargeted)
      });

      if (response.ok) {
        await loadData();
        resetForm();
        if (onCompetenciesChanged) {
          const updated = await response.json();
          onCompetenciesChanged(updated);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update competencies');
      }
    } catch (error) {
      console.error('Error adding competency:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCompetency = async (competencyId: string) => {
    const remaining = targetedCompetencies.filter(
      tc => tc.competency_id !== competencyId
    );

    setSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/competencies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          remaining.map(tc => ({
            competency_id: tc.competency_id,
            target_weight: tc.target_weight,
            is_primary: tc.is_primary,
            development_priority: tc.development_priority,
            notes: tc.notes
          }))
        )
      });

      if (response.ok) {
        await loadData();
        if (onCompetenciesChanged) {
          const updated = await response.json();
          onCompetenciesChanged(updated);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update competencies');
      }
    } catch (error) {
      console.error('Error removing competency:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCompetencyId('');
    setIsPrimary(false);
    setDevelopmentPriority('secondary');
    setTargetWeight(1.0);
    setNotes('');
    setShowAddForm(false);
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-green-100 text-green-800',
      supplementary: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const availableCompetencies = allCompetencies.filter(
    comp => !targetedCompetencies.some(tc => tc.competency_id === comp.id)
  );

  const primaryCount = targetedCompetencies.filter(tc => tc.is_primary).length;
  const coveragePercentage = allCompetencies.length > 0
    ? (targetedCompetencies.length / allCompetencies.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Target Competencies for This Scenario
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            Select which competencies this scenario is designed to develop. These will be used for automatic metric mapping.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Competency
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Coverage</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(coveragePercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${coveragePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {targetedCompetencies.length} of {allCompetencies.length} competencies targeted
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Primary Focus</span>
            <span className="text-sm font-bold text-green-600">{primaryCount}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-600">
              {primaryCount} primary competenc{primaryCount !== 1 ? 'ies' : 'y'}
            </span>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Competency *
              </label>
              <select
                value={selectedCompetencyId}
                onChange={(e) => setSelectedCompetencyId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a competency...</option>
                {availableCompetencies.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.code} - {comp.name}
                  </option>
                ))}
              </select>
              {selectedCompetencyId && (
                <p className="text-xs text-gray-600 mt-1">
                  {allCompetencies.find(c => c.id === selectedCompetencyId)?.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={developmentPriority}
                  onChange={(e) => setDevelopmentPriority(e.target.value as DevelopmentPriority)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="supplementary">Supplementary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target Weight: {(targetWeight * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is-primary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is-primary" className="ml-2 text-xs text-gray-700 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Mark as primary competency (main focus of scenario)
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why is this competency targeted in this scenario?"
                rows={2}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddCompetency}
                disabled={!selectedCompetencyId || saving}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Competency'}
              </button>
              <button
                onClick={resetForm}
                disabled={saving}
                className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {targetedCompetencies.length === 0 && !showAddForm && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No competencies targeted yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Add competencies to define what skills this scenario develops
          </p>
        </div>
      )}

      {targetedCompetencies.length > 0 && (
        <div className="space-y-2">
          {targetedCompetencies
            .sort((a, b) => {
              if (a.is_primary && !b.is_primary) return -1;
              if (!a.is_primary && b.is_primary) return 1;
              return a.competency_name.localeCompare(b.competency_name);
            })
            .map((targeted) => (
              <div
                key={targeted.id}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {targeted.is_primary && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      <h5 className="text-sm font-semibold text-gray-900">
                        {targeted.competency_code} - {targeted.competency_name}
                      </h5>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(targeted.development_priority)}`}>
                        {targeted.development_priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{targeted.competency_description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Weight: {(targeted.target_weight * 100).toFixed(0)}%
                      </span>
                      {targeted.notes && (
                        <span className="italic">&quot;{targeted.notes}&quot;</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCompetency(targeted.competency_id)}
                    disabled={saving}
                    className="text-red-600 hover:text-red-800 p-1 ml-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {targetedCompetencies.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Next:</strong> Select metrics to assess for this scenario. The system will automatically map these metrics to your targeted competencies.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScenarioCompetencySelector;
