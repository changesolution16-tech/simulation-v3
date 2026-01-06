/*
  # Fix stages_completed Constraint Violation

  ## Problem
  The `update_simulation_progress` function was setting `stages_completed` to 
  `p_current_stage` which could exceed `max_stage`, violating the check constraint:
  `stages_completed <= COALESCE(max_stage, stages_completed)`

  ## Solution
  Update the function to ensure `stages_completed` never exceeds `max_stage`.
  Use LEAST() to cap the value at max_stage.

  ## Changes
  - Modified `update_simulation_progress` function to cap stages_completed at max_stage
  - Maintains backward compatibility
  - Prevents constraint violations
*/

CREATE OR REPLACE FUNCTION update_simulation_progress(
  p_instance_id uuid,
  p_current_scenario_id uuid,
  p_current_stage integer
)
RETURNS boolean AS $$
DECLARE
  v_max_stage integer;
BEGIN
  -- Get the max_stage for this instance
  SELECT max_stage INTO v_max_stage
  FROM simulation_instances
  WHERE id = p_instance_id;

  -- Update progress, ensuring stages_completed never exceeds max_stage
  UPDATE simulation_instances
  SET
    current_scenario_id = p_current_scenario_id,
    stages_completed = GREATEST(
      COALESCE(stages_completed, 0),
      LEAST(p_current_stage, COALESCE(v_max_stage, p_current_stage))
    ),
    last_activity_at = now()
  WHERE id = p_instance_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_simulation_progress IS
  'Safely updates simulation progress, ensuring stages_completed never exceeds max_stage';
