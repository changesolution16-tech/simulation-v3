'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Award, TrendingUp, TrendingDown } from 'lucide-react';
import type { Competency } from '@/lib/competencies';

interface CompetencyImpact {
  impact: number;
  description?: string;
}

interface CompetencyImpactEditorProps {
  impacts: { [competencyId: string]: CompetencyImpact };
  onChange: (impacts: { [competencyId: string]: CompetencyImpact }) => void;
  label?: string;
}

const CompetencyImpactEditor: React.FC<CompetencyImpactEditorProps> = ({
  impacts,
  onChange,
  label = 'Competency Impacts'
}) => {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<string>('');
  const [impactValue, setImpactValue] = useState<number>(5);
  const [impactDescription, setImpactDescription] = useState<string>('');

  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    setLoading(true);
    const response = await fetch('/api/competencies');
    if (!response.ok) {
      throw new Error('Failed to load competencies');
    }
    const data = await response.json();
    setCompetencies(data);
    setLoading(false);
  };

  const handleAddImpact = () => {
    if (!selectedCompetency) return;

    const newImpacts = {
      ...impacts,
      [selectedCompetency]: {
        impact: impactValue,
        description: impactDescription || undefined
      }
    };

    onChange(newImpacts);
    setShowAddModal(false);
    setSelectedCompetency('');
    setImpactValue(5);
    setImpactDescription('');
  };

  const handleRemoveImpact = (competencyId: string) => {
    const newImpacts = { ...impacts };
    delete newImpacts[competencyId];
    onChange(newImpacts);
  };

  const handleUpdateImpact = (competencyId: string, field: 'impact' | 'description', value: number | string) => {
    const newImpacts = {
      ...impacts,
      [competencyId]: {
        ...impacts[competencyId],
        [field]: value
      }
    };
    onChange(newImpacts);
  };

  const getCompetencyById = (id: string): Competency | undefined => {
    return competencies.find(c => c.id === id);
  };

  const availableCompetencies = competencies.filter(
    c => !impacts[c.id] && c.competency_level === 2
  );

  const getImpactColor = (impact: number): string => {
    if (impact > 0) return 'text-green-600 bg-green-50';
    if (impact < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="w-4 h-4" />;
    if (impact < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Competency
        </button>
      </div>

      {Object.keys(impacts).length === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded">
          No competencies assigned. Add competencies to track learner skill development.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(impacts).map(([competencyId, impact]) => {
            const competency = getCompetencyById(competencyId);
            if (!competency) return null;

            return (
              <div
                key={competencyId}
                className="border rounded-lg p-4 bg-white space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{competency.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{competency.description}</div>
                      {competency.tags && competency.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {competency.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImpact(competencyId)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impact Value
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={impact.impact}
                        onChange={(e) => handleUpdateImpact(competencyId, 'impact', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${getImpactColor(impact.impact)}`}
                      >
                        {getImpactIcon(impact.impact)}
                        {impact.impact > 0 ? '+' : ''}{impact.impact}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={impact.description || ''}
                      onChange={(e) => handleUpdateImpact(competencyId, 'description', e.target.value)}
                      placeholder="Why this option affects this competency"
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Add Competency Impact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Competency
                </label>
                {loading ? (
                  <div className="text-sm text-gray-500">Loading competencies...</div>
                ) : availableCompetencies.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    All core competencies have been assigned to this option.
                  </div>
                ) : (
                  <select
                    value={selectedCompetency}
                    onChange={(e) => setSelectedCompetency(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Choose a competency...</option>
                    {availableCompetencies.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.code} - {comp.name}
                      </option>
                    ))}
                  </select>
                )}

                {selectedCompetency && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium mb-1">
                      {getCompetencyById(selectedCompetency)?.name}
                    </div>
                    <div className="text-gray-600">
                      {getCompetencyById(selectedCompetency)?.description}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact Value: {impactValue > 0 ? '+' : ''}{impactValue}
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={impactValue}
                  onChange={(e) => setImpactValue(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-10 (Negative)</span>
                  <span>0 (Neutral)</span>
                  <span>+10 (Positive)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={impactDescription}
                  onChange={(e) => setImpactDescription(e.target.value)}
                  placeholder="Explain why this option affects this competency (e.g., 'Demonstrates values-based decision-making under pressure')"
                  rows={3}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddImpact}
                disabled={!selectedCompetency}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Competency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetencyImpactEditor;
