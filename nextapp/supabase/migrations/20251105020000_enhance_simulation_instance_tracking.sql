/*
  # Enhanced Simulation Instance Tracking

  This migration enhances the simulation_instances table to capture complete session state
  for better persistence, recovery, and analytics.

  ## Changes

  1. Add Session State Fields
    - `simulation_id` - Link to the simulation template being played
    - `current_scenario_id` - Track exact position in simulation
    - `current_scenario_index` - Sequence position for ordered tracking
    - `session_data` - JSONB for storing complete session state
    - `last_activity_at` - Track session activity for timeout management

  2. Add Timer and Engagement Fields
    - `total_decision_time_seconds` - Sum of all decision times
    - `video_watch_time_seconds` - Total time spent watching videos
    - `pause_count` - Track simulation interruptions
    - `resume_count` - Track simulation resumptions

  3. Add Progress Tracking Fields
    - `competency_scores` - JSONB storing real-time competency progress
    - `decision_history` - JSONB array of all decisions made
    - `path_taken` - Array of scenario IDs representing the path

  4. Add Performance Indexes
    - Index on simulation_id for querying by template
    - Index on current_scenario_id for resume functionality
    - Index on last_activity_at for cleanup and analytics

  5. Create Helper Functions
    - Function to update session state automatically
    - Function to restore session from database
    - Function to clean up abandoned sessions
*/

-- Add new fields to simulation_instances table
DO $$
BEGIN
  -- Simulation reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'simulation_id'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN simulation_id uuid REFERENCES simulations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_simulation_instances_simulation ON simulation_instances(simulation_id);
  END IF;

  -- Current position tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'current_scenario_id'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN current_scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_simulation_instances_current_scenario ON simulation_instances(current_scenario_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'current_scenario_index'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN current_scenario_index integer DEFAULT 0;
  END IF;

  -- Session state storage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'session_data'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN session_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN last_activity_at timestamptz DEFAULT now();
    CREATE INDEX IF NOT EXISTS idx_simulation_instances_last_activity ON simulation_instances(last_activity_at);
  END IF;

  -- Timer and engagement tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'total_decision_time_seconds'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN total_decision_time_seconds integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'video_watch_time_seconds'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN video_watch_time_seconds integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'pause_count'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN pause_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'resume_count'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN resume_count integer DEFAULT 0;
  END IF;

  -- Progress tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'competency_scores'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN competency_scores jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'decision_history'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN decision_history jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'path_taken'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN path_taken uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN simulation_instances.simulation_id IS
  'Reference to the simulation template being played';

COMMENT ON COLUMN simulation_instances.current_scenario_id IS
  'The scenario the learner is currently on (for resume functionality)';

COMMENT ON COLUMN simulation_instances.current_scenario_index IS
  'The index position in the simulation flow';

COMMENT ON COLUMN simulation_instances.session_data IS
  'Complete session state for restoration after page refresh or disconnect';

COMMENT ON COLUMN simulation_instances.last_activity_at IS
  'Last time the learner interacted with this simulation (for timeout detection)';

COMMENT ON COLUMN simulation_instances.total_decision_time_seconds IS
  'Sum of all time_to_decision_seconds for this simulation';

COMMENT ON COLUMN simulation_instances.video_watch_time_seconds IS
  'Total time spent watching videos in this simulation';

COMMENT ON COLUMN simulation_instances.competency_scores IS
  'Real-time competency score tracking throughout the simulation';

COMMENT ON COLUMN simulation_instances.decision_history IS
  'Array of decision objects with timestamps and metadata';

COMMENT ON COLUMN simulation_instances.path_taken IS
  'Ordered array of scenario IDs representing the learner''s path';

-- Function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_simulation_instance_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE simulation_instances
  SET last_activity_at = now()
  WHERE id = NEW.instance_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last activity when responses are recorded
DROP TRIGGER IF EXISTS trigger_update_instance_activity ON learner_responses;
CREATE TRIGGER trigger_update_instance_activity
  AFTER INSERT ON learner_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_instance_activity();

-- Function to sync session state to database
CREATE OR REPLACE FUNCTION sync_simulation_session_state(
  p_instance_id uuid,
  p_current_scenario_id uuid,
  p_current_scenario_index integer,
  p_session_data jsonb,
  p_competency_scores jsonb,
  p_decision_history jsonb,
  p_path_taken uuid[]
)
RETURNS boolean AS $$
BEGIN
  UPDATE simulation_instances
  SET
    current_scenario_id = p_current_scenario_id,
    current_scenario_index = p_current_scenario_index,
    session_data = p_session_data,
    competency_scores = p_competency_scores,
    decision_history = p_decision_history,
    path_taken = p_path_taken,
    last_activity_at = now()
  WHERE id = p_instance_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore session state from database
CREATE OR REPLACE FUNCTION get_simulation_session_state(p_instance_id uuid)
RETURNS TABLE (
  instance_id uuid,
  simulation_id uuid,
  current_scenario_id uuid,
  current_scenario_index integer,
  session_data jsonb,
  competency_scores jsonb,
  decision_history jsonb,
  path_taken uuid[],
  started_at timestamptz,
  last_activity_at timestamptz,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.simulation_id,
    si.current_scenario_id,
    si.current_scenario_index,
    si.session_data,
    si.competency_scores,
    si.decision_history,
    si.path_taken,
    si.started_at,
    si.last_activity_at,
    si.status
  FROM simulation_instances si
  WHERE si.id = p_instance_id
    AND si.status = 'in_progress';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up abandoned sessions (inactive for > 24 hours)
CREATE OR REPLACE FUNCTION mark_abandoned_simulation_instances()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE simulation_instances
  SET
    status = 'abandoned',
    completed_at = now()
  WHERE status = 'in_progress'
    AND last_activity_at < now() - interval '24 hours'
    AND completed_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION sync_simulation_session_state TO authenticated;
GRANT EXECUTE ON FUNCTION get_simulation_session_state TO authenticated;
GRANT EXECUTE ON FUNCTION mark_abandoned_simulation_instances TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION sync_simulation_session_state IS
  'Updates simulation instance with current session state for persistence and recovery';

COMMENT ON FUNCTION get_simulation_session_state IS
  'Retrieves complete session state for resuming a simulation after refresh or disconnect';

COMMENT ON FUNCTION mark_abandoned_simulation_instances IS
  'Marks simulation instances as abandoned if inactive for more than 24 hours';
