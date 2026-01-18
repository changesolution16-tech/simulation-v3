'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Upload, Trash2, RefreshCw, Eye, Edit, X, Video as VideoIcon, Layers } from 'lucide-react';

interface ScenarioVideo {
  id: string;
  scenario_id: string;
  scenario_title?: string;
  video_type: 'introduction' | 'prompt' | 'transition' | 'feedback' | 'conclusion';
  video_url: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
}

interface Scenario {
  id: string;
  title: string;
  difficulty: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<ScenarioVideo[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [videoType, setVideoType] = useState<'introduction' | 'prompt' | 'transition' | 'feedback' | 'conclusion'>('prompt');
  const [videoDifficulty, setVideoDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [videoUrl, setVideoUrl] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<ScenarioVideo | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'library'>('manage');

  useEffect(() => {
    loadVideos();
    loadScenarios();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/scenarios?include_videos=true');
      if (response.ok) {
        const scenariosData = await response.json();

        const videosList: ScenarioVideo[] = [];
        scenariosData.forEach((scenario: any) => {
          if (scenario.introduction_video_url) {
            videosList.push({
              id: `${scenario.id}-introduction`,
              scenario_id: scenario.id,
              scenario_title: scenario.title,
              video_type: 'introduction',
              video_url: scenario.introduction_video_url,
              created_at: scenario.created_at
            });
          }
          if (scenario.prompt_video_url) {
            videosList.push({
              id: `${scenario.id}-prompt`,
              scenario_id: scenario.id,
              scenario_title: scenario.title,
              video_type: 'prompt',
              video_url: scenario.prompt_video_url,
              created_at: scenario.created_at
            });
          }
          if (scenario.transition_video_url) {
            videosList.push({
              id: `${scenario.id}-transition`,
              scenario_id: scenario.id,
              scenario_title: scenario.title,
              video_type: 'transition',
              video_url: scenario.transition_video_url,
              created_at: scenario.created_at
            });
          }
        });

        setVideos(videosList);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await fetch('/api/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const handleSaveVideo = async () => {
    if (!videoUrl || !selectedScenario || !videoType) {
      setSaveError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updateData: any = {};

      if (videoType === 'prompt') {
        updateData.prompt_video_url = videoUrl;
      } else if (videoType === 'transition') {
        updateData.transition_video_url = videoUrl;
      } else if (videoType === 'introduction') {
        updateData.introduction_video_url = videoUrl;
      }

      const response = await fetch(`/api/scenarios/${selectedScenario}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setSaveSuccess(`${videoType.charAt(0).toUpperCase() + videoType.slice(1)} video saved successfully!`);
        await loadVideos();
        setVideoUrl('');
        setSelectedScenario('');
        setVideoType('prompt');
        setEditingVideo(null);
      } else {
        const error = await response.json();
        setSaveError(error.error || 'Failed to save video');
      }
    } catch (error: any) {
      console.error('Error saving video:', error);
      setSaveError(error.message || 'Failed to save video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: ScenarioVideo) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const updateData: any = {};

      if (video.video_type === 'introduction') {
        updateData.introduction_video_url = null;
      } else if (video.video_type === 'prompt') {
        updateData.prompt_video_url = null;
      } else if (video.video_type === 'transition') {
        updateData.transition_video_url = null;
      }

      const response = await fetch(`/api/scenarios/${video.scenario_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadVideos();
        setSaveSuccess('Video deleted successfully!');
      } else {
        const error = await response.json();
        setSaveError(error.error || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      setSaveError('Failed to delete video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (video: ScenarioVideo) => {
    setEditingVideo(video);
    setSelectedScenario(video.scenario_id);
    setVideoType(video.video_type);
    setVideoUrl(video.video_url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Video Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage videos for scenarios and simulations</p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="inline w-4 h-4 mr-2" />
            Manage Videos
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'library'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Layers className="inline w-4 h-4 mr-2" />
            Video Library ({videos.length})
          </button>
        </nav>
      </div>

      {activeTab === 'manage' ? (
        <>
          {saveError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{saveError}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-300">{saveSuccess}</p>
            </div>
          )}

          {editingVideo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Editing Video</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">{editingVideo.scenario_title} - {editingVideo.video_type}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingVideo(null);
                    setSelectedScenario('');
                    setVideoType('prompt');
                    setVideoUrl('');
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {editingVideo ? 'Update Video' : 'Add Video URL'}
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scenario <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="scenario"
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a scenario...</option>
                    {scenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.title} ({scenario.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="introduction">Introduction</option>
                    <option value="prompt">Prompt (Scenario Introduction)</option>
                    <option value="transition">Transition (Between Scenarios)</option>
                    <option value="feedback">Feedback (After Option Selection)</option>
                    <option value="conclusion">Conclusion (Final Summary)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="videoUrl"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4 or YouTube URL"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter a direct video URL or YouTube link
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSaveVideo}
                  disabled={!videoUrl || !selectedScenario || uploading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {editingVideo ? 'Update Video' : 'Save Video'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">All Videos</h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Scenario
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Video URL
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {videos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <VideoIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                        <p>No videos uploaded yet</p>
                        <button
                          onClick={() => setActiveTab('manage')}
                          className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Upload your first video
                        </button>
                      </td>
                    </tr>
                  ) : (
                    videos.map((video) => (
                      <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{video.scenario_title || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            video.video_type === 'prompt'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : video.video_type === 'introduction'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : video.video_type === 'transition'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {video.video_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                          >
                            {video.video_url}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(video)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit video"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(video)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
