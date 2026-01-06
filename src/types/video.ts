export type VideoSource = 'url' | 'embed' | 'upload' | 'library';

export interface VideoFile {
  id: string;
  original_filename: string;
  storage_path: string;
  storage_bucket: string;
  file_size: number;
  mime_type: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoInput {
  source: VideoSource;
  url?: string;
  embedCode?: string;
  fileId?: string;
  libraryId?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface VideoLibraryItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  video_url: string;
  video_platform: string;
  video_source: string;
  video_type: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  tags: string[];
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
