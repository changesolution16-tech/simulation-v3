/*
  # Add Simulation Landing Pages and Resume Functionality

  1. Changes to Existing Tables
    - Add landing page content fields to `scenarios` table
    - Fields include video URL, title, description, objectives, role description
    - Separate content for each difficulty level (beginner, intermediate, advanced)
    - Add fiction contract text and estimated duration

  2. New Tables
    - `landing_page_progress`
      - Tracks user progress through landing pages
      - Stores video watch status, fiction contract agreement
      - Enables resume functionality
      - Stores last position in simulation flow

  3. Security
    - Enable RLS on `landing_page_progress` table
    - Users can only read/update their own progress
    - Admins can view all progress for analytics
*/

-- Add landing page fields to scenarios table
DO $$
BEGIN
  -- Landing page video URLs per difficulty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_video_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_video_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_video_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_video_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_video_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_video_advanced text;
  END IF;

  -- Landing page titles per difficulty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_title_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_title_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_title_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_title_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_title_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_title_advanced text;
  END IF;

  -- Landing page descriptions per difficulty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_description_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_description_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_description_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_description_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_description_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_description_advanced text;
  END IF;

  -- Learning objectives per difficulty (JSONB array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_objectives_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_objectives_beginner jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_objectives_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_objectives_intermediate jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_objectives_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_objectives_advanced jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Role descriptions per difficulty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'role_description_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN role_description_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'role_description_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN role_description_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'role_description_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN role_description_advanced text;
  END IF;

  -- Fiction contract text (same for all difficulties)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'fiction_contract_text'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN fiction_contract_text text DEFAULT 'I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences.';
  END IF;

  -- Estimated duration per difficulty (in minutes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'estimated_duration_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN estimated_duration_beginner integer DEFAULT 20;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'estimated_duration_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN estimated_duration_intermediate integer DEFAULT 25;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'estimated_duration_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN estimated_duration_advanced integer DEFAULT 30;
  END IF;
END $$;

-- Create landing_page_progress table
CREATE TABLE IF NOT EXISTS landing_page_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  video_watched boolean DEFAULT false,
  video_watch_percentage integer DEFAULT 0,
  video_skipped boolean DEFAULT false,
  fiction_contract_agreed boolean DEFAULT false,
  fiction_contract_agreed_at timestamptz,
  last_section_viewed text,
  ready_to_start boolean DEFAULT false,
  current_scenario_id text,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_id, difficulty)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_landing_page_progress_user_topic ON landing_page_progress(user_id, topic_id, difficulty);

-- Enable RLS
ALTER TABLE landing_page_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own landing page progress"
  ON landing_page_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own landing page progress"
  ON landing_page_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own landing page progress"
  ON landing_page_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete own landing page progress"
  ON landing_page_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all progress for analytics
CREATE POLICY "Admins can read all landing page progress"
  ON landing_page_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_page_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_landing_page_progress_updated_at_trigger ON landing_page_progress;
CREATE TRIGGER update_landing_page_progress_updated_at_trigger
  BEFORE UPDATE ON landing_page_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_progress_updated_at();
