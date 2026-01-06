import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Info } from 'lucide-react';

interface VideoDebuggerProps {
  videoUrl: string;
}

const VideoDebugger: React.FC<VideoDebuggerProps> = ({ videoUrl }) => {
  const [testResults, setTestResults] = useState<{
    urlValid: boolean;
    platform: string;
    embedUrl: string;
    currentDomain: string;
  } | null>(null);

  const detectPlatform = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('loom.com')) return 'loom';
    return 'custom';
  };

  const testVideoUrl = () => {
    const platform = detectPlatform(videoUrl);
    const currentDomain = window.location.hostname;

    setTestResults({
      urlValid: !!videoUrl && videoUrl.length > 0,
      platform,
      embedUrl: videoUrl,
      currentDomain
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Video Embed Diagnostics</h3>
        <button
          onClick={testVideoUrl}
          disabled={!videoUrl}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Test Video
        </button>
      </div>

      {!videoUrl && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">Enter a video URL in the field below to test it</p>
        </div>
      )}

      {testResults && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Platform</p>
              <p className="text-sm text-gray-900 capitalize">{testResults.platform}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Current Domain</p>
              <p className="text-sm text-gray-900">{testResults.currentDomain}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Video URL</p>
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
              <code className="text-xs text-gray-800 flex-1 break-all">{testResults.embedUrl}</code>
              <a
                href={testResults.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Live Embed Test</p>
            <div className="relative bg-gray-900 rounded overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                id="test-iframe"
                src={testResults.embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                loading="lazy"
                allow="encrypted-media; fullscreen; microphone"
                allowFullScreen
                title="Video test"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                style={{ border: 'none', padding: 0, margin: 0, overflow: 'hidden' }}
              />
            </div>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  If you see a blank space or error above, Synthesia may be blocking embeds from this domain (<strong>{testResults.currentDomain}</strong>).
                  Try opening the URL in a new tab using the link icon above.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs font-medium text-red-900 mb-2">Common Issue: Domain Restrictions</p>
            <ul className="text-xs text-red-800 space-y-1.5">
              <li>• <strong>Bolt/StackBlitz domains</strong> are often blocked by video platforms</li>
              <li>• Development domains like <code>localhost</code> may be blocked</li>
              <li>• Synthesia videos may be restricted to specific whitelisted domains</li>
              <li>• Check your Synthesia video's "Share Settings" for domain restrictions</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs font-medium text-green-900 mb-2">Solutions:</p>
            <ol className="text-xs text-green-800 space-y-1.5 list-decimal list-inside">
              <li>Contact Synthesia support to whitelist your domain(s)</li>
              <li>In Synthesia, ensure video is set to "Public" or "Unlisted"</li>
              <li>Check if there's an "Allowed Domains" setting in your Synthesia video</li>
              <li>Deploy to a production domain (video platforms often allow production domains)</li>
              <li>Use YouTube or Vimeo as alternatives (they have fewer restrictions)</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs font-medium text-blue-900 mb-2">Testing Checklist:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <span>1.</span>
                <span>Does the URL open in a new browser tab? (Click the link icon above)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>2.</span>
                <span>Do you see the video playing in the embed above?</span>
              </li>
              <li className="flex items-start gap-2">
                <span>3.</span>
                <span>If tab works but embed doesn't = domain restriction issue</span>
              </li>
              <li className="flex items-start gap-2">
                <span>4.</span>
                <span>Check browser console (F12) for any error messages</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDebugger;
