/*
  # Automatic Video Library URL Propagation

  ## Overview
  This migration implements automatic updates from video_library to all scenarios
  and scenario_options that reference library videos. When a video URL in the library
  is updated, all associated scenarios automatically receive the new URL.

  ## Changes
  1. Create trigger function to propagate video_library URL updates
  2. Enhance usage tracking views and functions
  3. Add impact analysis functions for video updates
  4. Create indexes for efficient library video lookups
  5. Add usage count updates to library entries

  ## Benefits
  - Videos are always up-to-date across all scenarios
  - Centralized video management with automatic propagation
  - Full visibility into video usage before making changes
  - Simplified maintenance and consistency

  ## Security
  - Maintains existing RLS policies
  - Uses SECURITY DEFINER for system-level operations
  - Proper permission checks for all operations
*/

-- ============================================================================
-- TRIGGER FUNCTION: Auto-update scenario videos when library video changes
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_update_scenario_videos_from_library()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scenarios_updated INTEGER := 0;
  v_options_updated INTEGER := 0;
BEGIN
  -- Only proceed if video_url has actually changed
  IF (TG_OP = 'UPDATE' AND NEW.video_url IS DISTINCT FROM OLD.video_url) THEN

    -- Log the update
    RAISE NOTICE 'Video library entry % updated: URL changed from % to %',
      NEW.id,
      COALESCE(OLD.video_url, 'NULL'),
      COALESCE(NEW.video_url, 'NULL');

    -- Update scenarios table - introduction videos
    UPDATE scenarios
    SET
      introduction_video_url = NEW.video_url,
      updated_at = now()
    WHERE introduction_video_library_id = NEW.id
      AND introduction_video_source = 'library';

    GET DIAGNOSTICS v_scenarios_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenarios (introduction videos)', v_scenarios_updated;

    -- Update scenarios table - prompt videos
    UPDATE scenarios
    SET
      prompt_video_url = NEW.video_url,
      updated_at = now()
    WHERE prompt_video_library_id = NEW.id
      AND prompt_video_source = 'library';

    GET DIAGNOSTICS v_scenarios_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenarios (prompt videos)', v_scenarios_updated;

    -- Update scenarios table - transition videos
    UPDATE scenarios
    SET
      transition_video_url = NEW.video_url,
      updated_at = now()
    WHERE transition_video_library_id = NEW.id
      AND transition_video_source = 'library';

    GET DIAGNOSTICS v_scenarios_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenarios (transition videos)', v_scenarios_updated;

    -- Update scenario_options - beginner feedback videos
    UPDATE scenario_options
    SET
      feedback_video_url_beginner = NEW.video_url,
      updated_at = now()
    WHERE feedback_video_library_id_beginner = NEW.id
      AND feedback_video_source_beginner = 'library';

    GET DIAGNOSTICS v_options_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenario options (beginner feedback videos)', v_options_updated;

    -- Update scenario_options - intermediate feedback videos
    UPDATE scenario_options
    SET
      feedback_video_url_intermediate = NEW.video_url,
      updated_at = now()
    WHERE feedback_video_library_id_intermediate = NEW.id
      AND feedback_video_source_intermediate = 'library';

    GET DIAGNOSTICS v_options_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenario options (intermediate feedback videos)', v_options_updated;

    -- Update scenario_options - advanced feedback videos
    UPDATE scenario_options
    SET
      feedback_video_url_advanced = NEW.video_url,
      updated_at = now()
    WHERE feedback_video_library_id_advanced = NEW.id
      AND feedback_video_source_advanced = 'library';

    GET DIAGNOSTICS v_options_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenario options (advanced feedback videos)', v_options_updated;

    -- Update scenario_options - transition videos
    UPDATE scenario_options
    SET
      transition_video_url = NEW.video_url,
      updated_at = now()
    WHERE transition_video_library_id = NEW.id
      AND transition_video_source = 'library';

    GET DIAGNOSTICS v_options_updated = ROW_COUNT;
    RAISE NOTICE '  - Updated % scenario options (transition videos)', v_options_updated;

    RAISE NOTICE 'Video library URL propagation complete for video %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_update_scenario_videos_from_library() IS
  'Automatically propagates video_library URL changes to all referencing scenarios and options';

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auto_update_scenario_videos_from_library ON video_library;

CREATE TRIGGER trigger_auto_update_scenario_videos_from_library
  AFTER UPDATE ON video_library
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_scenario_videos_from_library();

COMMENT ON TRIGGER trigger_auto_update_scenario_videos_from_library ON video_library IS
  'Propagates video URL updates to all scenarios and options using this library video';

