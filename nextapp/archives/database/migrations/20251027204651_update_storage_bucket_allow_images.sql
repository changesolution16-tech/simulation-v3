/*
  # Update Storage Bucket to Allow Images

  ## Problem
  The `video-files` storage bucket is configured to only accept video MIME types.
  This prevents the ImageUpload component from uploading images for simulation
  landing pages, causing silent failures when users try to upload images.

  ## Solution
  Update the `video-files` bucket to also accept common image MIME types.
  This allows the bucket to store both videos and images, which is appropriate
  since the component uploads to this bucket.

  ## Changes
  1. Add image MIME types to the allowed list:
     - image/jpeg
     - image/jpg  
     - image/png
     - image/gif
     - image/webp
  2. Keep existing video MIME types

  ## Impact
  - Image uploads will now succeed
  - Users can upload landing page images
  - No breaking changes to existing video uploads
  - Storage bucket remains public for easy access
*/

-- Update the video-files bucket to allow both video and image uploads
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'video/mp4',
  'video/webm', 
  'video/quicktime',
  'video/x-msvideo',
  'video/ogg',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]
WHERE name = 'video-files';