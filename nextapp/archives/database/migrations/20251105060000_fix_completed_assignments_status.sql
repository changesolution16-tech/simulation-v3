/*
  # Fix Completed Assignments Status

  This migration addresses the issue where learners who completed simulations
  have their assignment_learners status stuck at 'in_progress' instead of 'completed'.

  ## Problem

  When a learner completes a simulation that is part of an assignment, the
  simulation_instances table is updated to 'completed', but the assignment_learners
  table may not be updated, causing the dashboard to show 0 completed assignments.

  ## Solution

  1. Create a function to sync assignment completion status with simulation instances
  2. Update any assignment_learners records where the linked simulation instance is completed
  3. Add a trigger to automatically sync this going forward (optional)

  ## Changes

  - Function: `sync_assignment_completion_status()` - Syncs assignment status with instance status
  - Updates all assignment_learners records with completed instances
*/

-- Function to sync assignment completion status with simulation instance status
CREATE OR REPLACE FUNCTION sync_assignment_completion_status()
RETURNS TABLE (
  assignment_learner_id uuid,
  instance_id uuid,
  old_status text,
  new_status text,
  final_score numeric,
  updated boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH updates AS (
    SELECT
      al.id as assignment_learner_id,
      si.id as instance_id,
      al.status as old_status,
      'completed'::text as new_status,
      si.final_score,
      true as updated
    FROM assignment_learners al
    INNER JOIN simulation_instances si ON si.id = al.current_instance_id
    WHERE si.status = 'completed'
      AND al.status != 'completed'
      AND al.current_instance_id IS NOT NULL
  )
  UPDATE assignment_learners al
  SET
    status = 'completed',
    completed_at = COALESCE(al.completed_at, (
      SELECT si.completed_at
      FROM simulation_instances si
      WHERE si.id = al.current_instance_id
    )),
    submitted_at = COALESCE(al.submitted_at, (
      SELECT si.completed_at
      FROM simulation_instances si
      WHERE si.id = al.current_instance_id
    )),
    latest_score = COALESCE(al.latest_score, (
      SELECT si.final_score
      FROM simulation_instances si
      WHERE si.id = al.current_instance_id
    )),
    best_score = GREATEST(
      COALESCE(al.best_score, 0),
      COALESCE((
        SELECT si.final_score
        FROM simulation_instances si
        WHERE si.id = al.current_instance_id
      ), 0)
    ),
    attempt_count = COALESCE(al.attempt_count, 0) + CASE WHEN al.completed_at IS NULL THEN 1 ELSE 0 END
  FROM updates u
  WHERE al.id = u.assignment_learner_id
  RETURNING al.id, u.instance_id, u.old_status, u.new_status, u.final_score, u.updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_assignment_completion_status TO authenticated;

-- Run the sync function to fix existing data
DO $$
DECLARE
  sync_results record;
  total_updated integer := 0;
BEGIN
  FOR sync_results IN
    SELECT * FROM sync_assignment_completion_status()
  LOOP
    total_updated := total_updated + 1;
    RAISE NOTICE 'Updated assignment_learner % (instance %) from % to % with score %',
      sync_results.assignment_learner_id,
      sync_results.instance_id,
      sync_results.old_status,
      sync_results.new_status,
      sync_results.final_score;
  END LOOP;

  IF total_updated > 0 THEN
    RAISE NOTICE 'Successfully updated % assignment_learners records to completed status', total_updated;
  ELSE
    RAISE NOTICE 'No assignment_learners records needed updating';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON FUNCTION sync_assignment_completion_status IS
  'Syncs assignment_learners completion status with linked simulation_instances. ' ||
  'Updates status, scores, and timestamps based on completed simulation instances.';
