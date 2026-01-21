'use client';

import React, { useState, useEffect } from 'react';
import { Link, FileText, Upload as UploadIcon, CheckCircle, Video } from 'lucide-react';
import VideoEmbedField from './VideoEmbedField';
import FileUpload from './FileUpload';
import type { VideoSource, VideoFile, VideoInput } from '@/types';
import { getVideoFilePublicUrl } from '@/lib/urlUtils';
import VideoLibraryBrowser from './VideoLibraryBrowser';
import type { VideoLibraryItem } from '@/types/video';

interface VideoInputSelectorProps {
  label: string;
  value?: VideoInput;
  onChange: (input: VideoInput) => void;
  videoType?: 'introduction' | 'prompt' | 'feedback' | 'transition';
  required?: boolean;
  helpText?: string;
  category?: string;
  referenceId?: string;
}

const VideoInputSelector: React.FC<VideoInputSelectorProps> = ({
  label,
  value,
  onChange,
  videoType = 'prompt',
  required = false,
  helpText,
  category = 'temp',
  referenceId
}) => {
  const [activeTab, setActiveTab] = useState<VideoSource>(value?.source || 'url');
  const [urlValue, setUrlValue] = useState(value?.url || '');
  const [embedCodeValue, setEmbedCodeValue] = useState(value?.embedCode || '');
  const [uploadedFile, setUploadedFile] = useState<VideoFile | null>(null);
  const [selectedLibraryVideo, setSelectedLibraryVideo] = useState<VideoLibraryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      setActiveTab(value.source);
      if (value.url) setUrlValue(value.url);
      if (value.embedCode) setEmbedCodeValue(value.embedCode);
    }
  }, [value]);

  useEffect(() => {
    if (!value?.libraryId) return;
    if (selectedLibraryVideo?.id === value.libraryId) return;

    let cancelled = false;
    const loadLibraryVideo = async () => {
      try {
        const response = await fetch(`/api/video-library/${value.libraryId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setSelectedLibraryVideo(data);
        }
      } catch (err) {
        console.warn('[VideoInputSelector] Failed to load library video:', err);
      }
    };

    loadLibraryVideo();

    return () => {
      cancelled = true;
    };
  }, [selectedLibraryVideo?.id, value?.libraryId]);

  const handleTabChange = (tab: VideoSource) => {
    setActiveTab(tab);
    setError(null);

    const libraryId = selectedLibraryVideo?.id || value?.libraryId;
    const libraryUrl = selectedLibraryVideo?.video_url || value?.url;
    const libraryFileId = selectedLibraryVideo?.video_file_id || value?.fileId;

    const newInput: VideoInput = {
      source: tab,
      url: tab === 'url' ? urlValue : undefined,
      embedCode: tab === 'embed' ? embedCodeValue : undefined,
      fileId: tab === 'upload' && uploadedFile ? uploadedFile.id : undefined,
      libraryId: tab === 'library' ? libraryId : undefined
    };

    if (tab === 'library') {
      newInput.url = libraryUrl;
      newInput.fileId = libraryFileId ? String(libraryFileId) : undefined;
    }

    onChange(newInput);
  };

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    setError(null);

    const input: VideoInput = {
      source: 'url',
      url: url
    };

    onChange(input);
  };

  const handleEmbedCodeChange = (code: string) => {
    setEmbedCodeValue(code);
    setError(null);

    const input: VideoInput = {
      source: 'embed',
      embedCode: code,
      url: extractUrlFromEmbedCode(code)
    };

    onChange(input);
  };

  const extractUrlFromEmbedCode = (embedCode: string): string | undefined => {
    if (!embedCode || !embedCode.trim().startsWith('<')) {
      return embedCode;
    }

    const srcMatch = embedCode.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }

    return undefined;
  };

  const handleFileUploaded = (videoFile: VideoFile) => {
    setUploadedFile(videoFile);
    setError(null);

    const publicUrl = getVideoFilePublicUrl(videoFile.storage_path, videoFile.storage_bucket);

    const input: VideoInput = {
      source: 'upload',
      fileId: videoFile.id,
      url: publicUrl
    };

    onChange(input);
  };

  const handleFileUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const getInputStatus = (tab: VideoSource): boolean => {
    if (tab === 'url') {
      return !!urlValue && activeTab === 'url';
    } else if (tab === 'embed') {
      return !!embedCodeValue && activeTab === 'embed';
    } else if (tab === 'upload') {
      return !!uploadedFile && activeTab === 'upload';
    } else if (tab === 'library') {
      return !!selectedLibraryVideo && activeTab === 'library';
    }
    return false;
  };

  const handleLibrarySelect = (video: VideoLibraryItem) => {
    setSelectedLibraryVideo(video);
    setError(null);

    const input: VideoInput = {
      source: 'library',
      libraryId: video.id,
      url: video.video_url,
      fileId: video.video_file_id || undefined
    };

    onChange(input);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {helpText && (
          <p className="text-xs text-gray-500 mb-3">{helpText}</p>
        )}

        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-4">
            <button
              type="button"
              onClick={() => handleTabChange('url')}
              className={`relative py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'url'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                <span>URL</span>
                {getInputStatus('url') && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('embed')}
              className={`relative py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'embed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Embed Code</span>
                {getInputStatus('embed') && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('upload')}
              className={`relative py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UploadIcon className="w-4 h-4" />
                <span>Upload File</span>
                {getInputStatus('upload') && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('library')}
              className={`relative py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'library'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>Video Library</span>
                {getInputStatus('library') && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-4">
        {activeTab === 'url' && (
          <div>
            <VideoEmbedField
              label="Video URL"
              value={urlValue}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              required={required}
              videoType={videoType}
              helpText="Enter a direct link to your video from YouTube, Vimeo, Loom, Synthesia, or any video platform"
            />

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">When to use URL:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• You have a video already hosted on YouTube, Vimeo, or another platform</li>
                <li>• You want to share a video from Synthesia or Loom</li>
                <li>• The video is publicly accessible via a direct link</li>
                <li>• You prefer not to store video files in your account</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Embed Code
            </label>
            <textarea
              value={embedCodeValue}
              onChange={(e) => handleEmbedCodeChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='<iframe src="https://www.youtube.com/embed/..." width="560" height="315" frameborder="0" allowfullscreen></iframe>'
            />
            <p className="mt-2 text-xs text-gray-500">
              Paste the complete embed code (iframe) from your video platform
            </p>

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">When to use Embed Code:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• You have an iframe embed code from a video platform</li>
                <li>• The platform provides custom embed settings you want to preserve</li>
                <li>• You copied the embed code from a platform&apos;s share menu</li>
                <li>• You need specific player customizations or parameters</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <FileUpload
              onFileUploaded={handleFileUploaded}
              onError={handleFileUploadError}
              maxFileSizeMB={500}
              category={category}
              referenceId={referenceId}
            />

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">When to upload a file:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• You have a video file on your computer</li>
                <li>• You want full control over video hosting and access</li>
                <li>• The video is not publicly available on other platforms</li>
                <li>• You need the video to be permanently stored in your account</li>
                <li>• You want to ensure the video won&apos;t be removed by external services</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-4">
            <VideoLibraryBrowser
              onSelect={handleLibrarySelect}
              selectedVideoId={selectedLibraryVideo?.id}
              filterByType={videoType}
            />
            {selectedLibraryVideo && (
              <div className="border border-green-200 bg-green-50 rounded-md p-3 text-sm text-green-900">
                Selected: {selectedLibraryVideo.title}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-xs font-medium text-blue-900 mb-2">Comparison of Input Methods:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="text-left py-2 pr-4 text-blue-900 font-medium">Method</th>
                <th className="text-left py-2 pr-4 text-blue-900 font-medium">Pros</th>
                <th className="text-left py-2 text-blue-900 font-medium">Cons</th>
              </tr>
            </thead>
            <tbody className="text-blue-800">
              <tr className="border-b border-blue-100">
                <td className="py-2 pr-4 font-medium">URL</td>
                <td className="py-2 pr-4">Quick, uses existing hosting</td>
                <td className="py-2">Depends on external service</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-2 pr-4 font-medium">Embed Code</td>
                <td className="py-2 pr-4">Preserves platform settings</td>
                <td className="py-2">More complex input format</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Upload File</td>
                <td className="py-2 pr-4">Full control, permanent storage</td>
                <td className="py-2">Uses your storage quota</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VideoInputSelector;
