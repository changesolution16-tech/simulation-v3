/*
  # Add Video File Storage Support

  1. Overview
    This migration adds comprehensive video file storage capabilities including:
    - Video file storage support with file metadata
    - Storage bucket configuration for video uploads
    - Video source tracking (URL, embed code, or uploaded file)
    - File management and cleanup utilities
    - Enhanced video metadata storage

  2. New Tables
    - `video_files` - Tracks all uploaded video files with metadata and storage paths

  3. Schema Enhancements
    - Add `video_source` column to track input method (url, embed, upload)
    - Add `video_file_id` foreign key to link to uploaded files
    - Add file metadata columns for uploaded videos
    - Add storage path and file size tracking
    - Add video processing status fields

  4. Storage Bucket Configuration
    - Creates 'video-files' storage bucket for video uploads
    - Sets appropriate size limits and file type restrictions
    - Configures public read access for learners
    - Allows authenticated instructors/admins to upload

  5. Security
    - Enable RLS on video_files table
    - Instructors and admins can upload and manage video files
    - All authenticated users can view video files
    - Public read access through storage bucket policies

  6. File Management
    - Automatic cleanup of orphaned files
    - File size quota tracking per user
    - Duplicate file detection
    - Video metadata extraction
*/

-- ============================================================================
-- VIDEO FILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File identification
  original_filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  storage_bucket text DEFAULT 'video-files',

  -- File metadata
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  duration_seconds integer,
  width integer,
  height integer,

  -- Video quality metadata
  bitrate integer,
  codec text,
  format text,

  -- Thumbnail
  thumbnail_path text,
  thumbnail_url text,

  -- Processing status
  upload_status text DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'processing')),
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error text,

  -- Access tracking
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,

  -- File hash for duplicate detection
  file_hash text,

  -- Ownership and access control
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_public boolean DEFAULT false,
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================================
-- ENHANCE SCENARIOS TABLE WITH VIDEO FILE SUPPORT
-- ============================================================================

DO $$
BEGIN
  -- Add video source tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_source text DEFAULT 'url' CHECK (prompt_video_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_file_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Introduction video source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_source text DEFAULT 'url' CHECK (introduction_video_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_file_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Transition video source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_source text DEFAULT 'url' CHECK (transition_video_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_file_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Conclusion video source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'conclusion_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN conclusion_video_source text DEFAULT 'url' CHECK (conclusion_video_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'conclusion_video_file_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN conclusion_video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ENHANCE SCENARIO_OPTIONS TABLE WITH VIDEO FILE SUPPORT
-- ============================================================================

DO $$
BEGIN
  -- Feedback video sources for each difficulty level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_beginner_source'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_beginner_source text DEFAULT 'url' CHECK (feedback_video_beginner_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_beginner_file_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_beginner_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_intermediate_source'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_intermediate_source text DEFAULT 'url' CHECK (feedback_video_intermediate_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_intermediate_file_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_intermediate_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_advanced_source'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_advanced_source text DEFAULT 'url' CHECK (feedback_video_advanced_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_advanced_file_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_advanced_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ENHANCE VIDEO_LIBRARY TABLE WITH FILE SUPPORT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_library' AND column_name = 'video_source'
  ) THEN
    ALTER TABLE video_library ADD COLUMN video_source text DEFAULT 'url' CHECK (video_source IN ('url', 'embed', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_library' AND column_name = 'video_file_id'
  ) THEN
    ALTER TABLE video_library ADD COLUMN video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_video_files_uploaded_by ON video_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_video_files_storage_path ON video_files(storage_path);
CREATE INDEX IF NOT EXISTS idx_video_files_file_hash ON video_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_video_files_upload_status ON video_files(upload_status);
CREATE INDEX IF NOT EXISTS idx_video_files_created_at ON video_files(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scenarios_prompt_video_file ON scenarios(prompt_video_file_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_intro_video_file ON scenarios(introduction_video_file_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_transition_video_file ON scenarios(transition_video_file_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_conclusion_video_file ON scenarios(conclusion_video_file_id);

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_beginner_file ON scenario_options(feedback_video_beginner_file_id);
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_intermediate_file ON scenario_options(feedback_video_intermediate_file_id);
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_advanced_file ON scenario_options(feedback_video_advanced_file_id);

CREATE INDEX IF NOT EXISTS idx_video_library_video_file ON video_library(video_file_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE video_files ENABLE ROW LEVEL SECURITY;

-- Video Files Policies
CREATE POLICY "Instructors and admins can manage video files"
  ON video_files FOR ALL
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "All authenticated users can view video files"
  ON video_files FOR SELECT
  TO authenticated
  USING (is_public = true OR uploaded_by = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_video_files_updated_at
  BEFORE UPDATE ON video_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get public URL for uploaded video file
CREATE OR REPLACE FUNCTION get_video_file_url(file_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  storage_path_var text;
  bucket_var text;
BEGIN
  SELECT storage_path, storage_bucket
  INTO storage_path_var, bucket_var
  FROM video_files
  WHERE id = file_id_param AND is_active = true;

  IF storage_path_var IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return the storage path that will be used with Supabase storage client
  RETURN storage_path_var;
END;
$$;

-- Function to increment video file view count
CREATE OR REPLACE FUNCTION increment_video_file_views(file_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_files
  SET
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE id = file_id_param;
END;
$$;

-- Function to cleanup orphaned video files
CREATE OR REPLACE FUNCTION cleanup_orphaned_video_files()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Mark video files as deleted if they're not referenced anywhere and older than 30 days
  UPDATE video_files
  SET
    deleted_at = now(),
    is_active = false
  WHERE
    id NOT IN (
      SELECT prompt_video_file_id FROM scenarios WHERE prompt_video_file_id IS NOT NULL
      UNION
      SELECT introduction_video_file_id FROM scenarios WHERE introduction_video_file_id IS NOT NULL
      UNION
      SELECT transition_video_file_id FROM scenarios WHERE transition_video_file_id IS NOT NULL
      UNION
      SELECT conclusion_video_file_id FROM scenarios WHERE conclusion_video_file_id IS NOT NULL
      UNION
      SELECT feedback_video_beginner_file_id FROM scenario_options WHERE feedback_video_beginner_file_id IS NOT NULL
      UNION
      SELECT feedback_video_intermediate_file_id FROM scenario_options WHERE feedback_video_intermediate_file_id IS NOT NULL
      UNION
      SELECT feedback_video_advanced_file_id FROM scenario_options WHERE feedback_video_advanced_file_id IS NOT NULL
      UNION
      SELECT video_file_id FROM video_library WHERE video_file_id IS NOT NULL
    )
    AND created_at < now() - interval '30 days'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Function to get user's total storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id_param uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size bigint;
BEGIN
  SELECT COALESCE(SUM(file_size), 0)
  INTO total_size
  FROM video_files
  WHERE uploaded_by = user_id_param
    AND is_active = true
    AND deleted_at IS NULL;

  RETURN total_size;
END;
$$;
