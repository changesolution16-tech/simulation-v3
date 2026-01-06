'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
  maxFileSizeMB?: number;
  category?: string;
  referenceId?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onError,
  currentImageUrl,
  maxFileSizeMB = 10,
  category = 'simulation-images',
  referenceId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  });
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentImageUrl || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload JPG, PNG, GIF, or WebP images.`;
    }

    if (file.size > maxFileSizeBytes) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of ${maxFileSizeMB}MB.`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadProgress({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading'
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (referenceId) formData.append('referenceId', referenceId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      setUploadProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'completed'
      });

      setUploadedUrl(data.url);
      onImageUploaded(data.url);

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload image file';
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
    setImagePreview(previewUrl);

    uploadFile(file);
  }, [maxFileSizeBytes]);

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
    setImagePreview(null);
    setUploadProgress({
      loaded: 0,
      total: 0,
      percentage: 0,
      status: 'idle'
    });
    setUploadedUrl(null);
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
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : uploadProgress.status === 'completed'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : uploadProgress.status === 'error'
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:border-gray-400'
        }`}
      >
        {uploadProgress.status === 'idle' && !currentImageUrl && (
          <div className="text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drag and drop an image here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              or
            </p>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Files
            </button>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>Supported formats: JPG, PNG, GIF, WebP</p>
              <p>Maximum file size: {maxFileSizeMB}MB</p>
              <p>Recommended: 1200x600px or larger</p>
            </div>
          </div>
        )}

        {uploadProgress.status === 'idle' && currentImageUrl && !selectedFile && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Image:</p>
            <img
              src={currentImageUrl}
              alt="Current upload"
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleBrowseClick}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Replace Image
            </button>
          </div>
        )}

        {uploadProgress.status === 'uploading' && selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{Math.round(uploadProgress.percentage)}%</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {uploadProgress.status === 'completed' && imagePreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
              <Check className="w-6 h-6" />
              <span className="text-lg font-medium">Upload Complete!</span>
            </div>

            <img
              src={imagePreview}
              alt="Uploaded"
              className="w-full max-h-64 object-cover rounded-lg"
            />

            {selectedFile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Filename:</span>
                  <span className="text-gray-900 dark:text-gray-100 truncate ml-2">{selectedFile.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleClearFile}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Upload Different Image
            </button>
          </div>
        )}

        {uploadProgress.status === 'error' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="w-8 h-8" />
              <span className="text-lg font-medium">Upload Failed</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{uploadProgress.error}</p>
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
    </div>
  );
};

export default ImageUpload;
