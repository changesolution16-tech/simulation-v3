/*
  # Add Video Library References to Scenarios

  1. Overview
    This migration adds support for linking scenarios and options to video library entries,
    enabling centralized video management with automatic updates when library videos change.

  2. Schema Changes
    - Add video_library_id references to scenarios table for introduction, prompt, and transition videos
    - Add video_library_id references to scenario_options table for feedback videos
    - Add video_source tracking columns to identify whether videos come from library or direct URLs
    - Preserve existing video_url columns for backward compatibility

  3. Benefits
    - Upload videos once, use them across multiple scenarios
    - Update a video in the library, all scenarios automatically get the new version
    - Track which scenarios use each video
    - Centralized video management and organization

  4. Security
    - Maintain existing RLS policies
    - No changes to access control

  5. Performance
    - Add indexes for efficient lookups of library video references
*/

-- ============================================================================
-- ADD LIBRARY REFERENCE COLUMNS TO SCENARIOS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add introduction video library reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_library_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_library_id uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add prompt video library reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_library_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_library_id uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add transition video library reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_library_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_library_id uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add video source tracking for introduction video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_source text CHECK (introduction_video_source IN ('url', 'embed', 'upload', 'library'));
  END IF;

  -- Add video source tracking for prompt video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_source text CHECK (prompt_video_source IN ('url', 'embed', 'upload', 'library'));
  END IF;

  -- Add video source tracking for transition video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_source'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_source text CHECK (transition_video_source IN ('url', 'embed', 'upload', 'library'));
  END IF;
END $$;

-- ============================================================================
-- ADD LIBRARY REFERENCE COLUMNS TO SCENARIO_OPTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add feedback video library reference for beginner
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_library_id_beginner'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_library_id_beginner uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add feedback video library reference for intermediate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_library_id_intermediate'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_library_id_intermediate uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add feedback video library reference for advanced
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_library_id_advanced'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_library_id_advanced uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add transition video library reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_library_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_library_id uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;

  -- Add video source tracking for feedback videos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_source_beginner'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_source_beginner text CHECK (feedback_video_source_beginner IN ('url', 'embed', 'upload', 'library'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_source_intermediate'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_source_intermediate text CHECK (feedback_video_source_intermediate IN ('url', 'embed', 'upload', 'library'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_source_advanced'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_source_advanced text CHECK (feedback_video_source_advanced IN ('url', 'embed', 'upload', 'library'));
  END IF;

  -- Add video source tracking for transition video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_source'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_source text CHECK (transition_video_source IN ('url', 'embed', 'upload', 'library'));
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scenarios_introduction_video_library ON scenarios(introduction_video_library_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_prompt_video_library ON scenarios(prompt_video_library_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_transition_video_library ON scenarios(transition_video_library_id);

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_beginner ON scenario_options(feedback_video_library_id_beginner);
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_intermediate ON scenario_options(feedback_video_library_id_intermediate);
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_advanced ON scenario_options(feedback_video_library_id_advanced);
CREATE INDEX IF NOT EXISTS idx_scenario_options_transition_library ON scenario_options(transition_video_library_id);

-- ============================================================================
-- HELPER FUNCTION: Get Scenarios Using a Library Video
-- ============================================================================

CREATE OR REPLACE FUNCTION get_scenarios_using_video(library_video_id uuid)
RETURNS TABLE (
  scenario_id uuid,
  scenario_title text,
  video_usage_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'introduction' as video_usage_type
  FROM scenarios s
  WHERE s.introduction_video_library_id = library_video_id

  UNION ALL

  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'prompt' as video_usage_type
  FROM scenarios s
  WHERE s.prompt_video_library_id = library_video_id

  UNION ALL

  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'transition' as video_usage_type
  FROM scenarios s
  WHERE s.transition_video_library_id = library_video_id

  UNION ALL

  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'feedback_beginner' as video_usage_type
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.feedback_video_library_id_beginner = library_video_id

  UNION ALL

  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'feedback_intermediate' as video_usage_type
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.feedback_video_library_id_intermediate = library_video_id

  UNION ALL

  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'feedback_advanced' as video_usage_type
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.feedback_video_library_id_advanced = library_video_id

  UNION ALL

  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    'option_transition' as video_usage_type
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.transition_video_library_id = library_video_id;
END;
$$;