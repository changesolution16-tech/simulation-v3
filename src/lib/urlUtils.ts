export function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

export function sanitizeVideoUrl(videoUrl: string | null | undefined): string {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return '';
  }

  try {
    return videoUrl.trim();
  } catch (error) {
    console.error('Error sanitizing video URL:', error);
    return '';
  }
}

export function getVideoFilePublicUrl(storagePath: string, storageBucket: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${storagePath}`;
}
