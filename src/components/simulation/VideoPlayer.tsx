'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoType?: string;
  onComplete?: () => void;
  onSkip?: () => void;
  autoPlay?: boolean;
  allowSkip?: boolean;
}

export default function VideoPlayer({
  videoUrl,
  videoType = 'video',
  onComplete,
  onSkip,
  autoPlay = true,
  allowSkip = true,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(allowSkip);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err);
        setIsPlaying(false);
      });
    }
  }, [autoPlay]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Check if URL is a YouTube embed
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  // Convert YouTube URLs to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=${autoPlay ? 1 : 0}`;
    }

    return url;
  };

  if (isYouTube) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-black">
        <div className="aspect-video">
          <iframe
            src={getYouTubeEmbedUrl(videoUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              // Assume video will complete after 30 seconds for YouTube embeds
              // In production, you'd want a more sophisticated solution
              if (autoPlay && onComplete) {
                setTimeout(onComplete, 30000);
              }
            }}
          />
        </div>
        {showSkip && onSkip && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={handlePlay}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 transition-colors"
          >
            <Play className="w-12 h-12" />
          </button>
        </div>
      )}

      {showSkip && onSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      )}
    </div>
  );
}
