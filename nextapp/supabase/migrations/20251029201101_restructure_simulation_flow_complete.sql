/*
  # Complete Simulation Flow Architecture

  ## Overview
  This migration restructures the database to support the complete simulation flow:
  1. Simulation Landing Page (image, title, description, objectives, start button)
  2. Simulation Introduction Page (title, journey video, role description, participation agreement)
  3. Scenario Introduction → Question → Feedback → Transition (repeating for each scenario)
  4. Results Page

  ## Changes

  1. Simulations Table Enhancements
    - Ensure all landing page fields exist with proper naming
    - Add simulation introduction video fields
    - Add columns to track learner agreement to participate

  2. Scenarios Table Enhancements
    - Ensure consistent video URL column naming
    - Add indexes for scenario connections via next_scenario_id

  3. Scenario Options Table Enhancements
    - Verify next_scenario_id foreign key exists and is properly constrained
    - Ensure feedback video columns use consistent naming

  4. Helper Functions
    - Create function to get next scenario in simulation flow
    - Create function to validate simulation flow completeness
    - Create function to resolve video URLs from various sources

  ## Security
  - Maintain existing RLS policies
  - No changes to access control
*/

-- ============================================================================
-- SIMULATIONS TABLE ENHANCEMENTS
-- ============================================================================

DO $$
BEGIN
  -- Ensure landing page image columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_image_url'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_image_alt'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_image_alt text;
  END IF;

  -- Ensure introduction video columns exist (separate from landing page video)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'introduction_video_url'
  ) THEN
    ALTER TABLE simulations ADD COLUMN introduction_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'introduction_video_type'
  ) THEN
    ALTER TABLE simulations ADD COLUMN introduction_video_type text
      CHECK (introduction_video_type IN ('youtube', 'synthesia', 'vimeo', 'file', 'embed'))
      DEFAULT 'synthesia';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'introduction_video_source'
  ) THEN
    ALTER TABLE simulations ADD COLUMN introduction_video_source text
      CHECK (introduction_video_source IN ('url', 'embed', 'upload', 'library'));
  END IF;

  -- Add simulation introduction page configuration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'introduction_page_enabled'
  ) THEN
    ALTER TABLE simulations ADD COLUMN introduction_page_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'introduction_title'
  ) THEN
    ALTER TABLE simulations ADD COLUMN introduction_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'introduction_description'
  ) THEN
    ALTER TABLE simulations ADD COLUMN introduction_description text;
  END IF;

END $$;

-- ============================================================================
-- SCENARIOS TABLE ENHANCEMENTS
-- ============================================================================

DO $$
BEGIN
  -- Ensure scenario video URL columns exist with consistent naming
  -- These should already exist from previous migrations, but we verify here

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_url'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_url'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_url'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_url text;
  END IF;

  -- Add timer configuration columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_enabled'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_visible'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_visible boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_type'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_type text
      CHECK (timer_type IN ('count_up', 'count_down'))
      DEFAULT 'count_up';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_limit_seconds'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_limit_seconds integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_warning_threshold_seconds'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_warning_threshold_seconds integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_display_location'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_display_location text
      CHECK (timer_display_location IN ('question_page', 'feedback_page', 'all'))
      DEFAULT 'all';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'show_timer_in_feedback'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN show_timer_in_feedback boolean DEFAULT false;
  END IF;

END $$;

-- ============================================================================
-- SCENARIO OPTIONS TABLE ENHANCEMENTS
-- ============================================================================

DO $$
BEGIN
  -- Verify next_scenario_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'next_scenario_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN next_scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL;
  END IF;

  -- Ensure feedback video URL columns exist with consistent naming
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_url_beginner'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_url_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_url_intermediate'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_url_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_url_advanced'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_url_advanced text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_url'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_url text;
  END IF;

END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Simulation video references
CREATE INDEX IF NOT EXISTS idx_simulations_introduction_video ON simulations(introduction_video_url) WHERE introduction_video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_simulations_landing_video ON simulations(landing_intro_video_url) WHERE landing_intro_video_url IS NOT NULL;

-- Scenario connections for flow navigation
CREATE INDEX IF NOT EXISTS idx_scenario_options_next_scenario ON scenario_options(next_scenario_id) WHERE next_scenario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scenarios_is_end ON scenarios(is_end_scenario) WHERE is_end_scenario = true;

-- Simulation scenarios for flow tracking
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_entry_point ON simulation_scenarios(simulation_id, is_entry_point) WHERE is_entry_point = true;
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_exit_point ON simulation_scenarios(simulation_id, is_exit_point) WHERE is_exit_point = true;

