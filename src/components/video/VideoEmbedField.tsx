'use client';

import React, { useState, useEffect } from 'react';
import { Video, ExternalLink, CheckCircle, AlertCircle, Loader, Eye } from 'lucide-react';
import { sanitizeVideoUrl, isValidUrl } from '@/lib/urlUtils';

interface VideoEmbedFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  videoType?: 'introduction' | 'prompt' | 'feedback' | 'transition';
}

interface VideoMetadata {
  platform: 'synthesia' | 'youtube' | 'vimeo' | 'loom' | 'custom';
  embedUrl: string;
  isValid: boolean;
  thumbnail?: string;
}

const VideoEmbedField: React.FC<VideoEmbedFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://share.synthesia.io/...',
  required = false,
  helpText,
  videoType = 'prompt'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(value);
    if (value) {
      validateUrl(value);
    }
  }, [value]);

  const detectPlatform = (url: string): VideoMetadata['platform'] => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('loom.com')) return 'loom';
    return 'custom';
  };

  const convertToEmbedUrl = (url: string, platform: VideoMetadata['platform']): string => {
    try {
      switch (platform) {
        case 'synthesia':
          return url;

        case 'youtube': {
          const patterns = [
            { regex: /[?&]v=([a-zA-Z0-9_-]{11})/, index: 1 },
            { regex: /youtu\.be\/([a-zA-Z0-9_-]{11})/, index: 1 },
            { regex: /\/embed\/([a-zA-Z0-9_-]{11})/, index: 1 },
            { regex: /\/(v|e)\/([a-zA-Z0-9_-]{11})/, index: 2 }
          ];

          for (const { regex, index } of patterns) {
            const match = url.match(regex);
            if (match) {
              const videoId = match[index];
              return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
            }
          }
          return url;
        }

        case 'vimeo': {
          const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
          if (match && match[1]) {
            return `https://player.vimeo.com/video/${match[1]}`;
          }
          return url;
        }

        case 'loom': {
          const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
          if (match && match[1]) {
            return `https://www.loom.com/embed/${match[1]}`;
          }
          return url;
        }

        default:
          return url;
      }
    } catch (error) {
      return url;
    }
  };

  const extractUrlFromEmbedCode = (input: string): string | null => {
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('<')) {
      const iframeSrcRegex = /src=["']([^"']+)["']/i;
      const match = trimmedInput.match(iframeSrcRegex);
      if (match && match[1]) {
        return sanitizeVideoUrl(match[1]);
      }
      return null;
    }

    return sanitizeVideoUrl(trimmedInput);
  };

  const validateUrl = async (input: string) => {
    if (!input || input.trim() === '') {
      setMetadata(null);
      setValidationError(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const extractedUrl = extractUrlFromEmbedCode(input);

      if (!extractedUrl) {
        throw new Error('Could not extract video URL from embed code');
      }

      if (!isValidUrl(extractedUrl)) {
        throw new Error('Invalid URL format. URL must start with http:// or https://');
      }

      const platform = detectPlatform(extractedUrl);
      const embedUrl = convertToEmbedUrl(extractedUrl, platform);

      if (extractedUrl !== input) {
        setLocalValue(extractedUrl);
        onChange(extractedUrl);
      }

      setMetadata({
        platform,
        embedUrl,
        isValid: true
      });

      setValidationError(null);
    } catch (error: any) {
      setValidationError(error.message || 'Invalid video URL or embed code');
      setMetadata(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
    if (localValue) {
      validateUrl(localValue);
    }
  };

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    if (newValue === '') {
      setMetadata(null);
      setValidationError(null);
      onChange('');
    }
  };

  const getPlatformLabel = (platform: VideoMetadata['platform']) => {
    const labels = {
      synthesia: 'Synthesia',
      youtube: 'YouTube',
      vimeo: 'Vimeo',
      loom: 'Loom',
      custom: 'Custom'
    };
    return labels[platform];
  };

  const getPlatformColor = (platform: VideoMetadata['platform']) => {
    const colors = {
      synthesia: 'bg-blue-100 text-blue-800',
      youtube: 'bg-red-100 text-red-800',
      vimeo: 'bg-cyan-100 text-cyan-800',
      loom: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[platform];
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <Video className="inline w-4 h-4 mr-1" />
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          rows={localValue.includes('<') ? 4 : 1}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
            validationError
              ? 'border-red-300 bg-red-50'
              : metadata?.isValid
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300'
          }`}
          placeholder={placeholder}
          style={{ minHeight: '42px' }}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isValidating && <Loader className="w-4 h-4 text-gray-400 animate-spin" />}
          {!isValidating && validationError && <AlertCircle className="w-4 h-4 text-red-500" />}
          {!isValidating && metadata?.isValid && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
      </div>

      {validationError && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{validationError}</p>
        </div>
      )}

      {metadata?.isValid && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Valid video URL detected</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPlatformColor(metadata.platform)}`}>
                    {getPlatformLabel(metadata.platform)}
                  </span>
                  {metadata.embedUrl !== localValue && (
                    <span className="text-xs text-gray-500">
                      Auto-converted to embed format
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-3 h-3" />
              {showPreview ? 'Hide' : 'Preview'}
            </button>
          </div>

          {showPreview && (
            <div className="p-3 bg-white border border-gray-200 rounded-md">
              <p className="text-xs font-medium text-gray-700 mb-2">Video Preview</p>
              <div className="relative bg-gray-900 rounded overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={metadata.embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="Video preview"
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{ border: 'none', padding: 0, margin: 0, overflow: 'hidden' }}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ExternalLink className="w-3 h-3 text-gray-400" />
                <a
                  href={localValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
                >
                  {localValue}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs font-medium text-blue-900 mb-2">Supported Input Formats:</p>
        <ul className="text-xs text-blue-800 space-y-1 mb-3">
          <li>• <strong>Direct video URLs:</strong> https://your-cdn.com/video.mp4</li>
          <li>• <strong>Embed URLs:</strong> https://share.synthesia.io/...</li>
          <li>• <strong>Platform URLs:</strong> https://youtube.com/watch?v=...</li>
          <li>• <strong>Embed codes:</strong> Paste the entire &lt;iframe&gt; code</li>
        </ul>
        <p className="text-xs font-medium text-blue-900 mb-1">Supported Platforms:</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Direct Files (MP4/WebM)</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Synthesia</span>
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">YouTube</span>
          <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded">Vimeo</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Loom</span>
        </div>
      </div>
    </div>
  );
};

export default VideoEmbedField;
