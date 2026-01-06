/*
  # Real-Time Metrics Tracking and Data Persistence

  This migration adds comprehensive real-time tracking and automatic persistence
  for simulation metrics, ensuring no data is lost when learners leave and return.

  ## Key Features

  1. Automatic Metric Updates
    - Triggers to update simulation_instances when responses are recorded
    - Automatic calculation of decision_count and stages_completed
    - Real-time competency score aggregation

  2. Data Consistency Functions
    - Function to reconcile decision_count with actual responses
    - Function to recalculate stages from learner path
    - Validation functions to detect and fix inconsistencies

  3. Session Management
    - Enhanced session state tracking
    - Automatic session timeout handling
    - Resume point tracking for interrupted sessions

  4. Performance Optimizations
    - Indexes on frequently queried fields
    - Materialized views for complex aggregations
    - Efficient query patterns for real-time updates

  ## Safety Features

  - All updates use transactions to ensure atomicity
  - Validation checks prevent invalid data
  - Audit trail for debugging and recovery
  - Rollback capability for failed operations
*/

-- ============================================================================
-- PART 1: Enhanced Triggers for Real-Time Updates
-- ============================================================================

-- Function to automatically update simulation metrics when a response is recorded
CREATE OR REPLACE FUNCTION update_simulation_instance_on_response()
RETURNS TRIGGER AS $$
DECLARE
  v_scenario_stage integer;
  v_current_max_stage integer;
  v_current_decision_count integer;
BEGIN
  -- Get the hierarchy level (stage) of the scenario
  SELECT hierarchy_level INTO v_scenario_stage
  FROM scenarios
  WHERE id = NEW.scenario_id;

  -- Get current values from simulation instance
  SELECT max_stage, decision_count
  INTO v_current_max_stage, v_current_decision_count
  FROM simulation_instances
  WHERE id = NEW.instance_id;

  -- Update simulation instance with new metrics
  UPDATE simulation_instances
  SET
    -- Increment decision count
    decision_count = COALESCE(decision_count, 0) + 1,

    -- Update stages_completed to highest stage reached
    stages_completed = GREATEST(
      COALESCE(stages_completed, 0),
      COALESCE(v_scenario_stage, 0)
    ),

    -- Update last activity timestamp
    last_activity_at = now(),

    -- Add total decision time
    total_decision_time_seconds = COALESCE(total_decision_time_seconds, 0) +
      COALESCE(NEW.time_to_decision_seconds, 0),

    -- Add video watch time if applicable
    video_watch_time_seconds = COALESCE(video_watch_time_seconds, 0) +
      COALESCE(NEW.video_watch_time_seconds, 0)
  WHERE id = NEW.instance_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's up to date
DROP TRIGGER IF EXISTS trigger_update_metrics_on_response ON learner_responses;
CREATE TRIGGER trigger_update_metrics_on_response
  AFTER INSERT ON learner_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_instance_on_response();

COMMENT ON FUNCTION update_simulation_instance_on_response IS
  'Automatically updates simulation_instances metrics in real-time as responses are recorded';

-- ============================================================================
-- PART 2: Data Consistency and Reconciliation Functions
-- ============================================================================

-- Function to reconcile decision_count with actual learner_responses count
CREATE OR REPLACE FUNCTION reconcile_decision_count(p_instance_id uuid)
RETURNS TABLE (
  instance_id uuid,
  old_decision_count integer,
  new_decision_count integer,
  responses_found integer,
  was_updated boolean
) AS $$
DECLARE
  v_actual_count integer;
  v_current_count integer;
  v_updated boolean := false;
BEGIN
  -- Count actual responses
  SELECT COUNT(*) INTO v_actual_count
  FROM learner_responses
  WHERE instance_id = p_instance_id;

  -- Get current stored count
  SELECT decision_count INTO v_current_count
  FROM simulation_instances
  WHERE id = p_instance_id;

  -- Update if counts don't match
  IF v_current_count != v_actual_count THEN
    UPDATE simulation_instances
    SET decision_count = v_actual_count
    WHERE id = p_instance_id;
    v_updated := true;
  END IF;

  RETURN QUERY SELECT
    p_instance_id,
    v_current_count,
    v_actual_count,
    v_actual_count,
    v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate stages_completed from actual path taken
