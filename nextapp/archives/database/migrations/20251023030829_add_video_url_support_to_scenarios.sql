/*
  # Add Video URL Support for Scenarios
  
  1. Schema Changes
    - Add video URL columns to `scenarios` table for prompt and transition videos
    - Add video URL columns to `scenario_options` table for feedback videos at each difficulty
    - Add `video_watch_tracking` table to monitor learner video completion
    - Add video metadata columns for duration and thumbnails
  
  2. New Tables
    - `video_watch_tracking` - Track which videos learners have watched and completion percentage
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `scenario_id` (uuid, references scenarios)
      - `option_id` (uuid, references scenario_options, nullable)
      - `video_type` (text: 'prompt', 'feedback', 'transition')
      - `watch_percentage` (numeric)
      - `completed` (boolean)
      - `watch_duration_seconds` (integer)
      - `watched_at` (timestamptz)
  
  3. Security
    - Enable RLS on `video_watch_tracking` table
    - Users can view and insert their own watch records
    - Instructors and admins can view all watch records
  
  4. Performance
    - Add indexes on foreign keys
    - Add composite index for user video lookup
*/

-- ============================================================================
-- ADD VIDEO COLUMNS TO SCENARIOS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_url'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_duration'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_duration integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'prompt_video_thumbnail'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN prompt_video_thumbnail text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_url'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'transition_video_duration'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN transition_video_duration integer;
  END IF;
END $$;

-- ============================================================================
-- ADD VIDEO COLUMNS TO SCENARIO_OPTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_beginner'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_intermediate'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_advanced'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_advanced text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_duration'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_duration integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_video_thumbnail'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_video_thumbnail text;
  END IF;
END $$;

-- ============================================================================
-- CREATE VIDEO WATCH TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_watch_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE,
  option_id uuid REFERENCES scenario_options(id) ON DELETE CASCADE,
  video_type text NOT NULL CHECK (video_type IN ('prompt', 'feedback', 'transition', 'introduction')),
  watch_percentage numeric(5,2) DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  watch_duration_seconds integer DEFAULT 0,
  watched_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (scenario_id IS NOT NULL AND option_id IS NULL AND video_type IN ('prompt', 'transition', 'introduction'))
    OR
    (scenario_id IS NULL AND option_id IS NOT NULL AND video_type = 'feedback')
  )
);

CREATE INDEX IF NOT EXISTS idx_video_watch_tracking_user ON video_watch_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_tracking_scenario ON video_watch_tracking(scenario_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_tracking_option ON video_watch_tracking(option_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_tracking_user_scenario ON video_watch_tracking(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_tracking_completed ON video_watch_tracking(completed);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE video_watch_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video watch records"
  ON video_watch_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own video watch records"
  ON video_watch_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own video watch records"
  ON video_watch_tracking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can view all video watch records"
  ON video_watch_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_video_watch_tracking_updated_at 
  BEFORE UPDATE ON video_watch_tracking
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