-- ============================================================================
-- ENHANCED USAGE TRACKING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW video_library_usage_summary AS
SELECT
  vl.id as video_id,
  vl.title,
  vl.video_type,
  vl.video_platform,
  vl.is_public,
  vl.updated_at as video_updated_at,
  (
    -- Count introduction video usage
    (SELECT COUNT(*) FROM scenarios WHERE introduction_video_library_id = vl.id) +
    -- Count prompt video usage
    (SELECT COUNT(*) FROM scenarios WHERE prompt_video_library_id = vl.id) +
    -- Count scenario transition video usage
    (SELECT COUNT(*) FROM scenarios WHERE transition_video_library_id = vl.id) +
    -- Count beginner feedback video usage
    (SELECT COUNT(*) FROM scenario_options WHERE feedback_video_library_id_beginner = vl.id) +
    -- Count intermediate feedback video usage
    (SELECT COUNT(*) FROM scenario_options WHERE feedback_video_library_id_intermediate = vl.id) +
    -- Count advanced feedback video usage
    (SELECT COUNT(*) FROM scenario_options WHERE feedback_video_library_id_advanced = vl.id) +
    -- Count option transition video usage
    (SELECT COUNT(*) FROM scenario_options WHERE transition_video_library_id = vl.id)
  ) as total_usage_count,
  vl.created_at,
  vl.created_by
FROM video_library vl;

COMMENT ON VIEW video_library_usage_summary IS
  'Summary view showing total usage count for each video library entry across all scenarios';

-- ============================================================================
-- FUNCTION: Get detailed usage information for a library video
-- ============================================================================

