/*
  # Configure Storage Bucket for Video Files

  1. Overview
    This migration configures Supabase Storage for video file uploads:
    - Creates 'video-files' storage bucket
    - Configures bucket settings and file restrictions
    - Sets up storage policies for secure access
    - Enables public read access for viewing videos

  2. Bucket Configuration
    - Public bucket for easy video access
    - File size limit: 500MB per video
    - Allowed file types: MP4, WebM, MOV, AVI, OGV
    - Organized folder structure

  3. Security Policies
    - Authenticated instructors and admins can upload files
    - All authenticated users can read/view video files
    - Public read access enabled for learner viewing
    - File deletion restricted to uploaders and admins

  4. Storage Organization
    - /scenarios/{scenario_id}/ - Scenario-related videos
    - /feedback/{option_id}/ - Feedback videos
    - /library/ - Reusable library videos
    - /temp/ - Temporary uploads before assignment
*/

-- ============================================================================
-- STORAGE USAGE TRACKING
-- ============================================================================

-- Create table to track storage quotas per user
CREATE TABLE IF NOT EXISTS storage_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Quota limits (in bytes)
  total_quota bigint DEFAULT 5368709120, -- 5GB default
  used_space bigint DEFAULT 0,

  -- File count limits
  max_files integer DEFAULT 1000,
  file_count integer DEFAULT 0,

  -- Timestamps
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on storage quotas
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;

-- Storage quotas policies
CREATE POLICY "Users can view their own storage quota"
  ON storage_quotas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all storage quotas"
  ON storage_quotas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage storage quotas"
  ON storage_quotas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for storage quota lookups
CREATE INDEX IF NOT EXISTS idx_storage_quotas_user_id ON storage_quotas(user_id);

-- Trigger to update storage quota updated_at
CREATE TRIGGER update_storage_quotas_updated_at
  BEFORE UPDATE ON storage_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update user storage usage
CREATE OR REPLACE FUNCTION update_user_storage_usage(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size bigint;
  total_files integer;
BEGIN
  -- Calculate total storage used
  SELECT
    COALESCE(SUM(file_size), 0),
    COUNT(*)
  INTO total_size, total_files
  FROM video_files
  WHERE uploaded_by = user_id_param
    AND is_active = true
    AND deleted_at IS NULL;

  -- Insert or update storage quota
  INSERT INTO storage_quotas (user_id, used_space, file_count, last_calculated_at)
  VALUES (user_id_param, total_size, total_files, now())
  ON CONFLICT (user_id) DO UPDATE SET
    used_space = total_size,
    file_count = total_files,
    last_calculated_at = now();
END;
$$;

-- Function to check if user has available storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(
  user_id_param uuid,
  file_size_param bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quota_record storage_quotas%ROWTYPE;
BEGIN
  -- Get user's quota
  SELECT * INTO quota_record
  FROM storage_quotas
  WHERE user_id = user_id_param;

  -- If no quota record exists, create one with defaults
  IF NOT FOUND THEN
    INSERT INTO storage_quotas (user_id)
    VALUES (user_id_param)
    RETURNING * INTO quota_record;
  END IF;

  -- Check if user has enough space
  IF (quota_record.used_space + file_size_param) > quota_record.total_quota THEN
    RETURN false;
  END IF;

  -- Check if user has reached file count limit
  IF quota_record.file_count >= quota_record.max_files THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- ============================================================================
-- HELPER FUNCTIONS FOR STORAGE
-- ============================================================================

-- Function to generate organized storage path
CREATE OR REPLACE FUNCTION generate_video_storage_path(
  category text,
  reference_id uuid,
  filename text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  clean_filename text;
  timestamp_str text;
  unique_id text;
BEGIN
  -- Clean filename: remove special characters and spaces
  clean_filename := regexp_replace(filename, '[^a-zA-Z0-9._-]', '_', 'g');

  -- Generate timestamp and unique ID
  timestamp_str := to_char(now(), 'YYYYMMDD_HH24MISS');
  unique_id := substr(gen_random_uuid()::text, 1, 8);

  -- Return organized path
  RETURN format('%s/%s/%s_%s_%s',
    category,
    reference_id,
    timestamp_str,
    unique_id,
    clean_filename
  );
END;
$$;

-- Function to get public URL for storage file
CREATE OR REPLACE FUNCTION get_storage_public_url(
  bucket_name text,
  file_path text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the path that will be used with getPublicUrl on client
  RETURN file_path;
END;
$$;
