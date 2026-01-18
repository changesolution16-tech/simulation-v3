import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Video, Play, Eye, Trash2, Edit2, Plus, X,
  Youtube, Star, Clock, TrendingUp, CheckCircle, AlertCircle
} from 'lucide-react';
import { VideoService, VideoLibraryItem, VideoPlatform, VideoType } from '../../lib/videoService';

interface EnhancedVideoLibraryBrowserProps {
  onSelectVideo?: (video: VideoLibraryItem) => void;
  onClose?: () => void;
  allowMultiple?: boolean;
  filterVideoType?: VideoType;
  filterDifficulty?: string;
  mode?: 'select' | 'manage';
}

const EnhancedVideoLibraryBrowser: React.FC<EnhancedVideoLibraryBrowserProps> = ({
  onSelectVideo,
  onClose,
  allowMultiple = false,
  filterVideoType,
  filterDifficulty,
  mode = 'select'
}) => {
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [previewVideo, setPreviewVideo] = useState<VideoLibraryItem | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<VideoPlatform | ''>('');
  const [videoTypeFilter, setVideoTypeFilter] = useState<VideoType | ''>(filterVideoType || '');
  const [difficultyFilter, setDifficultyFilter] = useState(filterDifficulty || '');
  const [sortBy, setSortBy] = useState<'usage' | 'recent' | 'engagement' | 'alphabetical'>('usage');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [searchTerm, platformFilter, videoTypeFilter, difficultyFilter]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await VideoService.getVideoLibrary({
        platform: platformFilter || undefined,
        videoType: videoTypeFilter || undefined,
        difficulty: difficultyFilter || undefined,
        searchTerm: searchTerm || undefined,
        limit: 100
      });
      setVideos(sortVideos(data));
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortVideos = (videoList: VideoLibraryItem[]) => {
    const sorted = [...videoList];
    switch (sortBy) {
      case 'usage':
        return sorted.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
      case 'recent':
        return sorted.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'engagement':
        return sorted.sort((a, b) =>
          (b.avg_engagement_score || 0) - (a.avg_engagement_score || 0)
        );
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const handleSelectVideo = (video: VideoLibraryItem) => {
    if (mode === 'manage') {
      setPreviewVideo(video);
      return;
    }

    if (allowMultiple) {
      const newSelected = new Set(selectedVideos);
      if (newSelected.has(video.id)) {
        newSelected.delete(video.id);
      } else {
        newSelected.add(video.id);
      }
      setSelectedVideos(newSelected);
    } else {
      if (onSelectVideo) {
        onSelectVideo(video);
      }
      if (onClose) {
        onClose();
      }
    }
  };

  const handleConfirmSelection = () => {
    if (allowMultiple && onSelectVideo) {
      selectedVideos.forEach(videoId => {
        const video = videos.find(v => v.id === videoId);
        if (video) onSelectVideo(video);
      });
    }
    if (onClose) {
      onClose();
    }
  };

  const getPlatformIcon = (platform: VideoPlatform) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'vimeo':
      case 'loom':
      case 'synthesia':
        return <Video className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = sortVideos(videos);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Video Library</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search videos by title or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform
                    </label>
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value as VideoPlatform | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Platforms</option>
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="loom">Loom</option>
                      <option value="synthesia">Synthesia</option>
                      <option value="file">Uploaded Files</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {!filterVideoType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Type
                      </label>
                      <select
                        value={videoTypeFilter}
                        onChange={(e) => setVideoTypeFilter(e.target.value as VideoType | '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Types</option>
                        <option value="introduction">Introduction</option>
                        <option value="prompt">Prompt</option>
                        <option value="feedback">Feedback</option>
                        <option value="transition">Transition</option>
                        <option value="supplementary">Supplementary</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="all">All Levels</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="usage">Most Used</option>
                      <option value="recent">Most Recent</option>
                      <option value="engagement">Highest Engagement</option>
                      <option value="alphabetical">Alphabetical</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Video className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">No videos found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                    selectedVideos.has(video.id)
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectVideo(video)}
                >
                  <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center group">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {selectedVideos.has(video.id) && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration_seconds)}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                        {video.title}
                      </h3>
                      {video.is_public && (
                        <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {video.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {getPlatformIcon(video.video_platform)}
                        {video.video_platform}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                        {video.video_type}
                      </span>
                      {video.difficulty && video.difficulty !== 'all' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs capitalize">
                          {video.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {video.usage_count || 0} uses
                          </span>
                          {video.avg_engagement_score && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {video.avg_engagement_score.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewVideo(video);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated: {new Date(video.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {(allowMultiple || mode === 'select') && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              {allowMultiple && selectedVideos.size > 0 ? (
                <span>{selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected</span>
              ) : (
                <span>{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} available</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {allowMultiple && (
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedVideos.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select Videos
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {previewVideo && (
        <VideoPreviewModal
          video={previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </div>
  );
};

interface VideoPreviewModalProps {
  video: VideoLibraryItem;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ video, onClose }) => {
  const embedUrl = VideoService.getEmbedUrl(
    video.video_url,
    video.video_platform,
    video.embed_parameters
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{video.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="aspect-video bg-black">
            {video.video_platform === 'file' || video.video_platform === 'custom' ? (
              <video
                src={video.video_url}
                controls
                className="w-full h-full"
                autoPlay
              />
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          <div className="p-6">
            {video.description && (
              <p className="text-gray-700 mb-4">{video.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Platform</p>
                <p className="font-medium capitalize">{video.video_platform}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{video.video_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">
                  {Math.floor((video.duration_seconds || 0) / 60)}:{((video.duration_seconds || 0) % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Usage Count</p>
                <p className="font-medium">{video.usage_count || 0} times</p>
              </div>
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {video.avg_engagement_score && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">
                    Avg Engagement: <strong>{video.avg_engagement_score.toFixed(1)}%</strong>
                  </span>
                </div>
                {video.avg_completion_rate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">
                      Completion Rate: <strong>{video.avg_completion_rate.toFixed(1)}%</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedVideoLibraryBrowser;