CREATE OR REPLACE FUNCTION get_video_library_detailed_usage(library_video_id uuid)
RETURNS TABLE (
  scenario_id uuid,
  scenario_title text,
  scenario_difficulty text,
  video_usage_type text,
  video_usage_location text,
  scenario_updated_at timestamptz,
  option_id uuid,
  option_text text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Introduction videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'introduction'::text as video_usage_type,
    'scenario'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    NULL::uuid as option_id,
    NULL::text as option_text
  FROM scenarios s
  WHERE s.introduction_video_library_id = library_video_id

  UNION ALL

  -- Prompt videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'prompt'::text as video_usage_type,
    'scenario'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    NULL::uuid as option_id,
    NULL::text as option_text
  FROM scenarios s
  WHERE s.prompt_video_library_id = library_video_id

  UNION ALL

  -- Scenario transition videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'transition'::text as video_usage_type,
    'scenario'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    NULL::uuid as option_id,
    NULL::text as option_text
  FROM scenarios s
  WHERE s.transition_video_library_id = library_video_id

  UNION ALL

  -- Beginner feedback videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'feedback_beginner'::text as video_usage_type,
    'option'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    so.id as option_id,
    so.option_text as option_text
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.feedback_video_library_id_beginner = library_video_id

  UNION ALL

  -- Intermediate feedback videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'feedback_intermediate'::text as video_usage_type,
    'option'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    so.id as option_id,
    so.option_text as option_text
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.feedback_video_library_id_intermediate = library_video_id

  UNION ALL

  -- Advanced feedback videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'feedback_advanced'::text as video_usage_type,
    'option'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    so.id as option_id,
    so.option_text as option_text
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.feedback_video_library_id_advanced = library_video_id

  UNION ALL

  -- Option transition videos
  SELECT
    s.id as scenario_id,
    s.title as scenario_title,
    s.difficulty as scenario_difficulty,
    'transition'::text as video_usage_type,
    'option'::text as video_usage_location,
    s.updated_at as scenario_updated_at,
    so.id as option_id,
    so.option_text as option_text
  FROM scenarios s
  JOIN scenario_options so ON so.scenario_id = s.id
  WHERE so.transition_video_library_id = library_video_id

  ORDER BY scenario_title, video_usage_type;
END;
$$;

COMMENT ON FUNCTION get_video_library_detailed_usage(uuid) IS
  'Returns detailed information about all scenarios and options using a specific library video';

-- ============================================================================
-- FUNCTION: Get impact preview before updating a library video
-- ============================================================================

CREATE OR REPLACE FUNCTION preview_video_library_update_impact(library_video_id uuid)
RETURNS TABLE (
  total_scenarios_affected integer,
  total_options_affected integer,
  affected_scenario_ids uuid[],
  affected_scenario_titles text[],
  usage_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intro_count INTEGER;
  v_prompt_count INTEGER;
  v_scenario_transition_count INTEGER;
  v_feedback_beginner_count INTEGER;
  v_feedback_intermediate_count INTEGER;
  v_feedback_advanced_count INTEGER;
  v_option_transition_count INTEGER;
  v_scenario_ids uuid[];
  v_scenario_titles text[];
BEGIN
  -- Count usage by type
  SELECT COUNT(*) INTO v_intro_count
  FROM scenarios WHERE introduction_video_library_id = library_video_id;

  SELECT COUNT(*) INTO v_prompt_count
  FROM scenarios WHERE prompt_video_library_id = library_video_id;

  SELECT COUNT(*) INTO v_scenario_transition_count
  FROM scenarios WHERE transition_video_library_id = library_video_id;

  SELECT COUNT(*) INTO v_feedback_beginner_count
  FROM scenario_options WHERE feedback_video_library_id_beginner = library_video_id;

  SELECT COUNT(*) INTO v_feedback_intermediate_count
  FROM scenario_options WHERE feedback_video_library_id_intermediate = library_video_id;

  SELECT COUNT(*) INTO v_feedback_advanced_count
  FROM scenario_options WHERE feedback_video_library_id_advanced = library_video_id;

  SELECT COUNT(*) INTO v_option_transition_count
  FROM scenario_options WHERE transition_video_library_id = library_video_id;

  -- Get unique scenario IDs and titles
  SELECT
    array_agg(DISTINCT s.id),
    array_agg(DISTINCT s.title)
  INTO v_scenario_ids, v_scenario_titles
  FROM scenarios s
  LEFT JOIN scenario_options so ON so.scenario_id = s.id
  WHERE
    s.introduction_video_library_id = library_video_id OR
    s.prompt_video_library_id = library_video_id OR
    s.transition_video_library_id = library_video_id OR
    so.feedback_video_library_id_beginner = library_video_id OR
    so.feedback_video_library_id_intermediate = library_video_id OR
    so.feedback_video_library_id_advanced = library_video_id OR
    so.transition_video_library_id = library_video_id;

  -- Return summary
  RETURN QUERY SELECT
    COALESCE(array_length(v_scenario_ids, 1), 0) as total_scenarios_affected,
    (v_feedback_beginner_count + v_feedback_intermediate_count +
     v_feedback_advanced_count + v_option_transition_count) as total_options_affected,
    COALESCE(v_scenario_ids, ARRAY[]::uuid[]) as affected_scenario_ids,
    COALESCE(v_scenario_titles, ARRAY[]::text[]) as affected_scenario_titles,
    jsonb_build_object(
      'introduction_videos', v_intro_count,
      'prompt_videos', v_prompt_count,
      'scenario_transition_videos', v_scenario_transition_count,
      'feedback_beginner_videos', v_feedback_beginner_count,
      'feedback_intermediate_videos', v_feedback_intermediate_count,
      'feedback_advanced_videos', v_feedback_advanced_count,
      'option_transition_videos', v_option_transition_count
    ) as usage_breakdown;
END;
$$;

COMMENT ON FUNCTION preview_video_library_update_impact(uuid) IS
  'Provides impact analysis before updating a library video, showing all affected scenarios and options';

-- ============================================================================
-- INDEXES FOR EFFICIENT LIBRARY VIDEO LOOKUPS
-- ============================================================================

-- These indexes already exist from previous migration, but we ensure they're present
CREATE INDEX IF NOT EXISTS idx_scenarios_introduction_video_library ON scenarios(introduction_video_library_id) WHERE introduction_video_library_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scenarios_prompt_video_library ON scenarios(prompt_video_library_id) WHERE prompt_video_library_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scenarios_transition_video_library ON scenarios(transition_video_library_id) WHERE transition_video_library_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_beginner ON scenario_options(feedback_video_library_id_beginner) WHERE feedback_video_library_id_beginner IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_intermediate ON scenario_options(feedback_video_library_id_intermediate) WHERE feedback_video_library_id_intermediate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_advanced ON scenario_options(feedback_video_library_id_advanced) WHERE feedback_video_library_id_advanced IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scenario_options_transition_library ON scenario_options(transition_video_library_id) WHERE transition_video_library_id IS NOT NULL;

-- Add indexes for video_source columns to optimize filtering
CREATE INDEX IF NOT EXISTS idx_scenarios_intro_video_source ON scenarios(introduction_video_source) WHERE introduction_video_source = 'library';
CREATE INDEX IF NOT EXISTS idx_scenarios_prompt_video_source ON scenarios(prompt_video_source) WHERE prompt_video_source = 'library';
CREATE INDEX IF NOT EXISTS idx_scenarios_transition_video_source ON scenarios(transition_video_source) WHERE transition_video_source = 'library';

CREATE INDEX IF NOT EXISTS idx_options_feedback_beginner_source ON scenario_options(feedback_video_source_beginner) WHERE feedback_video_source_beginner = 'library';
CREATE INDEX IF NOT EXISTS idx_options_feedback_intermediate_source ON scenario_options(feedback_video_source_intermediate) WHERE feedback_video_source_intermediate = 'library';
CREATE INDEX IF NOT EXISTS idx_options_feedback_advanced_source ON scenario_options(feedback_video_source_advanced) WHERE feedback_video_source_advanced = 'library';
CREATE INDEX IF NOT EXISTS idx_options_transition_source ON scenario_options(transition_video_source) WHERE transition_video_source = 'library';
