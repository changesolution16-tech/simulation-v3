'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, ArrowLeft, Eye, Video, Settings, Network } from 'lucide-react';
import Link from 'next/link';
import ScenarioManager from '@/components/admin/ScenarioManager';

interface Simulation {
  id: string;
  display_name: string;
  description?: string;
  difficulty: string;
  category?: string;
  status: string;
  introduction_video_url?: string;
  introduction_video_source?: string;
  estimated_duration_minutes?: number;
  max_hierarchy_level?: number;
}

export default function EditSimulationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'scenarios' | 'settings'>('details');
  const [formData, setFormData] = useState({
    display_name: '',
    description: '',
    difficulty: 'intermediate',
    category: '',
    status: 'draft',
    introduction_video_url: '',
    introduction_video_source: 'url',
    estimated_duration_minutes: 30,
    max_hierarchy_level: 5
  });

  useEffect(() => {
    loadSimulation();
  }, [params.id]);

  const loadSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/simulations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSimulation(data);
        setFormData({
          display_name: data.display_name || '',
          description: data.description || '',
          difficulty: data.difficulty || 'intermediate',
          category: data.category || '',
          status: data.status || 'draft',
          introduction_video_url: data.introduction_video_url || '',
          introduction_video_source: data.introduction_video_source || 'url',
          estimated_duration_minutes: data.estimated_duration_minutes || 30,
          max_hierarchy_level: data.max_hierarchy_level || 5
        });
      } else {
        alert('Failed to load simulation');
        router.push('/admin/simulations');
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
      alert('Failed to load simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/simulations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadSimulation();
        alert('Simulation saved successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save simulation');
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Failed to save simulation');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Link href="/admin/simulations" className="hover:text-blue-600">
            Simulations
          </Link>
          <span>/</span>
          <span>{simulation?.display_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Simulation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure simulation details and manage scenarios
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/simulations/${params.id}/play`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
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
            <Settings className="w-4 h-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'scenarios'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Scenarios
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Video className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Simulation Title *
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty *
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    name="estimated_duration_minutes"
                    value={formData.estimated_duration_minutes}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Introduction Video */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Introduction Video
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Source
                </label>
                <select
                  name="introduction_video_source"
                  value={formData.introduction_video_source}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="url">YouTube/Vimeo URL</option>
                  <option value="embed">Embed Code</option>
                  <option value="file">Upload File</option>
                  <option value="library">From Library</option>
                </select>
              </div>

              {(formData.introduction_video_source === 'url' || formData.introduction_video_source === 'embed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.introduction_video_source === 'url' ? 'Video URL' : 'Embed Code'}
                  </label>
                  <input
                    type="text"
                    name="introduction_video_url"
                    value={formData.introduction_video_url}
                    onChange={handleChange}
                    placeholder={formData.introduction_video_source === 'url'
                      ? 'https://www.youtube.com/watch?v=...'
                      : '<iframe src="..."></iframe>'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.introduction_video_url && formData.introduction_video_source === 'url' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={formData.introduction_video_url.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Scenario Management
            </h2>

            <ScenarioManager simulationId={params.id} />
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Advanced Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Hierarchy Level
                </label>
                <input
                  type="number"
                  name="max_hierarchy_level"
                  value={formData.max_hierarchy_level}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Defines the complexity and depth of decision-making paths (1-10)
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Additional Settings
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Competency weights and mappings</li>
                  <li>• BRAVIN metric configurations</li>
                  <li>• Timer settings per scenario</li>
                  <li>• Completion requirements</li>
                </ul>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
                  These settings can be configured per scenario in the Scenarios tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button (Fixed Bottom) */}
      <div className="sticky bottom-0 mt-8 pt-4 pb-6 bg-gradient-to-t from-white dark:from-gray-900 to-transparent">
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/simulations"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to List
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
