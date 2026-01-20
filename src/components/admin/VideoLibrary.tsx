'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit,
  Eye,
  FileText,
  Link as LinkIcon,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload as UploadIcon,
  Users,
  Video,
  X
} from 'lucide-react';
import VideoInputSelector from '../video/VideoInputSelector';
import type { VideoInput } from '@/types';
import type { VideoLibraryItem } from '@/types/video';

interface UsageImpact {
  total_scenarios_affected: number;
  total_options_affected: number;
  affected_scenario_titles: string[];
  usage_breakdown: {
    introduction_videos: number;
    prompt_videos: number;
    scenario_transition_videos: number;
    feedback_beginner_videos: number;
    feedback_intermediate_videos: number;
    feedback_advanced_videos: number;
    option_transition_videos: number;
  };
}

interface TopicOption {
  id: string;
  title: string;
}

interface CompetencyOption {
  id: string;
  code: string;
  name: string;
}

const VideoLibrary: React.FC = () => {
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterCompetency, setFilterCompetency] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLibraryItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoLibraryItem | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [impactData, setImpactData] = useState<UsageImpact | null>(null);
  const [pendingVideoUpdate, setPendingVideoUpdate] = useState<{ id: string; data: any } | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyOption[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    video_type: 'prompt',
    is_public: false,
    topic_ids: [] as string[],
    competency_ids: [] as string[]
  });
  const [videoInput, setVideoInput] = useState<VideoInput>({ source: 'url' });

  useEffect(() => {
    loadVideos();
    loadFilters();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/video-library');
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }
      const data = await response.json();
      setVideos(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [topicsResponse, competenciesResponse] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/competencies')
      ]);

      if (topicsResponse.ok) {
        const data = await topicsResponse.json();
        setTopics(data || []);
      }

      if (competenciesResponse.ok) {
        const data = await competenciesResponse.json();
        setCompetencies((data || []).filter((comp: any) => comp.competency_level === 2));
      }
    } catch (err) {
      console.error('Error loading video library filters:', err);
    }
  };

  const checkUpdateImpact = async (videoId: string) => {
    setLoadingImpact(true);
    try {
      const response = await fetch(`/api/video-library/impact?videoId=${videoId}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.impact || null;
    } catch (err: any) {
      console.error('Error checking impact:', err);
      return null;
    } finally {
      setLoadingImpact(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!videoInput.url) {
      setError('Please provide a video');
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const payload = {
        title: formData.title,
        description: formData.description,
        video_url: videoInput.url,
        video_platform: undefined,
        video_source: videoInput.source,
        video_file_id: videoInput.fileId || null,
        tags: tagsArray,
        video_type: formData.video_type,
        is_public: formData.is_public,
        topic_ids: formData.topic_ids,
        competency_ids: formData.competency_ids
      };

      if (editingVideo) {
        const urlChanged = editingVideo.video_url !== videoInput.url;

        if (urlChanged) {
          const impact = await checkUpdateImpact(editingVideo.id);

          if (impact && (impact.total_scenarios_affected > 0 || impact.total_options_affected > 0)) {
            setPendingVideoUpdate({ id: editingVideo.id, data: payload });
            setImpactData(impact);
            setShowImpactModal(true);
            return;
          }
        }

        const response = await fetch(`/api/video-library/${editingVideo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update video');
        }

        setSuccess(`Video updated successfully! ${urlChanged ? 'All scenarios using this video have been automatically updated.' : ''}`);
      } else {
        const response = await fetch('/api/video-library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add video');
        }

        setSuccess('Video added to library successfully!');
      }

      resetForm();
      await loadVideos();
    } catch (err: any) {
      setError(err.message || 'Failed to save video');
    }
  };

  const confirmUpdateWithImpact = async () => {
    if (!pendingVideoUpdate) return;

    try {
      const response = await fetch(`/api/video-library/${pendingVideoUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingVideoUpdate.data)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update video');
      }

      const affectedCount = (impactData?.total_scenarios_affected || 0) + (impactData?.total_options_affected || 0);
      setSuccess(`Video updated successfully! ${affectedCount} scenario(s) automatically updated with the new video URL.`);
      setShowImpactModal(false);
      setPendingVideoUpdate(null);
      setImpactData(null);
      resetForm();
      await loadVideos();
    } catch (err: any) {
      setError(err.message || 'Failed to update video');
    }
  };

  const handleEdit = (video: VideoLibraryItem) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      tags: (video.tags || []).join(', '),
      video_type: video.video_type,
      is_public: video.is_public,
      topic_ids: video.topic_ids || [],
      competency_ids: video.competency_ids || []
    });
    setVideoInput({
      source: video.video_source || 'url',
      url: video.video_url,
      fileId: video.video_file_id || undefined
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video from the library?')) return;

    try {
      const response = await fetch(`/api/video-library/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete video');
      }
      setSuccess('Video deleted successfully!');
      await loadVideos();
    } catch (err: any) {
      setError(err.message || 'Failed to delete video');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('Video URL copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      tags: '',
      video_type: 'prompt',
      is_public: false,
      topic_ids: [],
      competency_ids: []
    });
    setVideoInput({ source: 'url' });
    setEditingVideo(null);
    setShowAddModal(false);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = filterPlatform === 'all' || video.video_platform === filterPlatform;
    const matchesType = filterType === 'all' || video.video_type === filterType;
    const matchesTopic = filterTopic === 'all' || (video.topic_ids || []).includes(filterTopic);
    const matchesCompetency = filterCompetency === 'all' || (video.competency_ids || []).includes(filterCompetency);
    return matchesSearch && matchesPlatform && matchesType && matchesTopic && matchesCompetency;
  });

  const getPlatformBadgeColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      synthesia: 'bg-blue-100 text-blue-800',
      youtube: 'bg-red-100 text-red-800',
      vimeo: 'bg-cyan-100 text-cyan-800',
      loom: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800 dark:text-gray-100',
      file: 'bg-blue-100 text-blue-800'
    };
    return colors[platform] || colors.custom;
  };

  const getEmbedUrl = (url: string, platform: string) => {
    if (!url) return url;

    switch (platform) {
      case 'youtube': {
        let videoId = url;
        if (url.includes('youtube.com/watch?v=')) {
          videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
        }
        return `https://www.youtube.com/embed/${videoId}`;
      }
      case 'vimeo': {
        const videoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0];
        return `https://player.vimeo.com/video/${videoId}`;
      }
      case 'loom': {
        const videoId = url.split('loom.com/share/')[1]?.split(/[?#]/)[0];
        return `https://www.loom.com/embed/${videoId}`;
      }
      default:
        return url;
    }
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
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Video Library</h2>
            <p className="text-sm text-gray-600 mt-1">Manage reusable video URLs for your scenarios</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Platforms</option>
            <option value="synthesia">Synthesia</option>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="loom">Loom</option>
            <option value="file">Uploaded Files</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="introduction">Introduction</option>
            <option value="prompt">Prompt</option>
            <option value="feedback">Feedback</option>
            <option value="transition">Transition</option>
            <option value="supplementary">Supplementary</option>
          </select>

          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>

          <select
            value={filterCompetency}
            onChange={(e) => setFilterCompetency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Competencies</option>
            {competencies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.code} - {comp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <div key={video.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{video.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getPlatformBadgeColor(video.video_platform)}`}>
                  {video.video_source === 'url' && <LinkIcon className="w-3 h-3" />}
                  {video.video_source === 'embed' && <FileText className="w-3 h-3" />}
                  {video.video_source === 'upload' && <UploadIcon className="w-3 h-3" />}
                  {video.video_platform}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {video.video_type}
                </span>
                {video.is_public && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Public
                  </span>
                )}
                {video.video_source === 'upload' && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Uploaded File
                  </span>
                )}
              </div>

              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {video.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                <div className="flex items-center gap-1">
                  {video.usage_count > 0 ? (
                    <>
                      <Users className="w-3 h-3 text-blue-600" />
                      <span className="font-medium text-blue-600">Used in {video.usage_count} location{video.usage_count !== 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Not used yet</span>
                  )}
                </div>
                <div>Updated: {new Date(video.updated_at).toLocaleDateString()} at {new Date(video.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                {(video.avg_engagement_score || video.avg_completion_rate) && (
                  <div className="flex items-center gap-3">
                    {video.avg_engagement_score !== undefined && (
                      <span>Engagement: {video.avg_engagement_score.toFixed(0)}%</span>
                    )}
                    {video.avg_completion_rate !== undefined && (
                      <span>Completion: {video.avg_completion_rate.toFixed(0)}%</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewVideo(video)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  title="Preview Video"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <button
                  onClick={() => handleCopyUrl(video.video_url)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={() => handleEdit(video)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600">No videos found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or add a new video</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {editingVideo ? 'Edit Video' : 'Add Video to Library'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Welcome Introduction Video"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the video"
                  />
                </div>

                <VideoInputSelector
                  label="Video Source"
                  value={videoInput}
                  onChange={setVideoInput}
                  videoType={formData.video_type as any}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
                  <select
                    multiple
                    value={formData.topic_ids}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                      setFormData({ ...formData, topic_ids: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Cmd/Ctrl to select multiple topics.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competencies</label>
                  <select
                    multiple
                    value={formData.competency_ids}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                      setFormData({ ...formData, competency_ids: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {competencies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.code} - {comp.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Cmd/Ctrl to select multiple competencies.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Type
                  </label>
                  <select
                    value={formData.video_type}
                    onChange={(e) => setFormData({ ...formData, video_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="introduction">Introduction</option>
                    <option value="prompt">Prompt</option>
                    <option value="feedback">Feedback</option>
                    <option value="transition">Transition</option>
                    <option value="supplementary">Supplementary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="comma, separated, tags"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  Make video public
                </label>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {editingVideo ? 'Update Video' : 'Add Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showImpactModal && impactData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xl w-full">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Video Update Impact</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Updating this video will affect {impactData.total_scenarios_affected} scenario(s) and {impactData.total_options_affected} option(s).
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs text-gray-600 mb-4">
                <p className="font-medium mb-2">Usage Breakdown</p>
                <ul className="space-y-1">
                  <li>Introduction videos: {impactData.usage_breakdown.introduction_videos}</li>
                  <li>Prompt videos: {impactData.usage_breakdown.prompt_videos}</li>
                  <li>Scenario transitions: {impactData.usage_breakdown.scenario_transition_videos}</li>
                  <li>Feedback (beginner): {impactData.usage_breakdown.feedback_beginner_videos}</li>
                  <li>Feedback (intermediate): {impactData.usage_breakdown.feedback_intermediate_videos}</li>
                  <li>Feedback (advanced): {impactData.usage_breakdown.feedback_advanced_videos}</li>
                  <li>Option transitions: {impactData.usage_breakdown.option_transition_videos}</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowImpactModal(false);
                    setPendingVideoUpdate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpdateWithImpact}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Update Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{previewVideo.title}</h3>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {previewVideo.video_platform === 'file' || previewVideo.video_platform === 'custom' ? (
                <video src={previewVideo.video_url} controls className="w-full h-full" autoPlay />
              ) : (
                <iframe
                  src={getEmbedUrl(previewVideo.video_url, previewVideo.video_platform)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;
