'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react';

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
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect if URL is an embeddable video platform URL or direct video file
  const isEmbedUrl = (url: string): boolean => {
    const embedPatterns = [
      'youtube.com/embed/',
      'youtube.com/watch',
      'youtu.be/',
      'player.vimeo.com',
      'vimeo.com/',
      'loom.com/embed',
      'loom.com/share',
      'synthesia.io',
      'share.synthesia.io',
    ];
    return embedPatterns.some(pattern => url.toLowerCase().includes(pattern));
  };

  // Convert various video URLs to embed format
  const getEmbedUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase();

    // YouTube
    if (lowerUrl.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&enablejsapi=1&rel=0`;
      }
    } else if (lowerUrl.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&enablejsapi=1&rel=0`;
      }
    } else if (lowerUrl.includes('youtube.com/embed/')) {
      // Already in embed format, just add autoplay parameter if needed
      const urlObj = new URL(url);
      if (autoPlay && !urlObj.searchParams.has('autoplay')) {
        urlObj.searchParams.set('autoplay', '1');
      }
      return urlObj.toString();
    }

    // Vimeo
    if (lowerUrl.includes('vimeo.com/') && !lowerUrl.includes('player.vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}`;
      }
    } else if (lowerUrl.includes('player.vimeo.com')) {
      const urlObj = new URL(url);
      if (autoPlay && !urlObj.searchParams.has('autoplay')) {
        urlObj.searchParams.set('autoplay', '1');
      }
      return urlObj.toString();
    }

    // Loom
    if (lowerUrl.includes('loom.com/share/')) {
      const videoId = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)?.[1];
      if (videoId) {
        return `https://www.loom.com/embed/${videoId}`;
      }
    } else if (lowerUrl.includes('loom.com/embed/')) {
      return url;
    }

    // Synthesia or other platforms - use as-is
    return url;
  };

  const useEmbedPlayer = isEmbedUrl(videoUrl);
  const embedUrl = useEmbedPlayer ? getEmbedUrl(videoUrl) : '';

  useEffect(() => {
    if (autoPlay && videoRef.current && !useEmbedPlayer) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log('Autoplay prevented:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [autoPlay, videoUrl, useEmbedPlayer]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleError = () => {
    setError('Unable to load video. Please check the video URL or try a different format.');
    console.error('Video loading error:', videoRef.current?.error);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-red-500 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-300">{error}</p>
            {allowSkip && onSkip && (
              <button
                onClick={handleSkip}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Continue Anyway
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render iframe for embedded video platforms (YouTube, Vimeo, Synthesia, etc.)
  if (useEmbedPlayer) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-black">
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title="Video player"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: 'none' }}
          />
        </div>
        {allowSkip && onSkip && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors z-20"
            aria-label="Skip video"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        )}
      </div>
    );
  }

  // Render HTML5 video player for direct video files
  return (
    <div
      ref={containerRef}
      className="relative rounded-lg overflow-hidden bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        playsInline
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>

      {/* Large Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
          <button
            onClick={handlePlay}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 transition-all transform hover:scale-110"
            aria-label="Play video"
          >
            <Play className="w-12 h-12" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Skip Button */}
      {allowSkip && onSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors z-20"
          aria-label="Skip video"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      )}

      {/* Custom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="hover:text-blue-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" fill="currentColor" />}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="hover:text-blue-400 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            {/* Time Display */}
            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-blue-400 transition-colors"
              aria-label="Toggle fullscreen"
            >
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
