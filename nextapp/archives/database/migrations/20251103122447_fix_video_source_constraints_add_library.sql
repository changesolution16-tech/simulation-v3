/*
  # Fix Video Source Constraints to Allow 'library'

  ## Overview
  The video_source check constraints currently only allow 'url', 'embed', and 'upload'.
  This prevents scenarios from linking to the video library.
  
  This migration updates all video_source constraints to include 'library' as a valid value.

  ## Changes
  1. Update scenarios table constraints for all video_source columns
  2. Update scenario_options table constraints for all video_source columns
  
  ## Security
  - Maintains data integrity with proper check constraints
  - No impact on existing RLS policies
*/

-- ============================================================================
-- UPDATE SCENARIOS TABLE CONSTRAINTS
-- ============================================================================

-- Drop and recreate constraints with 'library' option

-- Introduction video source
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_introduction_video_source_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_introduction_video_source_check 
  CHECK (introduction_video_source = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

-- Prompt video source
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_prompt_video_source_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_prompt_video_source_check 
  CHECK (prompt_video_source = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

-- Transition video source
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_transition_video_source_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_transition_video_source_check 
  CHECK (transition_video_source = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

-- Conclusion video source (if exists)
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_conclusion_video_source_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_conclusion_video_source_check 
  CHECK (conclusion_video_source = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

-- ============================================================================
-- UPDATE SCENARIO_OPTIONS TABLE CONSTRAINTS
-- ============================================================================

-- Feedback video sources
ALTER TABLE scenario_options DROP CONSTRAINT IF EXISTS scenario_options_feedback_video_source_beginner_check;
ALTER TABLE scenario_options ADD CONSTRAINT scenario_options_feedback_video_source_beginner_check 
  CHECK (feedback_video_source_beginner = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

ALTER TABLE scenario_options DROP CONSTRAINT IF EXISTS scenario_options_feedback_video_source_intermediate_check;
ALTER TABLE scenario_options ADD CONSTRAINT scenario_options_feedback_video_source_intermediate_check 
  CHECK (feedback_video_source_intermediate = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

ALTER TABLE scenario_options DROP CONSTRAINT IF EXISTS scenario_options_feedback_video_source_advanced_check;
ALTER TABLE scenario_options ADD CONSTRAINT scenario_options_feedback_video_source_advanced_check 
  CHECK (feedback_video_source_advanced = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

-- Transition video source
ALTER TABLE scenario_options DROP CONSTRAINT IF EXISTS scenario_options_transition_video_source_check;
ALTER TABLE scenario_options ADD CONSTRAINT scenario_options_transition_video_source_check 
  CHECK (transition_video_source = ANY (ARRAY['url'::text, 'embed'::text, 'upload'::text, 'library'::text]));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify constraints are updated
DO $$
BEGIN
  RAISE NOTICE 'Video source constraints updated to allow library references';
  RAISE NOTICE 'Scenarios can now be linked to video library for automatic updates';
END $$;
