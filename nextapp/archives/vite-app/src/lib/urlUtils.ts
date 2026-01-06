/**
 * URL Sanitization and Validation Utilities
 * Handles URL encoding/decoding issues that can cause errors in video players
 */

/**
 * Safely decodes a URI component, handling errors gracefully
 */
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

/**
 * Safely encodes a URI component
 */
function safeEncodeURIComponent(str: string): string {
  try {
    return encodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

/**
 * Checks if a string appears to be URL encoded
 */
function isUrlEncoded(str: string): boolean {
  try {
    const decoded = decodeURIComponent(str);
    return decoded !== str && decoded.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Removes problematic characters from URLs before processing
 */
function cleanUrlString(url: string): string {
  return url
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a URL by handling various encoding issues
 */
function normalizeUrl(url: string): string {
  let normalized = cleanUrlString(url);

  let maxIterations = 5;
  let iteration = 0;

  while (isUrlEncoded(normalized) && iteration < maxIterations) {
    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
      iteration++;
    } catch (e) {
      break;
    }
  }

  return normalized;
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    const normalized = normalizeUrl(urlString);
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Sanitizes a video URL for safe use in the application
 * Handles encoding issues, special characters, and malformed URLs
 */
export function sanitizeVideoUrl(videoUrl: string | null | undefined): string {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return '';
  }

  try {
    let sanitized = videoUrl.trim();

    if (sanitized === '') {
      return '';
    }

    sanitized = normalizeUrl(sanitized);

    try {
      const urlObj = new URL(sanitized);

      let result = urlObj.protocol + '//' + urlObj.host;

      if (urlObj.pathname) {
        const pathSegments = urlObj.pathname.split('/').map(segment => {
          if (!segment) return segment;
          try {
            return encodeURIComponent(decodeURIComponent(segment));
          } catch (e) {
            try {
              return encodeURIComponent(segment);
            } catch (e2) {
              return segment;
            }
          }
        });
        result += pathSegments.join('/');
      }

      if (urlObj.search) {
        result += urlObj.search;
      }

      if (urlObj.hash) {
        result += urlObj.hash;
      }

      return result;
    } catch (urlError) {
      return sanitized;
    }
  } catch (error) {
    console.error('Error sanitizing video URL:', error);
    return '';
  }
}

/**
 * Validates and sanitizes a video URL before saving to database
 * Returns an object with validation status and sanitized URL
 */
export function validateAndSanitizeVideoUrl(videoUrl: string): {
  isValid: boolean;
  sanitizedUrl: string;
  errorMessage?: string;
} {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return {
      isValid: false,
      sanitizedUrl: '',
      errorMessage: 'URL is required'
    };
  }

  const trimmed = videoUrl.trim();

  if (trimmed === '') {
    return {
      isValid: false,
      sanitizedUrl: '',
      errorMessage: 'URL cannot be empty'
    };
  }

  try {
    const sanitized = sanitizeVideoUrl(trimmed);

    if (!sanitized) {
      return {
        isValid: false,
        sanitizedUrl: '',
        errorMessage: 'Invalid URL format'
      };
    }

    // Validate that it's a proper URL
    if (!isValidUrl(sanitized)) {
      return {
        isValid: false,
        sanitizedUrl: sanitized,
        errorMessage: 'URL must start with http:// or https://'
      };
    }

    return {
      isValid: true,
      sanitizedUrl: sanitized
    };
  } catch (error) {
    return {
      isValid: false,
      sanitizedUrl: '',
      errorMessage: 'Failed to process URL: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

/**
 * Extracts video ID from various video platform URLs
 * Useful for normalizing URLs before storage
 */
export function extractVideoId(url: string, platform: 'youtube' | 'vimeo' | 'loom'): string | null {
  try {
    const sanitized = sanitizeVideoUrl(url);

    switch (platform) {
      case 'youtube': {
        const patterns = [
          /[?&]v=([a-zA-Z0-9_-]{11})/,
          /youtu\.be\/([a-zA-Z0-9_-]{11})/,
          /\/embed\/([a-zA-Z0-9_-]{11})/,
          /\/(v|e)\/([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
          const match = sanitized.match(pattern);
          if (match) {
            return match[1] || match[2];
          }
        }
        return null;
      }

      case 'vimeo': {
        const match = sanitized.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return match ? match[1] : null;
      }

      case 'loom': {
        const match = sanitized.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
}

/**
 * Gets the public URL for a video file stored in Supabase Storage
 */
export function getVideoFilePublicUrl(storagePath: string, bucket: string = 'video-files'): string {
  if (!storagePath) {
    return '';
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('VITE_SUPABASE_URL is not defined');
      return '';
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
  } catch (error) {
    console.error('Error generating public URL:', error);
    return '';
  }
}

/**
 * Determines if a URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return false;

    return url.includes(supabaseUrl) && url.includes('/storage/v1/object/');
  } catch (error) {
    return false;
  }
}

/**
 * Extracts the storage path from a Supabase storage URL
 */
export function extractStoragePathFromUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) {
    return null;
  }

  try {
    const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return null;
  }
}

/**
 * Resolves a video file ID to a public URL by querying the video_files table
 */
export async function resolveVideoFileIdToUrl(fileId: string, supabase: any): Promise<string | null> {
  if (!fileId || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('video_files')
      .select('storage_path, storage_bucket')
      .eq('id', fileId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching video file:', error);
      return null;
    }

    if (!data) {
      console.warn('Video file not found for ID:', fileId);
      return null;
    }

    return getVideoFilePublicUrl(data.storage_path, data.storage_bucket);
  } catch (error) {
    console.error('Error resolving video file ID to URL:', error);
    return null;
  }
}

/**
 * Resolves a video library item to a valid public URL
 * Handles cases where video_url might be null but video_file_id exists
 */
export async function resolveLibraryVideoUrl(
  video: { video_url?: string | null; video_file_id?: string | null },
  supabase: any
): Promise<string | null> {
  if (!video) {
    return null;
  }

  if (video.video_url && video.video_url.trim()) {
    return video.video_url.trim();
  }

  if (video.video_file_id && supabase) {
    console.log('[resolveLibraryVideoUrl] video_url is null/empty, resolving from video_file_id:', video.video_file_id);
    const resolvedUrl = await resolveVideoFileIdToUrl(video.video_file_id, supabase);
    if (resolvedUrl) {
      console.log('[resolveLibraryVideoUrl] Resolved URL:', resolvedUrl);
      return resolvedUrl;
    }
  }

  console.warn('[resolveLibraryVideoUrl] Could not resolve video URL - no video_url or video_file_id available');
  return null;
}

/**
 * Resolves a video URL with priority given to library references
 * This ensures videos from the library are always up-to-date
 *
 * Priority order:
 * 1. video_library_id (always use latest from library)
 * 2. video_file_id (uploaded file)
 * 3. video_url (direct URL fallback)
 *
 * @param videoData Object containing video reference information
 * @param supabase Supabase client instance
 * @returns Resolved video URL or null if not found
 */
export async function resolveVideoUrlWithLibraryPriority(
  videoData: {
    video_url?: string | null;
    video_library_id?: string | null;
    video_file_id?: string | null;
    video_source?: string | null;
  },
  supabase: any
): Promise<string | null> {
  if (!videoData || !supabase) {
    return null;
  }

  // Priority 1: Check if this video comes from the library
  if (videoData.video_library_id && videoData.video_source === 'library') {
    try {
      console.log('[resolveVideoUrlWithLibraryPriority] Fetching video from library:', videoData.video_library_id);

      const { data: libraryVideo, error } = await supabase
        .from('video_library')
        .select('video_url, video_file_id, video_source')
        .eq('id', videoData.video_library_id)
        .maybeSingle();

      if (error) {
        console.error('[resolveVideoUrlWithLibraryPriority] Error fetching library video:', error);
      } else if (libraryVideo) {
        // Recursively resolve the library video URL (handles library videos with file uploads)
        const resolvedUrl = await resolveLibraryVideoUrl(libraryVideo, supabase);
        if (resolvedUrl) {
          console.log('[resolveVideoUrlWithLibraryPriority] Resolved library video URL:', resolvedUrl);
          return resolvedUrl;
        }
      } else {
        console.warn('[resolveVideoUrlWithLibraryPriority] Library video not found, falling back to stored URL');
      }
    } catch (error) {
      console.error('[resolveVideoUrlWithLibraryPriority] Error resolving library video:', error);
    }
  }

  // Priority 2: Check for uploaded file
  if (videoData.video_file_id && (videoData.video_source === 'upload' || videoData.video_source === 'file')) {
    const resolvedUrl = await resolveVideoFileIdToUrl(videoData.video_file_id, supabase);
    if (resolvedUrl) {
      console.log('[resolveVideoUrlWithLibraryPriority] Resolved file ID to URL:', resolvedUrl);
      return resolvedUrl;
    }
  }

  // Priority 3: Fall back to direct URL
  if (videoData.video_url && videoData.video_url.trim()) {
    return videoData.video_url.trim();
  }

  console.warn('[resolveVideoUrlWithLibraryPriority] Could not resolve video URL from any source');
  return null;
}