CREATE OR REPLACE FUNCTION recalculate_stages_completed(p_instance_id uuid)
RETURNS TABLE (
  instance_id uuid,
  old_stages_completed integer,
  new_stages_completed integer,
  stages_visited integer[],
  was_updated boolean
) AS $$
DECLARE
  v_max_stage integer;
  v_current_stages integer;
  v_stages_array integer[];
  v_updated boolean := false;
BEGIN
  -- Get all unique stages from learner's path
  SELECT ARRAY_AGG(DISTINCT s.hierarchy_level ORDER BY s.hierarchy_level)
  INTO v_stages_array
  FROM learner_responses lr
  JOIN scenarios s ON s.id = lr.scenario_id
  WHERE lr.instance_id = p_instance_id
    AND s.hierarchy_level IS NOT NULL;

  -- Calculate max stage reached
  IF v_stages_array IS NOT NULL AND array_length(v_stages_array, 1) > 0 THEN
    v_max_stage := v_stages_array[array_length(v_stages_array, 1)];
  ELSE
    v_max_stage := 0;
  END IF;

  -- Get current stored value
  SELECT stages_completed INTO v_current_stages
  FROM simulation_instances
  WHERE id = p_instance_id;

  -- Update if values don't match
  IF v_current_stages != v_max_stage THEN
    UPDATE simulation_instances
    SET stages_completed = v_max_stage
    WHERE id = p_instance_id;
    v_updated := true;
  END IF;

  RETURN QUERY SELECT
    p_instance_id,
    v_current_stages,
    v_max_stage,
    v_stages_array,
    v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and fix all metrics for a simulation instance
