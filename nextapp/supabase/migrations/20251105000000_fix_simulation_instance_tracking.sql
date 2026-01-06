/*
  # Fix Simulation Instance Tracking

  ## Problem
  Simulation instances show zero values for max_level, levels_completed, decision_count,
  and total_scenarios_completed because there are no triggers or functions to update these
  statistics when learners make decisions.

  ## Solution
  1. Create trigger function to update instance statistics when learner_responses are inserted
  2. Create function to calculate max_level from simulation structure
  3. Create function to calculate levels_completed from learner responses
  4. Update existing instances with correct statistics

  ## Changes
  - Add trigger on learner_responses to update decision_count
  - Add trigger on learner_responses to update total_scenarios_completed
  - Add trigger on learner_responses to update levels_completed
  - Calculate and set max_level when instance is created or updated
  - Backfill existing instances with correct values
*/

-- ============================================================================
-- Function: Update Simulation Instance Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION update_simulation_instance_stats()
RETURNS TRIGGER AS $$
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
    updated_at = NOW()
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
    levels_completed = v_levels_completed
  WHERE id = NEW.instance_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Auto-update instance stats on learner response
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_instance_stats ON learner_responses;

CREATE TRIGGER trigger_update_instance_stats
  AFTER INSERT ON learner_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_instance_stats();

-- ============================================================================
-- Function: Initialize Instance Max Level
-- Called when simulation instance is created
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_instance_max_level()
RETURNS TRIGGER AS $$
DECLARE
  v_max_level integer;
BEGIN
  -- Calculate max_level from simulation structure
  SELECT COALESCE(MAX(s.hierarchy_level), 0)
  INTO v_max_level
  FROM simulation_scenarios ss
  JOIN scenarios s ON s.id = ss.scenario_id
  WHERE ss.simulation_id = NEW.simulation_id;

  -- Set max_level on the new instance
  NEW.max_level := v_max_level;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Set max_level when instance is created
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_init_instance_max_level ON simulation_instances;

CREATE TRIGGER trigger_init_instance_max_level
  BEFORE INSERT ON simulation_instances
  FOR EACH ROW
  EXECUTE FUNCTION initialize_instance_max_level();

-- ============================================================================
-- Backfill Existing Instances
-- ============================================================================

-- Update max_level for all existing instances
UPDATE simulation_instances si
SET max_level = (
  SELECT COALESCE(MAX(s.hierarchy_level), 0)
  FROM simulation_scenarios ss
  JOIN scenarios s ON s.id = ss.scenario_id
  WHERE ss.simulation_id = si.simulation_id
)
WHERE max_level = 0 OR max_level IS NULL;

-- Update decision_count for all existing instances
UPDATE simulation_instances si
SET decision_count = (
  SELECT COUNT(*)
  FROM learner_responses lr
  WHERE lr.instance_id = si.id
)
WHERE decision_count = 0 OR decision_count IS NULL;

-- Update total_scenarios_completed for all existing instances
UPDATE simulation_instances si
SET total_scenarios_completed = (
  SELECT COUNT(DISTINCT scenario_id)
  FROM learner_responses lr
  WHERE lr.instance_id = si.id
)
WHERE total_scenarios_completed = 0 OR total_scenarios_completed IS NULL;

-- Update levels_completed for all existing instances
UPDATE simulation_instances si
SET levels_completed = (
  SELECT COALESCE(MAX(s.hierarchy_level), 0)
  FROM learner_responses lr
  JOIN scenarios s ON s.id = lr.scenario_id
  WHERE lr.instance_id = si.id
)
WHERE levels_completed = 0 OR levels_completed IS NULL;

-- ============================================================================
-- Add helpful indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_learner_responses_instance_id
  ON learner_responses(instance_id);

CREATE INDEX IF NOT EXISTS idx_learner_responses_scenario_id
  ON learner_responses(scenario_id);

CREATE INDEX IF NOT EXISTS idx_scenarios_hierarchy_level
  ON scenarios(hierarchy_level);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION update_simulation_instance_stats() IS
  'Automatically updates simulation instance statistics (decision_count, total_scenarios_completed, levels_completed) when learner makes a decision';

COMMENT ON FUNCTION initialize_instance_max_level() IS
  'Automatically sets max_level for a simulation instance based on the simulation structure when instance is created';

COMMENT ON TRIGGER trigger_update_instance_stats ON learner_responses IS
  'Updates simulation_instances statistics after each learner response is recorded';

COMMENT ON TRIGGER trigger_init_instance_max_level ON simulation_instances IS
  'Initializes max_level field when a new simulation instance is created';