-- ============================================================================
-- HELPER FUNCTION: Get Next Scenario in Simulation Flow
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_scenario_in_simulation(
  p_simulation_id uuid,
  p_current_scenario_id uuid,
  p_selected_option_id uuid
)
RETURNS TABLE (
  next_scenario_id uuid,
  next_scenario_index integer,
  is_end_of_simulation boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_scenario_id uuid;
  v_is_exit_point boolean;
BEGIN
  -- Get the next scenario ID from the selected option
  SELECT so.next_scenario_id
  INTO v_next_scenario_id
  FROM scenario_options so
  WHERE so.id = p_selected_option_id;

  -- Check if current scenario is marked as exit point
  SELECT ss.is_exit_point
  INTO v_is_exit_point
  FROM simulation_scenarios ss
  WHERE ss.simulation_id = p_simulation_id
    AND ss.scenario_id = p_current_scenario_id;

  -- If it's an exit point or there's no next scenario, end the simulation
  IF v_is_exit_point OR v_next_scenario_id IS NULL THEN
    RETURN QUERY
    SELECT
      NULL::uuid as next_scenario_id,
      -1 as next_scenario_index,
      true as is_end_of_simulation;
    RETURN;
  END IF;

  -- Find the index of the next scenario in the simulation
  RETURN QUERY
  WITH ordered_scenarios AS (
    SELECT
      ss.scenario_id,
      ROW_NUMBER() OVER (ORDER BY
        CASE WHEN ss.is_entry_point THEN 0 ELSE 1 END,
        ss.sequence_order
      ) - 1 as scenario_index
    FROM simulation_scenarios ss
    WHERE ss.simulation_id = p_simulation_id
  )
  SELECT
    v_next_scenario_id as next_scenario_id,
    COALESCE(os.scenario_index, -1)::integer as next_scenario_index,
    false as is_end_of_simulation
  FROM ordered_scenarios os
  WHERE os.scenario_id = v_next_scenario_id;

END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Validate Simulation Flow Completeness
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_simulation_flow(p_simulation_id uuid)
RETURNS TABLE (
  is_valid boolean,
  error_message text,
  warning_message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry_point_count integer;
  v_scenario_count integer;
  v_orphaned_scenarios integer;
  v_dead_end_scenarios integer;
BEGIN
  -- Count entry points
  SELECT COUNT(*)
  INTO v_entry_point_count
  FROM simulation_scenarios
  WHERE simulation_id = p_simulation_id
    AND is_entry_point = true;

  -- Count total scenarios
  SELECT COUNT(*)
  INTO v_scenario_count
  FROM simulation_scenarios
  WHERE simulation_id = p_simulation_id;

  -- Count orphaned scenarios (not reachable from entry point)
  SELECT COUNT(DISTINCT ss.scenario_id)
  INTO v_orphaned_scenarios
  FROM simulation_scenarios ss
  WHERE ss.simulation_id = p_simulation_id
    AND ss.is_entry_point = false
    AND NOT EXISTS (
      SELECT 1
      FROM scenario_options so
      JOIN simulation_scenarios ss2 ON ss2.scenario_id = so.scenario_id
      WHERE ss2.simulation_id = p_simulation_id
        AND so.next_scenario_id = ss.scenario_id
    );

  -- Count dead-end scenarios (no exit point, no next scenario)
  SELECT COUNT(DISTINCT ss.scenario_id)
  INTO v_dead_end_scenarios
  FROM simulation_scenarios ss
  WHERE ss.simulation_id = p_simulation_id
    AND ss.is_exit_point = false
    AND NOT EXISTS (
      SELECT 1
      FROM scenario_options so
      WHERE so.scenario_id = ss.scenario_id
        AND so.next_scenario_id IS NOT NULL
    );

  -- Return validation results
  IF v_entry_point_count = 0 THEN
    RETURN QUERY SELECT false, 'No entry point defined for simulation'::text, NULL::text;
  ELSIF v_entry_point_count > 1 THEN
    RETURN QUERY SELECT false, 'Multiple entry points defined - only one allowed'::text, NULL::text;
  ELSIF v_scenario_count = 0 THEN
    RETURN QUERY SELECT false, 'No scenarios added to simulation'::text, NULL::text;
  ELSIF v_orphaned_scenarios > 0 THEN
    RETURN QUERY SELECT true, NULL::text,
      format('%s scenario(s) are not reachable from the entry point', v_orphaned_scenarios);
  ELSIF v_dead_end_scenarios > 0 THEN
    RETURN QUERY SELECT true, NULL::text,
      format('%s scenario(s) have no exit point or next scenario defined', v_dead_end_scenarios);
  ELSE
    RETURN QUERY SELECT true, NULL::text, NULL::text;
  END IF;

END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get Scenario Video URL (resolves from multiple sources)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_scenario_video_url(
  p_scenario_id uuid,
  p_video_type text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_video_url text;
  v_video_source text;
  v_library_id uuid;
BEGIN
  -- Get the video URL based on type
  IF p_video_type = 'introduction' THEN
    SELECT introduction_video_url, introduction_video_source, introduction_video_library_id
    INTO v_video_url, v_video_source, v_library_id
    FROM scenarios
    WHERE id = p_scenario_id;
  ELSIF p_video_type = 'prompt' THEN
    SELECT prompt_video_url, prompt_video_source, prompt_video_library_id
    INTO v_video_url, v_video_source, v_library_id
    FROM scenarios
    WHERE id = p_scenario_id;
  ELSIF p_video_type = 'transition' THEN
    SELECT transition_video_url, transition_video_source, transition_video_library_id
    INTO v_video_url, v_video_source, v_library_id
    FROM scenarios
    WHERE id = p_scenario_id;
  END IF;

  -- If source is library, resolve from video_library table
  IF v_video_source = 'library' AND v_library_id IS NOT NULL THEN
    SELECT video_url INTO v_video_url
    FROM video_library
    WHERE id = v_library_id;
  END IF;

  RETURN v_video_url;
END;
$$;

-- ============================================================================
-- COMMENT ON FUNCTIONS
-- ============================================================================

COMMENT ON FUNCTION get_next_scenario_in_simulation IS
  'Returns the next scenario in a simulation flow based on the selected option, or indicates end of simulation';

COMMENT ON FUNCTION validate_simulation_flow IS
  'Validates that a simulation has a complete and valid flow with proper entry/exit points';

COMMENT ON FUNCTION get_scenario_video_url IS
  'Resolves scenario video URL from direct URL or library reference';