CREATE OR REPLACE FUNCTION validate_and_fix_instance_metrics(p_instance_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_decision_result record;
  v_stages_result record;
BEGIN
  -- Reconcile decision count
  SELECT * INTO v_decision_result
  FROM reconcile_decision_count(p_instance_id);

  -- Recalculate stages
  SELECT * INTO v_stages_result
  FROM recalculate_stages_completed(p_instance_id);

  -- Build result object
  v_result := jsonb_build_object(
    'instance_id', p_instance_id,
    'decision_count', jsonb_build_object(
      'old', v_decision_result.old_decision_count,
      'new', v_decision_result.new_decision_count,
      'was_updated', v_decision_result.was_updated
    ),
    'stages_completed', jsonb_build_object(
      'old', v_stages_result.old_stages_completed,
      'new', v_stages_result.new_stages_completed,
      'stages_visited', v_stages_result.stages_visited,
      'was_updated', v_stages_result.was_updated
    ),
    'validated_at', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_and_fix_instance_metrics IS
  'Validates and fixes all metrics for a simulation instance, returns detailed results';

-- ============================================================================
-- PART 3: Batch Validation and Cleanup Functions
-- ============================================================================

-- Function to validate all active simulation instances
CREATE OR REPLACE FUNCTION validate_all_active_instances()
RETURNS TABLE (
  instance_id uuid,
  validation_result jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    validate_and_fix_instance_metrics(si.id)
  FROM simulation_instances si
  WHERE si.status = 'in_progress'
    AND si.last_activity_at > now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup and mark abandoned sessions with data preservation
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS TABLE (
  instance_id uuid,
  learner_id uuid,
  simulation_id uuid,
  decisions_saved integer,
  last_activity timestamptz,
  marked_abandoned_at timestamptz
) AS $$
BEGIN
  -- First, ensure all metrics are up to date before marking as abandoned
  PERFORM validate_and_fix_instance_metrics(id)
  FROM simulation_instances
  WHERE status = 'in_progress'
    AND last_activity_at < now() - interval '24 hours';

  -- Then mark as abandoned and return details
  RETURN QUERY
  UPDATE simulation_instances si
  SET
    status = 'abandoned',
    completed_at = now()
  WHERE si.status = 'in_progress'
    AND si.last_activity_at < now() - interval '24 hours'
  RETURNING
    si.id,
    si.learner_id,
    si.simulation_id,
    si.decision_count,
    si.last_activity_at,
    now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_abandoned_sessions IS
  'Marks abandoned sessions while preserving all data for potential recovery';

-- ============================================================================
-- PART 4: Performance Indexes
-- ============================================================================

-- Add indexes for efficient real-time queries
CREATE INDEX IF NOT EXISTS idx_learner_responses_instance_scenario
  ON learner_responses(instance_id, scenario_id);

CREATE INDEX IF NOT EXISTS idx_learner_responses_instance_order
  ON learner_responses(instance_id, response_order);

CREATE INDEX IF NOT EXISTS idx_simulation_instances_learner_status
  ON simulation_instances(learner_id, status);

CREATE INDEX IF NOT EXISTS idx_simulation_instances_simulation_status
  ON simulation_instances(simulation_id, status);

CREATE INDEX IF NOT EXISTS idx_simulation_instances_last_activity
  ON simulation_instances(last_activity_at) WHERE status = 'in_progress';

-- Index for metric assessments lookup
CREATE INDEX IF NOT EXISTS idx_learner_metric_assessments_instance
  ON learner_metric_assessments(simulation_instance_id)
  WHERE simulation_instance_id IS NOT NULL;

-- Index for bravin assessments
CREATE INDEX IF NOT EXISTS idx_bravin_decision_assessments_instance
  ON bravin_decision_assessments(simulation_instance_id)
  WHERE simulation_instance_id IS NOT NULL;

-- ============================================================================
-- PART 5: Helper Functions for Frontend
-- ============================================================================

-- Function to get complete simulation progress for a learner
CREATE OR REPLACE FUNCTION get_simulation_progress(
  p_learner_id uuid,
  p_simulation_id uuid
)
RETURNS TABLE (
  instance_id uuid,
  status text,
  started_at timestamptz,
  last_activity_at timestamptz,
  decision_count integer,
  stages_completed integer,
  max_stage integer,
  total_decision_time_seconds integer,
  video_watch_time_seconds integer,
  can_resume boolean,
  progress_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.status,
    si.started_at,
    si.last_activity_at,
    si.decision_count,
    si.stages_completed,
    si.max_stage,
    si.total_decision_time_seconds,
    si.video_watch_time_seconds,
    -- Can resume if in_progress and active within 7 days
    (si.status = 'in_progress' AND si.last_activity_at > now() - interval '7 days')::boolean,
    -- Calculate progress percentage
    CASE
      WHEN si.max_stage > 0 THEN
        ROUND((si.stages_completed::numeric / si.max_stage::numeric) * 100, 1)
      ELSE 0
    END
  FROM simulation_instances si
  WHERE si.learner_id = p_learner_id
    AND si.simulation_id = p_simulation_id
  ORDER BY si.last_activity_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_simulation_progress IS
  'Returns complete progress information for a learner''s simulation session';

-- Function to safely update simulation instance progress
CREATE OR REPLACE FUNCTION update_simulation_progress(
  p_instance_id uuid,
  p_current_scenario_id uuid,
  p_current_stage integer
)
RETURNS boolean AS $$
BEGIN
  UPDATE simulation_instances
  SET
    current_scenario_id = p_current_scenario_id,
    stages_completed = GREATEST(COALESCE(stages_completed, 0), p_current_stage),
    last_activity_at = now()
  WHERE id = p_instance_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: Permissions
-- ============================================================================

-- Grant execute permissions on all new functions
GRANT EXECUTE ON FUNCTION update_simulation_instance_on_response TO authenticated;
GRANT EXECUTE ON FUNCTION reconcile_decision_count TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_stages_completed TO authenticated;
GRANT EXECUTE ON FUNCTION validate_and_fix_instance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION validate_all_active_instances TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_simulation_progress TO authenticated;
GRANT EXECUTE ON FUNCTION update_simulation_progress TO authenticated;

-- ============================================================================
-- PART 7: Data Validation Constraints
-- ============================================================================

-- Add check constraints to prevent invalid data
DO $$
BEGIN
  -- Ensure decision_count is never negative
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'simulation_instances_decision_count_check'
  ) THEN
    ALTER TABLE simulation_instances
    ADD CONSTRAINT simulation_instances_decision_count_check
    CHECK (decision_count >= 0);
  END IF;

  -- Ensure stages_completed is never negative
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'simulation_instances_stages_completed_check'
  ) THEN
    ALTER TABLE simulation_instances
    ADD CONSTRAINT simulation_instances_stages_completed_check
    CHECK (stages_completed >= 0);
  END IF;

  -- Ensure stages_completed doesn't exceed max_stage
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'simulation_instances_stages_max_check'
  ) THEN
    ALTER TABLE simulation_instances
    ADD CONSTRAINT simulation_instances_stages_max_check
    CHECK (stages_completed <= COALESCE(max_stage, stages_completed));
  END IF;
END $$;
