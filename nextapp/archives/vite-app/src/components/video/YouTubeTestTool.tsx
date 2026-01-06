import React, { useState } from 'react';
import { Youtube, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

const YouTubeTestTool: React.FC = () => {
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<{
    videoId: string | null;
    embedUrl: string | null;
    isValid: boolean;
    error: string | null;
    urlType: string | null;
  } | null>(null);

  const extractYouTubeVideoId = (url: string): { videoId: string | null; urlType: string | null } => {
    const cleanUrl = url.trim();

    const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return { videoId: watchMatch[1], urlType: 'Watch URL (youtube.com/watch?v=...)' };
    }

    const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
      return { videoId: shortMatch[1], urlType: 'Short URL (youtu.be/...)' };
    }

    const embedMatch = cleanUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      return { videoId: embedMatch[1], urlType: 'Embed URL (youtube.com/embed/...)' };
    }

    const vMatch = cleanUrl.match(/\/(v|e)\/([a-zA-Z0-9_-]{11})/);
    if (vMatch) {
      return { videoId: vMatch[2], urlType: 'V/E URL (youtube.com/v/ or /e/...)' };
    }

    return { videoId: null, urlType: null };
  };

  const testYouTubeUrl = () => {
    if (!testUrl) {
      setTestResult({
        videoId: null,
        embedUrl: null,
        isValid: false,
        error: 'Please enter a YouTube URL',
        urlType: null
      });
      return;
    }

    const { videoId, urlType } = extractYouTubeVideoId(testUrl);

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0`;

      setTestResult({
        videoId,
        embedUrl,
        isValid: true,
        error: null,
        urlType
      });
    } else {
      setTestResult({
        videoId: null,
        embedUrl: null,
        isValid: false,
        error: 'Could not extract valid YouTube video ID from URL',
        urlType: null
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sampleUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/v/dQw4w9WgXcQ'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <Youtube className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">YouTube Video Tester</h2>
          <p className="text-sm text-gray-600">Test and validate YouTube video URLs</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter YouTube URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testYouTubeUrl()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={testYouTubeUrl}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Test URL
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Sample URLs to try:</p>
          <div className="grid grid-cols-1 gap-2">
            {sampleUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setTestUrl(url)}
                className="text-left px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {url}
              </button>
            ))}
          </div>
        </div>
      </div>

      {testResult && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${
            testResult.isValid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.isValid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Valid YouTube URL</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-900">Invalid URL</span>
                </>
              )}
            </div>
            {testResult.error && (
              <p className="text-sm text-red-700">{testResult.error}</p>
            )}
          </div>

          {testResult.isValid && testResult.videoId && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-600 mb-1">Video ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900">{testResult.videoId}</code>
                    <button
                      onClick={() => copyToClipboard(testResult.videoId!)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Copy Video ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-600 mb-1">URL Type</p>
                  <p className="text-sm text-gray-900">{testResult.urlType}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">Generated Embed URL</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(testResult.embedUrl!)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <a
                      href={testResult.embedUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>
                  </div>
                </div>
                <code className="text-xs font-mono text-gray-700 break-all block">{testResult.embedUrl}</code>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Live Preview</p>
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={testResult.embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title="YouTube video test"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900">Troubleshooting Tips:</p>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                      <li>If the video doesn't load above, check if the video is private or deleted</li>
                      <li>Some videos have embedding disabled by the owner</li>
                      <li>Age-restricted videos may not embed properly</li>
                      <li>Try opening the embed URL in a new tab to see detailed error messages</li>
                      <li>Current domain: <strong>{window.location.hostname}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-xs font-medium text-amber-900 mb-2">Supported YouTube URL Formats:</p>
        <ul className="text-xs text-amber-800 space-y-1">
          <li>• <code>https://www.youtube.com/watch?v=VIDEO_ID</code></li>
          <li>• <code>https://youtu.be/VIDEO_ID</code></li>
          <li>• <code>https://www.youtube.com/embed/VIDEO_ID</code></li>
          <li>• <code>https://www.youtube.com/v/VIDEO_ID</code></li>
          <li>• URLs with additional parameters (will extract video ID)</li>
        </ul>
      </div>
    </div>
  );
};

export default YouTubeTestTool;
