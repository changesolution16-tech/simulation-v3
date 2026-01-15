/*
  # Fix simulation_scenarios Table Schema

  Ensures the simulation_scenarios table has all required columns based on the
  actual INSERT operations in the codebase.

  Missing Columns Identified:
  - transition_video_url
  - transition_video_source
  - transition_video_library_id
  - updated_at (for tracking changes)

  These ALTER statements are idempotent and safe to run multiple times.
*/

-- Add transition_video_url if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_scenarios' AND column_name = 'transition_video_url'
  ) THEN
    ALTER TABLE simulation_scenarios ADD COLUMN transition_video_url text;
    COMMENT ON COLUMN simulation_scenarios.transition_video_url IS 'URL of the transition video shown when moving to next scenario';
  END IF;
END $$;

-- Add transition_video_source if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_scenarios' AND column_name = 'transition_video_source'
  ) THEN
    ALTER TABLE simulation_scenarios ADD COLUMN transition_video_source text DEFAULT 'url';
    COMMENT ON COLUMN simulation_scenarios.transition_video_source IS 'Source type of transition video (youtube, url, library, etc.)';
  END IF;
END $$;

-- Add transition_video_library_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_scenarios' AND column_name = 'transition_video_library_id'
  ) THEN
    ALTER TABLE simulation_scenarios ADD COLUMN transition_video_library_id uuid;
    COMMENT ON COLUMN simulation_scenarios.transition_video_library_id IS 'Reference to video library entry for transition video';
  END IF;
END $$;

-- Add updated_at if it doesn't exist (for tracking changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_scenarios' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE simulation_scenarios ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    COMMENT ON COLUMN simulation_scenarios.updated_at IS 'Timestamp of last update to this scenario';
  END IF;
END $$;

-- Ensure scenario_id foreign key is properly set (should reference scenarios table)
-- Note: Based on the code, simulation_scenarios.id is used as scenario_id in queries
-- The scenario_id column might be vestigial or used differently

-- Ensure all existing rows have updated_at set if they don't have one
DO $$
BEGIN
  UPDATE simulation_scenarios
  SET updated_at = created_at
  WHERE updated_at IS NULL;
END $$;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_simulation_id ON simulation_scenarios(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_order_index ON simulation_scenarios(order_index);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_hierarchy_level ON simulation_scenarios(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_video_library_id ON simulation_scenarios(video_library_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_intro_video_library_id ON simulation_scenarios(introduction_video_library_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_transition_video_library_id ON simulation_scenarios(transition_video_library_id);

-- Add table and column comments for documentation
COMMENT ON TABLE simulation_scenarios IS 'Junction table storing scenarios within simulations. Each row represents a decision point in the simulation flow.';

COMMENT ON COLUMN simulation_scenarios.id IS 'Primary key - used as scenario_id in most queries';
COMMENT ON COLUMN simulation_scenarios.simulation_id IS 'Foreign key to simulations table';
COMMENT ON COLUMN simulation_scenarios.scenario_id IS 'Foreign key to scenarios table (legacy/optional)';
COMMENT ON COLUMN simulation_scenarios.scenario_name IS 'Display name of the scenario';
COMMENT ON COLUMN simulation_scenarios.question_text IS 'The decision question shown to learners';
COMMENT ON COLUMN simulation_scenarios.hierarchy_level IS 'Organizational level (1-5) for this scenario';
COMMENT ON COLUMN simulation_scenarios.order_index IS 'Ordering of scenarios within the simulation';
COMMENT ON COLUMN simulation_scenarios.has_timer IS 'Whether this scenario has a decision timer';
COMMENT ON COLUMN simulation_scenarios.timer_seconds IS 'Time limit in seconds for decision';
COMMENT ON COLUMN simulation_scenarios.video_url IS 'Main video URL (prompt/question video)';
COMMENT ON COLUMN simulation_scenarios.video_source IS 'Source type of main video';
COMMENT ON COLUMN simulation_scenarios.video_library_id IS 'Reference to main video in library';
COMMENT ON COLUMN simulation_scenarios.introduction_video_url IS 'URL of introduction video shown before question';
COMMENT ON COLUMN simulation_scenarios.introduction_video_source IS 'Source type of introduction video';
COMMENT ON COLUMN simulation_scenarios.introduction_video_library_id IS 'Reference to introduction video in library';
COMMENT ON COLUMN simulation_scenarios.is_entry_point IS 'Whether this is a starting scenario';
COMMENT ON COLUMN simulation_scenarios.is_exit_point IS 'Whether this is an ending scenario';

-- Show current schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'simulation_scenarios'
  AND table_schema = 'public'
ORDER BY ordinal_position;
