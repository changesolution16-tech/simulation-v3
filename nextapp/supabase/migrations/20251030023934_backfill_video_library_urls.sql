/*
  # Backfill Video Library URLs

  1. Overview
    This migration ensures all video_library entries have valid video_url values.
    When a video has a video_file_id but no video_url, it generates the public URL
    from the video_files table.

  2. Changes
    - Updates video_library entries where video_url is null but video_file_id exists
    - Generates public URLs using the Supabase storage path
    - Creates a trigger to automatically maintain video_url consistency

  3. Security
    - Only updates existing records, doesn't change permissions
    - Maintains all existing RLS policies
*/

-- ============================================================================
-- BACKFILL MISSING VIDEO URLs
-- ============================================================================

-- First, get the Supabase URL from the environment
DO $$
DECLARE
  v_supabase_url text := 'https://gglzmggwifbkxtxjclcw.supabase.co';
BEGIN
  -- Update video_library entries that have video_file_id but missing video_url
  UPDATE video_library vl
  SET video_url = (
    SELECT
      v_supabase_url ||
      '/storage/v1/object/public/' ||
      COALESCE(vf.storage_bucket, 'video-files') || '/' ||
      vf.storage_path
    FROM video_files vf
    WHERE vf.id = vl.video_file_id
  )
  WHERE
    vl.video_file_id IS NOT NULL
    AND (vl.video_url IS NULL OR TRIM(vl.video_url) = '');

  RAISE NOTICE 'Updated video_library entries with missing URLs';
END $$;

-- ============================================================================
-- CREATE FUNCTION TO AUTO-GENERATE VIDEO URLs
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_video_library_url()
RETURNS TRIGGER AS $$
DECLARE
  v_storage_path text;
  v_storage_bucket text;
  v_supabase_url text := 'https://gglzmggwifbkxtxjclcw.supabase.co';
BEGIN
  -- Only process if video_file_id is set but video_url is not
  IF NEW.video_file_id IS NOT NULL AND (NEW.video_url IS NULL OR TRIM(NEW.video_url) = '') THEN
    -- Get the storage path and bucket from video_files
    SELECT storage_path, COALESCE(storage_bucket, 'video-files')
    INTO v_storage_path, v_storage_bucket
    FROM video_files
    WHERE id = NEW.video_file_id;

    -- Generate the public URL if storage path exists
    IF v_storage_path IS NOT NULL THEN
      NEW.video_url := v_supabase_url || '/storage/v1/object/public/' || v_storage_bucket || '/' || v_storage_path;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS video_library_auto_generate_url ON video_library;

CREATE TRIGGER video_library_auto_generate_url
  BEFORE INSERT OR UPDATE ON video_library
  FOR EACH ROW
  EXECUTE FUNCTION generate_video_library_url();

-- ============================================================================
-- ADD HELPFUL COMMENT
-- ============================================================================

COMMENT ON FUNCTION generate_video_library_url() IS
  'Automatically generates video_url from video_file_id when video_url is not provided.
   This ensures consistency between video_library and video_files tables.';
