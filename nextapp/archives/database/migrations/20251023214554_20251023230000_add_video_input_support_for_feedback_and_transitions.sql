/*
  # Add Video Input Support for Feedback and Transition Videos

  1. Overview
    This migration extends comprehensive video input support (URL, embed, upload, library)
    to feedback videos and transition videos at both scenario and option levels.
    Previously only introduction videos had full support.

  2. Schema Changes for scenario_options table
    - Add file upload reference columns for feedback videos at each difficulty level
    - Add embed code storage columns for feedback videos at each difficulty level
    - Add file upload reference column for option-level transition videos
    - Add embed code storage column for option-level transition videos
    - Update existing video source tracking columns to support all input types

  3. Schema Changes for scenarios table
    - Add file upload reference column for scenario-level transition videos
    - Add embed code storage column for scenario-level transition videos
    - Update existing video source tracking for transitions

  4. Benefits
    - Consistent video input experience across all video types
    - Support for direct file uploads of feedback and transition videos
    - Support for embed codes from any video platform
    - Ability to link to centralized video library
    - All videos can be managed in one place with automatic updates

  5. Security
    - Maintain existing RLS policies
    - Foreign key constraints ensure referential integrity
    - ON DELETE SET NULL prevents cascading deletes

  6. Performance
    - Add indexes for efficient lookups of video file and library references
*/

-- ============================================================================
-- ADD FILE UPLOAD COLUMNS TO SCENARIO_OPTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add file reference for beginner feedback video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_file_id_beginner'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_file_id_beginner uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Add file reference for intermediate feedback video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_file_id_intermediate'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_file_id_intermediate uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Add file reference for advanced feedback video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_file_id_advanced'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_file_id_advanced uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Add file reference for option-level transition video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_file_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ADD EMBED CODE COLUMNS TO SCENARIO_OPTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add embed code for beginner feedback video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_embed_code_beginner'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_embed_code_beginner text;
  END IF;

  -- Add embed code for intermediate feedback video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_embed_code_intermediate'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_embed_code_intermediate text;
  END IF;

  -- Add embed code for advanced feedback video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_embed_code_advanced'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_embed_code_advanced text;
  END IF;

  -- Add embed code for option-level transition video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_embed_code'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_embed_code text;
  END IF;
END $$;

-- ============================================================================
-- ADD FILE UPLOAD AND EMBED CODE COLUMNS TO SCENARIOS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add file reference for scenario-level transition video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_file_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL;
  END IF;

  -- Add embed code for scenario-level transition video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_embed_code'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_embed_code text;
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for scenario_options feedback video files
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_file_beginner ON scenario_options(feedback_video_file_id_beginner);
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_file_intermediate ON scenario_options(feedback_video_file_id_intermediate);
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_file_advanced ON scenario_options(feedback_video_file_id_advanced);

-- Index for scenario_options transition video file
CREATE INDEX IF NOT EXISTS idx_scenario_options_transition_file ON scenario_options(transition_video_file_id);

-- Index for scenarios transition video file
CREATE INDEX IF NOT EXISTS idx_scenarios_transition_file ON scenarios(transition_video_file_id);

-- ============================================================================
-- HELPER FUNCTION: Resolve Video URL from Various Sources
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_video_url(
  p_video_url text,
  p_video_source text,
  p_library_id uuid,
  p_file_id uuid
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_resolved_url text;
BEGIN
  -- If source is library, get URL from video_library
  IF p_video_source = 'library' AND p_library_id IS NOT NULL THEN
    SELECT video_url INTO v_resolved_url
    FROM video_library
    WHERE id = p_library_id;

    IF v_resolved_url IS NOT NULL THEN
      RETURN v_resolved_url;
    END IF;
  END IF;

  -- If source is upload, construct URL from video_files
  IF p_video_source = 'upload' AND p_file_id IS NOT NULL THEN
    SELECT
      CASE
        WHEN storage_bucket = 'videos' THEN
          concat(
            current_setting('app.supabase_url', true),
            '/storage/v1/object/public/',
            storage_bucket,
            '/',
            storage_path
          )
        ELSE storage_path
      END INTO v_resolved_url
    FROM video_files
    WHERE id = p_file_id;

    IF v_resolved_url IS NOT NULL THEN
      RETURN v_resolved_url;
    END IF;
  END IF;

  -- Otherwise return the direct URL (covers 'url' and 'embed' sources)
  RETURN p_video_url;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get All Feedback Videos for an Option
-- ============================================================================

CREATE OR REPLACE FUNCTION get_option_feedback_videos(p_option_id uuid)
RETURNS TABLE (
  difficulty text,
  video_url text,
  video_source text,
  library_id uuid,
  file_id uuid,
  resolved_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'beginner'::text as difficulty,
    feedback_video_url_beginner as video_url,
    feedback_video_source_beginner as video_source,
    feedback_video_library_id_beginner as library_id,
    feedback_video_file_id_beginner as file_id,
    resolve_video_url(
      feedback_video_url_beginner,
      feedback_video_source_beginner,
      feedback_video_library_id_beginner,
      feedback_video_file_id_beginner
    ) as resolved_url
  FROM scenario_options
  WHERE id = p_option_id

  UNION ALL

  SELECT
    'intermediate'::text as difficulty,
    feedback_video_url_intermediate as video_url,
    feedback_video_source_intermediate as video_source,
    feedback_video_library_id_intermediate as library_id,
    feedback_video_file_id_intermediate as file_id,
    resolve_video_url(
      feedback_video_url_intermediate,
      feedback_video_source_intermediate,
      feedback_video_library_id_intermediate,
      feedback_video_file_id_intermediate
    ) as resolved_url
  FROM scenario_options
  WHERE id = p_option_id

  UNION ALL

  SELECT
    'advanced'::text as difficulty,
    feedback_video_url_advanced as video_url,
    feedback_video_source_advanced as video_source,
    feedback_video_library_id_advanced as library_id,
    feedback_video_file_id_advanced as file_id,
    resolve_video_url(
      feedback_video_url_advanced,
      feedback_video_source_advanced,
      feedback_video_library_id_advanced,
      feedback_video_file_id_advanced
    ) as resolved_url
  FROM scenario_options
  WHERE id = p_option_id;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN scenario_options.feedback_video_file_id_beginner IS 'Reference to uploaded video file for beginner feedback';
COMMENT ON COLUMN scenario_options.feedback_video_file_id_intermediate IS 'Reference to uploaded video file for intermediate feedback';
COMMENT ON COLUMN scenario_options.feedback_video_file_id_advanced IS 'Reference to uploaded video file for advanced feedback';
COMMENT ON COLUMN scenario_options.transition_video_file_id IS 'Reference to uploaded video file for option transition';
COMMENT ON COLUMN scenario_options.feedback_video_embed_code_beginner IS 'Embed code for beginner feedback video';
COMMENT ON COLUMN scenario_options.feedback_video_embed_code_intermediate IS 'Embed code for intermediate feedback video';
COMMENT ON COLUMN scenario_options.feedback_video_embed_code_advanced IS 'Embed code for advanced feedback video';
COMMENT ON COLUMN scenario_options.transition_video_embed_code IS 'Embed code for option transition video';
COMMENT ON COLUMN scenarios.transition_video_file_id IS 'Reference to uploaded video file for scenario transition';
COMMENT ON COLUMN scenarios.transition_video_embed_code IS 'Embed code for scenario transition video';
