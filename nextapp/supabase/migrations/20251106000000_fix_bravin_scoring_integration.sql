/*
  # Fix BRAVIN Scoring Integration with Assignments

  This migration fixes the complete flow from BRAVIN assessment to assignment scoring display.

  ## Issues Fixed

  1. **Score Calculation**: The `calculate_final_scores` function was trying to access a non-existent
     `alignment_score` column. It now properly calculates BRAVIN score from dimension impacts.

  2. **Assignment Sync**: Added automatic synchronization of simulation instance scores to
     assignment_learners.best_score whenever a simulation completes.

  3. **Instance-Assignment Link**: Ensures the current_instance_id is properly maintained throughout
     the simulation lifecycle.

  4. **Score Consistency**: All scores now flow from the database-calculated values, ensuring
     consistency across the system.

  ## Key Changes

  - Updated `calculate_final_scores` to properly calculate BRAVIN alignment from dimension impacts
  - Enhanced `complete_simulation_instance` to update linked assignments automatically
  - Added function to sync best scores when simulations complete
  - Fixed score calculation to handle cases where only BRAVIN or only Metrics exist
*/

-- ============================================================================
-- PART 1: Fix BRAVIN Score Calculation
-- ============================================================================

-- Updated function to calculate final scores with correct BRAVIN calculation
CREATE OR REPLACE FUNCTION calculate_final_scores(p_instance_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_bravin_score numeric;
  v_metrics_score numeric;
  v_final_score numeric;
  v_result jsonb;
  v_decision_count integer;
BEGIN
  -- Calculate BRAVIN overall score from dimension impacts
  -- Average all dimension impacts to get overall BRAVIN alignment
  SELECT
    COALESCE(AVG(
      COALESCE(boldness_impact, 0) +
      COALESCE(responsibility_impact, 0) +
      COALESCE(accountability_impact, 0) +
      COALESCE(vision_impact, 0) +
      COALESCE(integrity_impact, 0) +
      COALESCE(nurturance_impact, 0)
    ) / 6.0, 0) AS avg_impact,
    COUNT(*) AS decision_count
  INTO v_bravin_score, v_decision_count
  FROM bravin_decision_assessments
  WHERE simulation_instance_id = p_instance_id;

  -- Convert impact scores (-100 to +100) to percentage (0-100)
  -- Positive impacts map to 50-100%, negative to 0-50%
  IF v_bravin_score IS NOT NULL AND v_decision_count > 0 THEN
    v_bravin_score := 50 + (v_bravin_score / 2);
    -- Clamp to 0-100 range
    v_bravin_score := GREATEST(0, LEAST(100, v_bravin_score));
  ELSE
    v_bravin_score := 0;
  END IF;

  -- Calculate average metrics score (already in 0-100 percentage)
  SELECT COALESCE(AVG(score_achieved), 0)
  INTO v_metrics_score
  FROM learner_metric_assessments
  WHERE simulation_instance_id = p_instance_id;

  -- Calculate weighted final score based on what's available
  IF v_bravin_score > 0 AND v_metrics_score > 0 THEN
    -- Both exist: weighted average (60% BRAVIN, 40% Metrics)
    v_final_score := (v_bravin_score * 0.6) + (v_metrics_score * 0.4);
  ELSIF v_bravin_score > 0 THEN
    -- Only BRAVIN scores exist
    v_final_score := v_bravin_score;
  ELSIF v_metrics_score > 0 THEN
    -- Only Metrics scores exist
    v_final_score := v_metrics_score;
  ELSE
    -- No scores recorded yet
    v_final_score := 0;
  END IF;

  -- Update simulation instance with calculated scores
  UPDATE simulation_instances
  SET
    final_score = v_final_score,
    bravin_overall_score = v_bravin_score,
    metrics_average_score = v_metrics_score,
    updated_at = now()
  WHERE id = p_instance_id;

  -- Build result object
  v_result := jsonb_build_object(
    'instance_id', p_instance_id,
    'final_score', v_final_score,
    'bravin_score', v_bravin_score,
    'metrics_score', v_metrics_score,
    'decision_count', v_decision_count,
    'calculated_at', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_final_scores IS
  'Calculates and stores final scores (BRAVIN from dimension impacts, metrics average, weighted overall) for a simulation instance';

-- ============================================================================
-- PART 2: Enhanced Simulation Completion with Assignment Sync
-- ============================================================================

-- Function to update assignment_learners when simulation completes
CREATE OR REPLACE FUNCTION sync_assignment_score(
  p_instance_id uuid,
  p_final_score numeric
)
RETURNS void AS $$
DECLARE
  v_instance record;
  v_assignment_learner record;
  v_attempt_count integer;
BEGIN
  -- Get instance details
  SELECT learner_id, simulation_id, attempt_number
  INTO v_instance
  FROM simulation_instances
  WHERE id = p_instance_id;

  IF NOT FOUND THEN
    RETURN; -- No instance found, nothing to sync
  END IF;

  -- Find related assignment_learner record using current_instance_id
  SELECT *
  INTO v_assignment_learner
  FROM assignment_learners
  WHERE learner_id = v_instance.learner_id
    AND current_instance_id = p_instance_id;

  IF FOUND THEN
    -- Update assignment with completion data
    v_attempt_count := COALESCE(v_assignment_learner.attempt_count, 0) + 1;

    UPDATE assignment_learners
    SET
      status = 'completed',
      completed_at = now(),
      submitted_at = now(),
      attempt_count = v_attempt_count,
      latest_score = p_final_score,
      best_score = GREATEST(COALESCE(best_score, 0), p_final_score),
      updated_at = now()
    WHERE id = v_assignment_learner.id;

    RAISE NOTICE 'Assignment % updated with score %', v_assignment_learner.id, p_final_score;
  ELSE
    -- Try to find assignment by learner and simulation, then link it
    SELECT *
    INTO v_assignment_learner
    FROM assignment_learners al
    INNER JOIN training_assignments ta ON al.assignment_id = ta.id
    WHERE al.learner_id = v_instance.learner_id
      AND ta.simulation_id = v_instance.simulation_id
      AND al.status IN ('assigned', 'in_progress')
    ORDER BY al.created_at DESC
    LIMIT 1;

    IF FOUND THEN
      -- Link this instance to the assignment and update
      v_attempt_count := COALESCE(v_assignment_learner.attempt_count, 0) + 1;

      UPDATE assignment_learners
      SET
        current_instance_id = p_instance_id,
        status = 'completed',
        completed_at = now(),
        submitted_at = now(),
        attempt_count = v_attempt_count,
        latest_score = p_final_score,
        best_score = GREATEST(COALESCE(best_score, 0), p_final_score),
        updated_at = now()
      WHERE id = v_assignment_learner.id;

      RAISE NOTICE 'Assignment % linked and updated with score %', v_assignment_learner.id, p_final_score;
    ELSE
      RAISE NOTICE 'No assignment found for instance %', p_instance_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_assignment_score IS
  'Synchronizes simulation instance completion and score to related assignment_learners record';

-- ============================================================================
-- PART 3: Enhanced Complete Simulation Function
-- ============================================================================

-- Enhanced function to mark instance as completed, calculate scores, and sync to assignments
CREATE OR REPLACE FUNCTION complete_simulation_instance(p_instance_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_scores jsonb;
  v_instance record;
  v_final_score numeric;
BEGIN
  -- Get instance details
  SELECT * INTO v_instance
  FROM simulation_instances
  WHERE id = p_instance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Simulation instance % not found', p_instance_id;
  END IF;

  -- Calculate final scores
  v_scores := calculate_final_scores(p_instance_id);
  v_final_score := (v_scores->>'final_score')::numeric;

  -- Mark as completed if not already
  UPDATE simulation_instances
  SET
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_instance_id
    AND status != 'completed';

  -- Update best attempt flag for this learner-simulation pair
  PERFORM update_best_attempt_flag(v_instance.learner_id, v_instance.simulation_id);

  -- Sync score to assignment if one exists
  PERFORM sync_assignment_score(p_instance_id, v_final_score);

  RETURN jsonb_build_object(
    'instance_id', p_instance_id,
    'status', 'completed',
    'scores', v_scores,
    'completed_at', now(),
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_simulation_instance IS
  'Marks simulation as completed, calculates final scores, updates best attempt flag, and syncs to assignments';

-- ============================================================================
-- PART 4: Function to Link Assignment to Instance on Start
-- ============================================================================

-- Function to link an assignment to a simulation instance when starting
CREATE OR REPLACE FUNCTION link_assignment_to_instance(
  p_assignment_learner_id uuid,
  p_instance_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE assignment_learners
  SET
    current_instance_id = p_instance_id,
    status = 'in_progress',
    started_at = COALESCE(started_at, now()),
    updated_at = now()
  WHERE id = p_assignment_learner_id
    AND status IN ('assigned', 'in_progress');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_assignment_to_instance IS
  'Links an assignment to a simulation instance when the learner starts the simulation';

-- ============================================================================
-- PART 5: Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_final_scores TO authenticated;
GRANT EXECUTE ON FUNCTION sync_assignment_score TO authenticated;
GRANT EXECUTE ON FUNCTION complete_simulation_instance TO authenticated;
GRANT EXECUTE ON FUNCTION link_assignment_to_instance TO authenticated;

-- ============================================================================
-- PART 6: Recalculate Existing Scores (Data Fix)
-- ============================================================================

-- Recalculate scores for all completed instances that have assessments but zero scores
DO $$
DECLARE
  v_instance_id uuid;
  v_result jsonb;
BEGIN
  FOR v_instance_id IN
    SELECT DISTINCT si.id
    FROM simulation_instances si
    WHERE si.status = 'completed'
      AND si.final_score = 0
      AND (
        EXISTS (
          SELECT 1 FROM bravin_decision_assessments
          WHERE simulation_instance_id = si.id
        )
        OR EXISTS (
          SELECT 1 FROM learner_metric_assessments
          WHERE simulation_instance_id = si.id
        )
      )
    LIMIT 100  -- Process in batches to avoid timeout
  LOOP
    BEGIN
      v_result := calculate_final_scores(v_instance_id);
      RAISE NOTICE 'Recalculated scores for instance %: %', v_instance_id, v_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to recalculate scores for instance %: %', v_instance_id, SQLERRM;
    END;
  END LOOP;
END $$;
