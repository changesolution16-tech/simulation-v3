-- Fix the update_simulation_instance_stats function to not reference updated_at column
-- The function tries to update updated_at which doesn't exist in simulation_instances

CREATE OR REPLACE FUNCTION update_simulation_instance_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_unique_scenarios integer;
  v_max_level integer;
  v_levels_completed integer;
  v_max_hierarchy_level integer;
BEGIN
  -- Count total unique scenarios completed by this learner in this instance
  SELECT COUNT(DISTINCT scenario_id)
  INTO v_unique_scenarios
  FROM learner_responses
  WHERE instance_id = NEW.instance_id;

  -- Count total decisions (all responses including revisited scenarios)
  UPDATE simulation_instances
  SET
    decision_count = (
      SELECT COUNT(*)
      FROM learner_responses
      WHERE instance_id = NEW.instance_id
    ),
    total_scenarios_completed = v_unique_scenarios,
    -- Use last_activity_at instead of updated_at (which doesn't exist)
    last_activity_at = NOW()
  WHERE id = NEW.instance_id;

  -- Calculate max_level from simulation structure
  SELECT COALESCE(MAX(s.hierarchy_level), 0)
  INTO v_max_level
  FROM simulation_instances si
  JOIN simulation_scenarios ss ON ss.simulation_id = si.simulation_id
  JOIN scenarios s ON s.id = ss.scenario_id
  WHERE si.id = NEW.instance_id;

  -- Calculate levels_completed (highest hierarchy level reached by learner)
  SELECT COALESCE(MAX(s.hierarchy_level), 0)
  INTO v_levels_completed
  FROM learner_responses lr
  JOIN scenarios s ON s.id = lr.scenario_id
  WHERE lr.instance_id = NEW.instance_id;

  -- Update instance with level information
  UPDATE simulation_instances
  SET
    max_level = v_max_level,
    levels_completed = v_levels_completed,
    stages_completed = v_levels_completed,
    max_stage = v_max_level
  WHERE id = NEW.instance_id;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION update_simulation_instance_stats IS
  'Automatically updates simulation instance statistics when a learner response is inserted';
