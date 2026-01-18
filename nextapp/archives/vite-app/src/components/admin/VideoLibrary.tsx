import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Video, Plus, Search, Tag, Trash2, Edit, Copy, ExternalLink, CheckCircle, AlertCircle, Link as LinkIcon, FileText, Upload as UploadIcon, Eye, X, AlertTriangle, Users } from 'lucide-react';
import VideoInputSelector from '../video/VideoInputSelector';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import type { VideoInput } from '../../types';

interface VideoLibraryItem {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_platform: string;
  thumbnail_url: string;
  tags: string[];
  video_type: string;
  usage_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

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

const VideoLibrary: React.FC = () => {
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLibraryItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoLibraryItem | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [impactData, setImpactData] = useState<UsageImpact | null>(null);
  const [pendingVideoUpdate, setPendingVideoUpdate] = useState<{ id: string; data: any } | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [realTimeUsageCounts, setRealTimeUsageCounts] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    video_type: 'prompt',
    is_public: false
  });
  const [videoInput, setVideoInput] = useState<VideoInput>({ source: 'url' });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('video_library_usage_summary')
        .select('*')
        .order('video_updated_at', { ascending: false });

      if (fetchError) {
        console.warn('Failed to load from usage_summary, falling back to basic query:', fetchError);
      }

      const usageCounts: Record<string, number> = {};
      if (data) {
        data.forEach((item: any) => {
          usageCounts[item.video_id] = item.total_usage_count || 0;
        });
      }
      setRealTimeUsageCounts(usageCounts);

      const { data: fullData, error: fullError } = await supabase
        .from('video_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (fullError) throw fullError;

      const mergedVideos = (fullData || []).map((video: any) => ({
        ...video,
        usage_count: usageCounts[video.id] || 0
      }));

      setVideos(mergedVideos);
    } catch (err: any) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const detectPlatform = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('loom.com')) return 'loom';
    return 'custom';
  };

  const checkUpdateImpact = async (videoId: string) => {
    setLoadingImpact(true);
    try {
      const { data, error: impactError } = await supabase
        .rpc('preview_video_library_update_impact', { library_video_id: videoId });

      if (impactError) throw impactError;

      if (data && data.length > 0) {
        setImpactData(data[0]);
        return data[0];
      }
      return null;
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
      const platform = detectPlatform(videoInput.url);
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

      if (editingVideo) {
        const updateData = {
          title: formData.title,
          description: formData.description,
          video_url: videoInput.url,
          video_platform: platform,
          video_source: videoInput.source,
          video_file_id: videoInput.fileId || null,
          tags: tagsArray,
          video_type: formData.video_type,
          is_public: formData.is_public
        };

        const urlChanged = editingVideo.video_url !== videoInput.url;

        if (urlChanged) {
          const impact = await checkUpdateImpact(editingVideo.id);

          if (impact && impact.total_scenarios_affected > 0) {
            setPendingVideoUpdate({ id: editingVideo.id, data: updateData });
            setShowImpactModal(true);
            return;
          }
        }

        const { error: updateError } = await supabase
          .from('video_library')
          .update(updateData)
          .eq('id', editingVideo.id);

        if (updateError) throw updateError;
        setSuccess(`Video updated successfully! ${urlChanged ? 'All scenarios using this video have been automatically updated.' : ''}`);
      } else {
        const { data: userData } = await supabase.auth.getUser();

        const { error: insertError } = await supabase
          .from('video_library')
          .insert({
            title: formData.title,
            description: formData.description,
            video_url: videoInput.url,
            video_platform: platform,
            video_source: videoInput.source,
            video_file_id: videoInput.fileId || null,
            tags: tagsArray,
            video_type: formData.video_type,
            is_public: formData.is_public,
            created_by: userData.user?.id
          });

        if (insertError) throw insertError;
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
      const { error: updateError } = await supabase
        .from('video_library')
        .update(pendingVideoUpdate.data)
        .eq('id', pendingVideoUpdate.id);

      if (updateError) throw updateError;

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
      tags: video.tags.join(', '),
      video_type: video.video_type,
      is_public: video.is_public
    });
    setVideoInput({
      source: (video as any).video_source || 'url',
      url: video.video_url,
      fileId: (video as any).video_file_id
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video from the library?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('video_library')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
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
      is_public: false
    });
    setVideoInput({ source: 'url' });
    setEditingVideo(null);
    setShowAddModal(false);
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = filterPlatform === 'all' || video.video_platform === filterPlatform;
    const matchesType = filterType === 'all' || video.video_type === filterType;
    return matchesSearch && matchesPlatform && matchesType;
  });

  const getPlatformBadgeColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      synthesia: 'bg-blue-100 text-blue-800',
      youtube: 'bg-red-100 text-red-800',
      vimeo: 'bg-cyan-100 text-cyan-800',
      loom: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800 dark:text-gray-100'
    };
    return colors[platform] || colors.custom;
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  {(video as any).video_source === 'url' && <LinkIcon className="w-3 h-3" />}
                  {(video as any).video_source === 'embed' && <FileText className="w-3 h-3" />}
                  {(video as any).video_source === 'upload' && <UploadIcon className="w-3 h-3" />}
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
                {(video as any).video_source === 'upload' && (
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
                    placeholder="Brief description of the video content"
                  />
                </div>

                <VideoInputSelector
                  label="Video"
                  value={videoInput}
                  onChange={setVideoInput}
                  required
                  helpText="Choose how to add your video: URL, embed code, or upload a file"
                  category="library"
                />

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="communication, leadership, beginner (comma-separated)"
                  />
                  <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                    Make this video public (visible to all instructors)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingVideo ? 'Update Video' : 'Add to Library'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{previewVideo.title}</h3>
                <p className="text-sm text-gray-500">{previewVideo.description}</p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <SynthesiaPlayer
                videoUrl={previewVideo.video_url}
                videoType={previewVideo.video_type as any}
                testingMode={true}
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-2">Video Details</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Platform:</span> {previewVideo.video_platform}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {previewVideo.video_type}
                  </div>
                  <div>
                    <span className="font-medium">Public:</span> {previewVideo.is_public ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {previewVideo.usage_count} times
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Tags:</span> {previewVideo.tags.join(', ') || 'None'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Added:</span> {new Date(previewVideo.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-700">URL:</span>
                  <p className="text-gray-600 break-all mt-1">{previewVideo.video_url}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImpactModal && impactData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Update Impact Warning</h3>
              </div>
              <button
                onClick={() => {
                  setShowImpactModal(false);
                  setPendingVideoUpdate(null);
                  setImpactData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  This video is currently being used in <strong className="text-blue-600">{impactData.total_scenarios_affected} scenario(s)</strong>.
                  Updating this video URL will <strong>automatically update all scenarios</strong> that reference it.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Automatic Update Feature
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    All scenarios using this video will automatically receive the new video URL. You don't need to manually update each scenario.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Usage Breakdown:</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {impactData.usage_breakdown.introduction_videos > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Introduction Videos:</span> {impactData.usage_breakdown.introduction_videos}
                    </div>
                  )}
                  {impactData.usage_breakdown.prompt_videos > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Prompt Videos:</span> {impactData.usage_breakdown.prompt_videos}
                    </div>
                  )}
                  {impactData.usage_breakdown.scenario_transition_videos > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Transition Videos:</span> {impactData.usage_breakdown.scenario_transition_videos}
                    </div>
                  )}
                  {impactData.usage_breakdown.feedback_beginner_videos > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Beginner Feedback:</span> {impactData.usage_breakdown.feedback_beginner_videos}
                    </div>
                  )}
                  {impactData.usage_breakdown.feedback_intermediate_videos > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Intermediate Feedback:</span> {impactData.usage_breakdown.feedback_intermediate_videos}
                    </div>
                  )}
                  {impactData.usage_breakdown.feedback_advanced_videos > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Advanced Feedback:</span> {impactData.usage_breakdown.feedback_advanced_videos}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Affected Scenarios:</h4>
                <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <ul className="text-xs space-y-1">
                    {impactData.affected_scenario_titles.map((title, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        • {title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowImpactModal(false);
                    setPendingVideoUpdate(null);
                    setImpactData(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpdateWithImpact}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;
