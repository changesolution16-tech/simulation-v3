/*
  # Update Storage Policies to Allow All Authenticated Users to Upload

  1. Overview
    This migration updates the storage policies for the 'video-files' bucket to allow
    all authenticated users (students, instructors, and admins) to upload video files.

  2. Changes
    - Drop the restrictive upload policy
    - Create a new policy that allows all authenticated users to upload
    - Maintain existing read and delete policies

  3. Security
    - All authenticated users can upload videos
    - Public and authenticated users can view videos
    - Only file owners and admins can update/delete videos
*/

-- ============================================================================
-- UPDATE STORAGE POLICIES
-- ============================================================================

-- Drop the old restrictive upload policy
DROP POLICY IF EXISTS "Instructors and admins can upload video files" ON storage.objects;

-- Create new policy allowing all authenticated users to upload
CREATE POLICY "Authenticated users can upload video files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-files'
);

-- Ensure the update policy exists and is correct
DROP POLICY IF EXISTS "Uploaders and admins can update video files" ON storage.objects;

CREATE POLICY "Uploaders and admins can update video files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'video-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'video-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Ensure the delete policy exists and is correct
DROP POLICY IF EXISTS "Uploaders and admins can delete video files" ON storage.objects;

CREATE POLICY "Uploaders and admins can delete video files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'video-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
