'use client';

import React, { useState, useEffect } from 'react';
import { Search, Video, CheckCircle, Loader, Link as LinkIcon, FileText, Upload as UploadIcon, Filter } from 'lucide-react';
import type { VideoLibraryItem } from '@/types/video';

interface VideoLibraryBrowserProps {
  onSelect: (video: VideoLibraryItem) => void;
  selectedVideoId?: string;
  filterByTopic?: string;
  filterByType?: 'introduction' | 'prompt' | 'feedback' | 'transition' | 'supplementary';
  showAllTopics?: boolean;
}

const VideoLibraryBrowser: React.FC<VideoLibraryBrowserProps> = ({
  onSelect,
  selectedVideoId,
  filterByTopic,
  filterByType,
  showAllTopics = false
}) => {
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<boolean>(!showAllTopics);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, [filterByTopic, filterByType, topicFilter]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filterByType) {
        params.append('type', filterByType);
      }

      if (topicFilter && filterByTopic) {
        params.append('topic', filterByTopic);
      }

      const response = await fetch(`/api/video-library?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load videos from library');
      }

      const data = await response.json();
      setVideos(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load videos from library');
      console.error('Error loading library videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPlatform = platformFilter === 'all' || video.video_platform === platformFilter;

    return matchesSearch && matchesPlatform;
  });

  const getPlatformBadgeColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      synthesia: 'bg-blue-100 text-blue-800',
      youtube: 'bg-red-100 text-red-800',
      vimeo: 'bg-cyan-100 text-cyan-800',
      loom: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[platform] || colors.custom;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'url':
        return <LinkIcon className="w-3 h-3" />;
      case 'embed':
        return <FileText className="w-3 h-3" />;
      case 'upload':
        return <UploadIcon className="w-3 h-3" />;
      default:
        return <LinkIcon className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-600">Loading video library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={loadVideos}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos by title, description, or tags..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {filterByTopic && (
            <button
              type="button"
              onClick={() => setTopicFilter(!topicFilter)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                topicFilter
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {topicFilter ? 'Topic Filter: ON' : 'Topic Filter: OFF'}
            </button>
          )}

          <span className="text-sm text-gray-600 ml-auto">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {showFilters && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Platforms</option>
              <option value="synthesia">Synthesia</option>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="loom">Loom</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        )}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No videos found</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm
              ? 'Try adjusting your search or filters'
              : topicFilter
              ? 'No videos match this topic. Try disabling the topic filter.'
              : 'Add videos to your library to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
          {filteredVideos.map((video) => (
            <button
              key={video.id}
              type="button"
              onClick={() => onSelect(video)}
              className={`text-left p-3 border-2 rounded-lg transition-all hover:shadow-md ${
                selectedVideoId === video.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                      {video.title}
                    </h4>
                    {selectedVideoId === video.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>

                  {video.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getPlatformBadgeColor(video.video_platform)}`}>
                      {getSourceIcon(video.video_source)}
                      {video.video_platform}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {video.video_type}
                    </span>
                    {video.usage_count > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Used {video.usage_count}x
                      </span>
                    )}
                  </div>

                  {video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          +{video.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoLibraryBrowser;
