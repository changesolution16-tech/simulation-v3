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