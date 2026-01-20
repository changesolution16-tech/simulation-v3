'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
    __youtubeApiPromise?: Promise<void>;
  }
}

interface VideoPlayerProps {
  videoUrl: string;
  videoType?: string;
  videoLibraryId?: string;
  simulationInstanceId?: string;
  scenarioId?: string;
  optionId?: string;
  durationSeconds?: number;
  onComplete?: () => void;
  onSkip?: () => void;
  autoPlay?: boolean;
  allowSkip?: boolean;
}

export default function VideoPlayer({
  videoUrl,
  videoType = 'video',
  videoLibraryId,
  simulationInstanceId,
  scenarioId,
  optionId,
  durationSeconds,
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
  const lastProgressSentRef = useRef(0);
  const autoplaySentRef = useRef(false);
  const metadataSentRef = useRef(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const embedFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const embedStartTimestampRef = useRef<number | null>(null);
  const embedWatchedSecondsRef = useRef(0);
  const youtubePlayerRef = useRef<any>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
  const playerId = useId().replace(/:/g, '-');

  const getPlatform = (url: string): 'youtube' | 'vimeo' | 'loom' | 'synthesia' | 'custom' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('loom.com')) return 'loom';
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    return 'custom';
  };

  const sendEngagement = async (
    eventType: string,
    watchPercentage = 0,
    durationSeconds?: number
  ) => {
    try {
      await fetch('/api/video-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoLibraryId,
          videoUrl,
          simulationInstanceId,
          scenarioId,
          optionId,
          videoType,
          eventType,
          watchPercentage,
          durationSeconds
        }),
        keepalive: true
      });
    } catch (err) {
      console.warn('[VideoPlayer] Failed to send engagement event:', err);
    }
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const stopEmbedFallbackTimer = () => {
    if (embedFallbackTimerRef.current) {
      clearInterval(embedFallbackTimerRef.current);
      embedFallbackTimerRef.current = null;
    }
  };

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
  const getEmbedUrl = (url: string, embedPlayerId?: string): string => {
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
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}&api=1&player_id=${embedPlayerId}`;
      }
    } else if (lowerUrl.includes('player.vimeo.com')) {
      const urlObj = new URL(url);
      if (autoPlay && !urlObj.searchParams.has('autoplay')) {
        urlObj.searchParams.set('autoplay', '1');
      }
      urlObj.searchParams.set('api', '1');
      if (embedPlayerId) {
        urlObj.searchParams.set('player_id', embedPlayerId);
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
  const platform = getPlatform(videoUrl);
  const isYouTube = useEmbedPlayer && platform === 'youtube';
  const isVimeo = useEmbedPlayer && platform === 'vimeo';
  const isTrackedFallbackEmbed = useEmbedPlayer && !isYouTube && !isVimeo;
  const embedUrl = useEmbedPlayer ? getEmbedUrl(videoUrl, playerId) : '';

  useEffect(() => {
    lastProgressSentRef.current = 0;
    embedStartTimestampRef.current = null;
    embedWatchedSecondsRef.current = 0;
    autoplaySentRef.current = false;
    metadataSentRef.current = false;
  }, [videoUrl]);

  useEffect(() => {
    if (autoPlay && videoRef.current && !useEmbedPlayer) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (!autoplaySentRef.current) {
              autoplaySentRef.current = true;
              sendEngagement('play', duration ? (currentTime / duration) * 100 : 0);
            }
          })
          .catch((err) => {
            console.log('Autoplay prevented:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [autoPlay, videoUrl, useEmbedPlayer, duration, currentTime]);

  useEffect(() => {
    return () => {
      stopProgressTimer();
      stopEmbedFallbackTimer();
    };
  }, []);

  useEffect(() => {
    if (!videoLibraryId || durationSeconds || duration > 0) return;
    let cancelled = false;

    const fetchDuration = async () => {
      try {
        const response = await fetch(`/api/video-library/${videoLibraryId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data?.duration_seconds) {
          setDuration(Number(data.duration_seconds));
        }
      } catch (error) {
        console.warn('[VideoPlayer] Unable to fetch duration:', error);
      }
    };

    fetchDuration();

    return () => {
      cancelled = true;
    };
  }, [videoLibraryId, durationSeconds, duration]);

  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    if (!useEmbedPlayer || !isYouTube) return;

    const getYouTubeVideoId = (url: string) => {
      if (url.includes('watch?v=')) {
        return new URL(url).searchParams.get('v') || '';
      }
      if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
      }
      if (url.includes('youtube.com/embed/')) {
        return url.split('youtube.com/embed/')[1]?.split(/[?#]/)[0] || '';
      }
      return '';
    };

    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return;

    const loadYouTubeApi = () => {
      if (window.YT && window.YT.Player) {
        return Promise.resolve();
      }

      if (window.__youtubeApiPromise) {
        return window.__youtubeApiPromise;
      }

      window.__youtubeApiPromise = new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        window.onYouTubeIframeAPIReady = () => resolve();
        document.body.appendChild(script);
      });

      return window.__youtubeApiPromise;
    };

    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT || !window.YT.Player) return;

      youtubePlayerRef.current = new window.YT.Player(playerId, {
        videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          rel: 0,
          enablejsapi: 1,
          controls: 1,
        },
        events: {
          onReady: (event: any) => {
            const durationSeconds = event.target.getDuration?.() || 0;
            setDuration(durationSeconds);
            sendEngagement('metadata', 0, Math.floor(durationSeconds));
          },
          onStateChange: (event: any) => {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const durationSeconds = event.target.getDuration?.() || 0;
              const current = event.target.getCurrentTime?.() || 0;
              sendEngagement('play', durationSeconds ? (current / durationSeconds) * 100 : 0);
              stopProgressTimer();
              progressTimerRef.current = setInterval(() => {
                const currentTime = event.target.getCurrentTime?.() || 0;
                const totalDuration = event.target.getDuration?.() || 0;
                setCurrentTime(currentTime);
                setDuration(totalDuration);
                if (totalDuration > 0 && currentTime - lastProgressSentRef.current >= 15) {
                  lastProgressSentRef.current = currentTime;
                  sendEngagement('progress', (currentTime / totalDuration) * 100);
                }
              }, 15000);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopProgressTimer();
              const durationSeconds = event.target.getDuration?.() || 0;
              const current = event.target.getCurrentTime?.() || 0;
              sendEngagement('pause', durationSeconds ? (current / durationSeconds) * 100 : 0);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopProgressTimer();
              sendEngagement('complete', 100);
              if (onComplete) onComplete();
            }
          }
        }
      });
    });

    return () => {
      cancelled = true;
      stopProgressTimer();
      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
      }
      youtubePlayerRef.current = null;
    };
  }, [autoPlay, isYouTube, onComplete, playerId, videoUrl]);

  useEffect(() => {
    if (!useEmbedPlayer || !isVimeo) return;
    const iframe = vimeoIframeRef.current;
    if (!iframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vimeo.com')) return;
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== 'object') return;
      if (data.player_id && data.player_id !== playerId) return;

      if (data.event === 'play') {
        setIsPlaying(true);
        sendEngagement('play', data.data?.percent ? data.data.percent * 100 : 0);
      }

      if (data.event === 'pause') {
        setIsPlaying(false);
        sendEngagement('pause', data.data?.percent ? data.data.percent * 100 : 0);
      }

      if (data.event === 'ended') {
        setIsPlaying(false);
        sendEngagement('complete', 100);
        if (onComplete) onComplete();
      }

      if (data.event === 'loaded') {
        if (data.data?.duration) {
          setDuration(data.data.duration);
          sendEngagement('metadata', 0, Math.floor(data.data.duration));
        }
      }

      if (data.event === 'timeupdate') {
        const seconds = data.data?.seconds || 0;
        const total = data.data?.duration || duration;
        if (total > 0) {
          setCurrentTime(seconds);
          setDuration(total);
          if (seconds - lastProgressSentRef.current >= 15) {
            lastProgressSentRef.current = seconds;
            sendEngagement('progress', (seconds / total) * 100);
          }
        }
      }
    };

    const post = (method: string, value?: string) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method, value, player_id: playerId }),
        '*'
      );
    };

    const registerEvents = () => {
      ['play', 'pause', 'ended', 'timeupdate', 'loaded'].forEach((eventName) => {
        post('addEventListener', eventName);
      });
    };

    registerEvents();
    iframe.addEventListener('load', registerEvents);
    window.addEventListener('message', handleMessage);

    return () => {
      iframe.removeEventListener('load', registerEvents);
      window.removeEventListener('message', handleMessage);
    };
  }, [duration, isVimeo, onComplete, playerId, useEmbedPlayer]);

  useEffect(() => {
    if (!isTrackedFallbackEmbed) return;

    const effectiveDuration = durationSeconds || duration;
    if (!effectiveDuration || effectiveDuration <= 0) {
      return;
    }

    if (!metadataSentRef.current) {
      metadataSentRef.current = true;
      sendEngagement('metadata', 0, Math.floor(effectiveDuration));
    }

    const tick = () => {
      if (document.hidden) return;
      if (embedStartTimestampRef.current === null) {
        embedStartTimestampRef.current = Date.now();
      }
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - embedStartTimestampRef.current) / 1000);
      const totalWatched = embedWatchedSecondsRef.current + elapsedSeconds;
      const percentage = Math.min(100, (totalWatched / effectiveDuration) * 100);

      if (totalWatched - lastProgressSentRef.current >= 15) {
        lastProgressSentRef.current = totalWatched;
        sendEngagement('progress', percentage, effectiveDuration);
      }

      if (percentage >= 100) {
        stopEmbedFallbackTimer();
        embedWatchedSecondsRef.current = effectiveDuration;
        sendEngagement('complete', 100, effectiveDuration);
        if (onComplete) onComplete();
      }
    };

    stopEmbedFallbackTimer();
    embedFallbackTimerRef.current = setInterval(tick, 15000);

    return () => {
      stopEmbedFallbackTimer();
    };
  }, [duration, durationSeconds, isTrackedFallbackEmbed, onComplete]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      sendEngagement('play', duration ? (currentTime / duration) * 100 : 0);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      sendEngagement('pause', duration ? (currentTime / duration) * 100 : 0);
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
    sendEngagement('complete', 100);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    sendEngagement('skip', duration ? (currentTime / duration) * 100 : 0);
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
      if (duration > 0 && videoRef.current.currentTime - lastProgressSentRef.current >= 15) {
        lastProgressSentRef.current = videoRef.current.currentTime;
        sendEngagement('progress', (videoRef.current.currentTime / duration) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      sendEngagement('metadata', 0, Math.floor(videoRef.current.duration));
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
          {isYouTube ? (
            <div id={playerId} className="w-full h-full" />
          ) : (
            <iframe
              ref={vimeoIframeRef}
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Video player"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ border: 'none' }}
              onLoad={() => {
                if (isTrackedFallbackEmbed) {
                  sendEngagement('play', 0, durationSeconds || duration || undefined);
                  embedStartTimestampRef.current = Date.now();
                } else if (!isVimeo) {
                  sendEngagement('play', 0);
                }
              }}
            />
          )}
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
