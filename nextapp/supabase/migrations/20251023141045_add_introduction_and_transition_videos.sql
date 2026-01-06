/*
  # Add Introduction and Transition Video Support
  
  1. Schema Changes
    - Add introduction video fields to `scenarios` table
    - Add transition video fields to `scenario_options` table (response-specific)
    - Add `is_video_required` flag to `scenarios` for testing vs production mode
    - Add skip tracking to `video_watch_tracking` table
  
  2. New Columns for Scenarios
    - `introduction_video_url` - URL for scenario introduction video
    - `introduction_video_duration` - Duration in seconds
    - `introduction_video_thumbnail` - Thumbnail image URL
    - `is_video_required` - Boolean flag for mandatory video watching
  
  3. New Columns for Scenario Options
    - `transition_video_url` - Response-specific transition video URL
    - `transition_video_duration` - Duration in seconds
    - `transition_video_thumbnail` - Thumbnail image URL
  
  4. Enhancement to Video Watch Tracking
    - Add `was_skipped` boolean field to track skip events
    - Add `skip_reason` text field for testing notes
  
  5. Notes
    - Introduction videos play before prompt videos
    - Transition videos are response-specific (each option can have its own)
    - is_video_required defaults to false for testing, will be true for production
    - Skip tracking helps analyze testing patterns before launch
*/

-- ============================================================================
-- ADD INTRODUCTION VIDEO COLUMNS TO SCENARIOS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_url'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_duration'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_duration integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'introduction_video_thumbnail'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN introduction_video_thumbnail text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'is_video_required'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN is_video_required boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- ADD TRANSITION VIDEO COLUMNS TO SCENARIO_OPTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_url'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_duration'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_duration integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'transition_video_thumbnail'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN transition_video_thumbnail text;
  END IF;
END $$;

-- ============================================================================
-- ADD SKIP TRACKING COLUMNS TO VIDEO_WATCH_TRACKING TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'video_watch_tracking' AND column_name = 'was_skipped'
  ) THEN
    ALTER TABLE video_watch_tracking ADD COLUMN was_skipped boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'video_watch_tracking' AND column_name = 'skip_reason'
  ) THEN
    ALTER TABLE video_watch_tracking ADD COLUMN skip_reason text;
  END IF;
END $$;

-- ============================================================================
-- UPDATE VIDEO TYPE CHECK CONSTRAINT
-- ============================================================================

DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE video_watch_tracking DROP CONSTRAINT IF EXISTS video_watch_tracking_video_type_check;
  
  -- Add new constraint including 'introduction' type
  ALTER TABLE video_watch_tracking 
    ADD CONSTRAINT video_watch_tracking_video_type_check 
    CHECK (video_type IN ('prompt', 'feedback', 'transition', 'introduction'));
END $$;

-- ============================================================================
-- UPDATE TABLE CHECK CONSTRAINT FOR INTRODUCTION VIDEOS
-- ============================================================================

DO $$
BEGIN
  -- Drop old check constraint
  ALTER TABLE video_watch_tracking DROP CONSTRAINT IF EXISTS video_watch_tracking_check;
  
  -- Add updated constraint that includes introduction type
  ALTER TABLE video_watch_tracking 
    ADD CONSTRAINT video_watch_tracking_check 
    CHECK (
      (scenario_id IS NOT NULL AND option_id IS NULL AND video_type IN ('prompt', 'transition', 'introduction'))
      OR
      (scenario_id IS NULL AND option_id IS NOT NULL AND video_type = 'feedback')
      OR
      (scenario_id IS NULL AND option_id IS NOT NULL AND video_type = 'transition')
    );
END $$;