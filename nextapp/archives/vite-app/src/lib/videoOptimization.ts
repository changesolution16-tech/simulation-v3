import { VideoPlatform } from './videoService';

interface VideoLoadOptions {
  preload?: 'none' | 'metadata' | 'auto';
  lazy?: boolean;
  priority?: 'high' | 'low' | 'auto';
}

export class VideoOptimization {
  private static videoCache = new Map<string, HTMLVideoElement>();
  private static observerInstance: IntersectionObserver | null = null;

  static getOptimizedEmbedUrl(
    url: string,
    platform: VideoPlatform,
    embedParams: Record<string, any> = {}
  ): string {
    const params = {
      autoplay: embedParams.autoplay ? 1 : 0,
      controls: embedParams.controls !== false ? 1 : 0,
      muted: embedParams.muted ? 1 : 0,
      loop: embedParams.loop ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      ...embedParams
    };

    switch (platform) {
      case 'youtube': {
        let videoId = url;
        if (url.includes('youtube.com/watch?v=')) {
          videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
        }
        const queryParams = new URLSearchParams({
          autoplay: params.autoplay.toString(),
          controls: params.controls.toString(),
          mute: params.muted.toString(),
          loop: params.loop.toString(),
          modestbranding: params.modestbranding.toString(),
          rel: params.rel.toString(),
          enablejsapi: '1'
        });
        return `https://www.youtube-nocookie.com/embed/${videoId}?${queryParams.toString()}`;
      }

      case 'vimeo': {
        const videoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0];
        const queryParams = new URLSearchParams({
          autoplay: params.autoplay.toString(),
          muted: params.muted.toString(),
          loop: params.loop.toString(),
          dnt: '1',
          quality: 'auto'
        });
        return `https://player.vimeo.com/video/${videoId}?${queryParams.toString()}`;
      }

      case 'loom': {
        const videoId = url.split('loom.com/share/')[1]?.split(/[?#]/)[0];
        return `https://www.loom.com/embed/${videoId}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;
      }

      default:
        return url;
    }
  }

  static createLazyLoadObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    if (this.observerInstance) {
      return this.observerInstance;
    }

    this.observerInstance = new IntersectionObserver(
      (entries) => {
        callback(entries);
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    return this.observerInstance;
  }

  static lazyLoadVideo(element: HTMLIFrameElement | HTMLVideoElement): void {
    const observer = this.createLazyLoadObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLIFrameElement | HTMLVideoElement;

          if (target instanceof HTMLIFrameElement) {
            const dataSrc = target.getAttribute('data-src');
            if (dataSrc && !target.src) {
              target.src = dataSrc;
            }
          } else if (target instanceof HTMLVideoElement) {
            const dataSrc = target.getAttribute('data-src');
            if (dataSrc && !target.src) {
              target.src = dataSrc;
              target.load();
            }
          }

          observer.unobserve(target);
        }
      });
    });

    observer.observe(element);
  }

  static preloadVideo(url: string, platform: VideoPlatform): void {
    if (platform === 'file') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      this.videoCache.set(url, video);
    }
  }

  static getVideoFromCache(url: string): HTMLVideoElement | null {
    return this.videoCache.get(url) || null;
  }

  static clearVideoCache(): void {
    this.videoCache.forEach((video) => {
      video.pause();
      video.src = '';
      video.load();
    });
    this.videoCache.clear();
  }

  static getThumbnailUrl(url: string, platform: VideoPlatform): string {
    switch (platform) {
      case 'youtube': {
        let videoId = url;
        if (url.includes('youtube.com/watch?v=')) {
          videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
        }
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }

      case 'vimeo': {
        const videoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0];
        return `https://vumbnail.com/${videoId}.jpg`;
      }

      default:
        return '';
    }
  }

  static setupVideoErrorHandling(
    element: HTMLIFrameElement | HTMLVideoElement,
    onError: (error: Error) => void
  ): void {
    const errorHandler = (event: Event) => {
      const error = new Error('Video failed to load');
      console.error('Video load error:', error, event);
      onError(error);
    };

    element.addEventListener('error', errorHandler);

    if (element instanceof HTMLVideoElement) {
      element.addEventListener('stalled', () => {
        console.warn('Video playback stalled');
      });

      element.addEventListener('waiting', () => {
        console.log('Video buffering...');
      });
    }
  }

  static applyVideoLoadOptions(
    element: HTMLVideoElement,
    options: VideoLoadOptions = {}
  ): void {
    const { preload = 'metadata', lazy = true } = options;

    element.preload = preload;
    element.playsInline = true;

    if (lazy) {
      const originalSrc = element.src;
      element.removeAttribute('src');
      element.setAttribute('data-src', originalSrc);
      this.lazyLoadVideo(element);
    }
  }

  static async estimateBandwidth(): Promise<'slow' | 'medium' | 'fast'> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      if (connection.effectiveType === '4g') {
        return 'fast';
      } else if (connection.effectiveType === '3g') {
        return 'medium';
      } else {
        return 'slow';
      }
    }

    return 'medium';
  }

  static async getOptimalVideoQuality(): Promise<'low' | 'medium' | 'high'> {
    const bandwidth = await this.estimateBandwidth();

    switch (bandwidth) {
      case 'fast':
        return 'high';
      case 'medium':
        return 'medium';
      case 'slow':
        return 'low';
    }
  }
}

export default VideoOptimization;
