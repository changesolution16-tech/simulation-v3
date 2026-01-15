'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Video, List } from 'lucide-react';
import Link from 'next/link';
import ScenarioOptionsManager from '@/components/admin/ScenarioOptionsManager';

interface Scenario {
  id: string;
  simulation_id?: string;
  scenario_name: string;
  question_text?: string;
  hierarchy_level: number;
  video_url?: string;
  video_source?: string;
  has_timer: boolean;
  timer_seconds?: number;
}

export default function EditScenarioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'options'>('details');

  const [formData, setFormData] = useState({
    scenario_name: '',
    question_text: '',
    hierarchy_level: 1,
    video_url: '',
    video_source: 'youtube',
    has_timer: false,
    timer_seconds: 30,
  });

  useEffect(() => {
    loadScenario();
  }, [params.id]);

  const loadScenario = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scenarios/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setScenario(data);
        setFormData({
          scenario_name: data.scenario_name || data.title || '',
          question_text: data.question_text || '',
          hierarchy_level: data.hierarchy_level || 1,
          video_url: data.video_url || data.prompt_video_url || '',
          video_source: data.video_source || data.prompt_video_source || 'youtube',
          has_timer: data.has_timer || data.timer_enabled || false,
          timer_seconds: data.timer_seconds || data.timer_limit_seconds || 30,
        });
      } else {
        alert('Failed to load scenario');
        router.back();
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
      alert('Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.scenario_name.trim() || !formData.question_text.trim()) {
      alert('Scenario name and question are required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.scenario_name,
          question_text: formData.question_text,
          hierarchy_level: formData.hierarchy_level,
          prompt_video_url: formData.video_url || null,
          prompt_video_source: formData.video_source,
          timer_enabled: formData.has_timer,
          timer_limit_seconds: formData.has_timer ? formData.timer_seconds : null,
        }),
      });

      if (response.ok) {
        await loadScenario();
        alert('Scenario updated successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save scenario');
      }
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Scenario not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const simulationId = scenario.simulation_id;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Scenario</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure scenario details and manage response options
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Video className="w-4 h-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'options'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Response Options
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Scenario Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scenario Name *
                </label>
                <input
                  type="text"
                  name="scenario_name"
                  value={formData.scenario_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Text *
                </label>
                <textarea
                  name="question_text"
                  value={formData.question_text}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy Level
                </label>
                <select
                  name="hierarchy_level"
                  value={formData.hierarchy_level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Level 1 - Entry Level</option>
                  <option value={2}>Level 2 - Associate</option>
                  <option value={3}>Level 3 - Manager</option>
                  <option value={4}>Level 4 - Senior Manager</option>
                  <option value={5}>Level 5 - Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video URL (Optional)
                </label>
                <input
                  type="text"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="has_timer"
                    checked={formData.has_timer}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Timer</span>
                </label>

                {formData.has_timer && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="timer_seconds"
                      value={formData.timer_seconds}
                      onChange={handleChange}
                      min="10"
                      max="300"
                      className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">seconds</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'options' && simulationId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Response Options
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Add the choices learners can select in this scenario. Each option can include feedback and
            lead to another scenario.
          </p>

          <ScenarioOptionsManager scenarioId={params.id} simulationId={simulationId} />
        </div>
      )}
    </div>
  );
}
