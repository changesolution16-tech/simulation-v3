'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Upload, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function CreateSimulationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    difficulty: 'intermediate',
    category_id: '',
    status: 'draft',
    introduction_video_url: '',
    introduction_video_type: 'url',
    estimated_duration_minutes: 30
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Auto-generate name from display_name if not set
      const dataToSend = {
        ...formData,
        name: formData.name || formData.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      };

      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/simulations/${data.id}/edit`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create simulation');
      }
    } catch (error) {
      console.error('Error creating simulation:', error);
      alert('Failed to create simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Link href="/admin/simulations" className="hover:text-blue-600">
            Simulations
          </Link>
          <span>/</span>
          <span>Create New</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Simulation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Set up the basic details of your simulation. You can add scenarios after creating it.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            {/* Title */}
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
                placeholder="e.g., Difficult Conversations: Performance Management"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the simulation and what learners will practice..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                placeholder="e.g., Leadership, Communication, Management"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Difficulty & Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level *
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
                  Estimated Duration (minutes)
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
            </div>

            {/* Status */}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                New simulations start as drafts. Publish when ready for learners.
              </p>
            </div>
          </div>
        </div>

        {/* Introduction Video */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Introduction Video
          </h2>

          <div className="space-y-4">
            {/* Video Source Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video Source
              </label>
              <select
                name="introduction_video_type"
                value={formData.introduction_video_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="url">YouTube/Vimeo URL</option>
                <option value="embed">Embed Code</option>
                <option value="file">Upload File</option>
                <option value="library">From Library</option>
              </select>
            </div>

            {/* Video URL/Embed */}
            {(formData.introduction_video_type === 'url' || formData.introduction_video_type === 'embed') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formData.introduction_video_type === 'url' ? 'Video URL' : 'Embed Code'}
                </label>
                <div className="relative">
                  <LinkIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="introduction_video_url"
                    value={formData.introduction_video_url}
                    onChange={handleChange}
                    placeholder={formData.introduction_video_type === 'url'
                      ? 'https://www.youtube.com/watch?v=...'
                      : '<iframe src="..."></iframe>'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.introduction_video_type === 'url'
                    ? 'Supports YouTube and Vimeo URLs'
                    : 'Paste the complete iframe embed code'}
                </p>
              </div>
            )}

            {formData.introduction_video_type === 'library' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You can select a video from the library after creating the simulation in the editor.
                </p>
              </div>
            )}

            {formData.introduction_video_type === 'file' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You can upload videos after creating the simulation in the editor.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/admin/simulations"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 inline mr-2" />
                Create Simulation
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          What happens next?
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• After creating the simulation, you&apos;ll be taken to the editor</li>
          <li>• You can add scenarios and configure branching logic</li>
          <li>• Set up BRAVIN metrics and competencies for each option</li>
          <li>• Preview the simulation before publishing to learners</li>
        </ul>
      </div>
    </div>
  );
}
