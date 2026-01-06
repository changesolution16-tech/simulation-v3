import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Check, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { VideoFile, UploadProgress } from '../../types';

interface FileUploadProps {
  onFileUploaded: (videoFile: VideoFile) => void;
  onError?: (error: string) => void;
  maxFileSizeMB?: number;
  acceptedFormats?: string[];
  category?: string;
  referenceId?: string;
  optionIndex?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  videoType?: 'introduction' | 'prompt' | 'feedback' | 'transition' | 'supplementary';
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onError,
  maxFileSizeMB = 500,
  acceptedFormats = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg'],
  category = 'temp',
  referenceId,
  optionIndex,
  difficulty,
  videoType
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  });
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<VideoFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload MP4, WebM, MOV, AVI, or OGV files.`;
    }

    if (file.size > maxFileSizeBytes) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of ${maxFileSizeMB}MB.`;
    }

    return null;
  };

  const extractVideoMetadata = (file: File): Promise<{ duration: number; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: Math.floor(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const generateStoragePath = (filename: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 10);
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const refId = referenceId || 'general';

    // Build hierarchical path based on context
    let pathSegments = [category, refId];

    // Add option identifier for feedback videos
    if (videoType === 'feedback' && optionIndex !== undefined) {
      const optionLetter = String.fromCharCode(65 + optionIndex); // 0=A, 1=B, 2=C, 3=D
      pathSegments.push(`option-${optionLetter.toLowerCase()}`);
    }

    // Add video type
    if (videoType) {
      pathSegments.push(videoType);
    }

    // Add difficulty level for feedback videos
    if (videoType === 'feedback' && difficulty) {
      pathSegments.push(difficulty);
    }

    // Construct final path
    const basePath = pathSegments.join('/');
    const finalPath = `${basePath}/${timestamp}_${randomId}_${cleanFilename}`;

    console.log('[FileUpload] Generated storage path:', {
      category,
      referenceId: refId,
      videoType,
      optionIndex,
      difficulty,
      filename: cleanFilename,
      finalPath
    });

    return finalPath;
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadProgress({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading'
      });

      const storagePath = generateStoragePath(file.name);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage,
              status: 'uploading'
            });
          }
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(prev => ({ ...prev, status: 'processing' }));

      let metadata: { duration: number; width: number; height: number };
      try {
        metadata = await extractVideoMetadata(file);
      } catch (metadataError) {
        console.warn('Could not extract video metadata:', metadataError);
        metadata = { duration: 0, width: 0, height: 0 };
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: videoFileData, error: dbError } = await supabase
        .from('video_files')
        .insert({
          original_filename: file.name,
          storage_path: storagePath,
          storage_bucket: 'video-files',
          file_size: file.size,
          mime_type: file.type,
          duration_seconds: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          upload_status: 'completed',
          uploaded_by: user.id,
          is_public: true
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from('video-files').remove([storagePath]);
        throw dbError;
      }

      await supabase.rpc('update_user_storage_usage', { user_id_param: user.id });

      setUploadProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'completed'
      });

      setUploadedFile(videoFileData);
      onFileUploaded(videoFileData);

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload video file';
      setUploadProgress({
        loaded: 0,
        total: 0,
        percentage: 0,
        status: 'error',
        error: errorMessage
      });
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      if (onError) {
        onError(validationError);
      }
      return;
    }

    setSelectedFile(file);

    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    uploadFile(file);
  }, [acceptedFormats, maxFileSizeBytes]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setUploadProgress({
      loaded: 0,
      total: 0,
      percentage: 0,
      status: 'idle'
    });
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : uploadProgress.status === 'completed'
            ? 'border-green-500 bg-green-50'
            : uploadProgress.status === 'error'
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        {uploadProgress.status === 'idle' && (
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop your video file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or
            </p>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Files
            </button>
            <div className="mt-4 text-xs text-gray-500">
              <p>Supported formats: MP4, WebM, MOV, AVI, OGV</p>
              <p>Maximum file size: {maxFileSizeMB}MB</p>
            </div>
          </div>
        )}

        {(uploadProgress.status === 'uploading' || uploadProgress.status === 'processing') && selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <File className="w-10 h-10 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              {uploadProgress.status === 'processing' ? (
                <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <span className="text-sm font-medium text-blue-600">{Math.round(uploadProgress.percentage)}%</span>
              )}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            <p className="text-sm text-center text-gray-600">
              {uploadProgress.status === 'processing'
                ? 'Processing video...'
                : `Uploading... ${formatFileSize(uploadProgress.loaded)} of ${formatFileSize(uploadProgress.total)}`}
            </p>
          </div>
        )}

        {uploadProgress.status === 'completed' && uploadedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <Check className="w-8 h-8" />
              <span className="text-lg font-medium">Upload Complete!</span>
            </div>

            {videoPreview && (
              <div className="relative bg-black rounded-lg overflow-hidden max-w-md mx-auto">
                <video
                  ref={videoPreviewRef}
                  src={videoPreview}
                  controls
                  className="w-full"
                  style={{ maxHeight: '300px' }}
                />
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Filename:</span>
                <span className="text-sm text-gray-900 truncate ml-2">{uploadedFile.original_filename}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">File Size:</span>
                <span className="text-sm text-gray-900">{formatFileSize(uploadedFile.file_size)}</span>
              </div>
              {uploadedFile.duration_seconds && uploadedFile.duration_seconds > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Duration:</span>
                  <span className="text-sm text-gray-900">{formatDuration(uploadedFile.duration_seconds)}</span>
                </div>
              )}
              {uploadedFile.width && uploadedFile.height && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Resolution:</span>
                  <span className="text-sm text-gray-900">{uploadedFile.width} x {uploadedFile.height}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFile}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Upload Different File
            </button>
          </div>
        )}

        {uploadProgress.status === 'error' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
              <AlertCircle className="w-8 h-8" />
              <span className="text-lg font-medium">Upload Failed</span>
            </div>
            <p className="text-sm text-red-600 mb-4">{uploadProgress.error}</p>
            <button
              type="button"
              onClick={handleClearFile}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs font-medium text-blue-900 mb-1">Upload Tips:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• For best results, use MP4 format with H.264 codec</li>
          <li>• Keep file sizes under {maxFileSizeMB}MB for faster uploads</li>
          <li>• Higher resolution videos will take longer to upload</li>
          <li>• Uploaded videos are stored securely in your account</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
