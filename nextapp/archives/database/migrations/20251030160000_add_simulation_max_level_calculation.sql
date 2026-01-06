/*
  # Add Simulation Max Level Calculation

  ## Overview
  This migration adds functionality to calculate and display the maximum hierarchy level
  for each simulation based on its end node scenarios. This replaces the misleading
  "Scenario X of Y" progress indicator with a more accurate "Level X of Y" display.

  ## Changes Made
  1. Create view to calculate max level for each simulation
  2. Create function to get max level for a specific simulation
  3. Add helper view for simulation level statistics
  4. Grant appropriate permissions

  ## How It Works
  - Joins simulation_scenarios with scenarios table
  - Filters for scenarios marked as is_end_scenario = true
  - Returns the MAX(hierarchy_level) for end scenarios in each simulation
  - Falls back to all scenarios if no end scenarios exist
*/

-- ============================================================================
-- 1. CREATE VIEW FOR SIMULATION MAX LEVELS
-- ============================================================================

CREATE OR REPLACE VIEW simulation_max_levels AS
SELECT
  s.id as simulation_id,
  s.name,
  s.display_name,
  COALESCE(
    (
      -- First try to get max level from end scenarios only
      SELECT MAX(sc.hierarchy_level)
      FROM simulation_scenarios ss
      JOIN scenarios sc ON sc.id = ss.scenario_id
      WHERE ss.simulation_id = s.id
        AND sc.is_end_scenario = true
        AND sc.hierarchy_level IS NOT NULL
    ),
    (
      -- Fallback to max level from any scenario in the simulation
      SELECT MAX(sc.hierarchy_level)
      FROM simulation_scenarios ss
      JOIN scenarios sc ON sc.id = ss.scenario_id
      WHERE ss.simulation_id = s.id
        AND sc.hierarchy_level IS NOT NULL
    ),
    0
  ) as max_level,
  (
    SELECT COUNT(*)
    FROM simulation_scenarios ss
    WHERE ss.simulation_id = s.id
  ) as total_scenarios,
  (
    SELECT COUNT(*)
    FROM simulation_scenarios ss
    JOIN scenarios sc ON sc.id = ss.scenario_id
    WHERE ss.simulation_id = s.id
      AND sc.is_end_scenario = true
  ) as end_scenario_count,
  (
    SELECT COUNT(DISTINCT sc.hierarchy_level)
    FROM simulation_scenarios ss
    JOIN scenarios sc ON sc.id = ss.scenario_id
    WHERE ss.simulation_id = s.id
      AND sc.hierarchy_level IS NOT NULL
  ) as unique_level_count
FROM simulations s;

COMMENT ON VIEW simulation_max_levels IS
  'Calculates the maximum hierarchy level for each simulation based on end node scenarios. Used for displaying accurate progress indicators.';

GRANT SELECT ON simulation_max_levels TO authenticated;

-- ============================================================================
-- 2. CREATE FUNCTION TO GET MAX LEVEL FOR A SPECIFIC SIMULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_simulation_max_level(p_simulation_id uuid)
RETURNS integer AS $$
DECLARE
  v_max_level integer;
BEGIN
  -- Get max level from end scenarios first
  SELECT MAX(sc.hierarchy_level)
  INTO v_max_level
  FROM simulation_scenarios ss
  JOIN scenarios sc ON sc.id = ss.scenario_id
  WHERE ss.simulation_id = p_simulation_id
    AND sc.is_end_scenario = true
    AND sc.hierarchy_level IS NOT NULL;

  -- If no end scenarios with levels, get max from all scenarios
  IF v_max_level IS NULL THEN
    SELECT MAX(sc.hierarchy_level)
    INTO v_max_level
    FROM simulation_scenarios ss
    JOIN scenarios sc ON sc.id = ss.scenario_id
    WHERE ss.simulation_id = p_simulation_id
      AND sc.hierarchy_level IS NOT NULL;
  END IF;

  -- Return 0 if still no level found
  RETURN COALESCE(v_max_level, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_simulation_max_level(uuid) IS
  'Returns the maximum hierarchy level for a specific simulation. Prioritizes end scenarios, falls back to all scenarios.';

GRANT EXECUTE ON FUNCTION get_simulation_max_level(uuid) TO authenticated;

-- ============================================================================
-- 3. CREATE FUNCTION TO GET SCENARIO LEVEL WITHIN SIMULATION CONTEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_scenario_current_level(
  p_simulation_id uuid,
  p_scenario_id uuid
)
RETURNS integer AS $$
DECLARE
  v_level integer;
BEGIN
  -- Get the hierarchy level of the current scenario
  SELECT sc.hierarchy_level
  INTO v_level
  FROM scenarios sc
  WHERE sc.id = p_scenario_id;

  -- Return the level, default to 1 if not set
  RETURN COALESCE(v_level, 0) + 1; -- Add 1 to make it 1-indexed for display
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_scenario_current_level(uuid, uuid) IS
  'Returns the display level (1-indexed) for a scenario in the context of a simulation.';

GRANT EXECUTE ON FUNCTION get_scenario_current_level(uuid, uuid) TO authenticated;

-- ============================================================================
-- 4. CREATE HELPER VIEW FOR SIMULATION LEVEL STATISTICS
-- ============================================================================

CREATE OR REPLACE VIEW simulation_level_statistics AS
SELECT
  s.id as simulation_id,
  s.display_name,
  s.difficulty,
  sml.max_level,
  sml.total_scenarios,
  sml.end_scenario_count,
  sml.unique_level_count,
  ARRAY_AGG(DISTINCT sc.hierarchy_level ORDER BY sc.hierarchy_level)
    FILTER (WHERE sc.hierarchy_level IS NOT NULL) as levels_present,
  jsonb_object_agg(
    sc.hierarchy_level::text,
    jsonb_build_object(
      'count', COUNT(*),
      'end_scenarios', COUNT(*) FILTER (WHERE sc.is_end_scenario)
    )
  ) FILTER (WHERE sc.hierarchy_level IS NOT NULL) as level_breakdown
FROM simulations s
LEFT JOIN simulation_max_levels sml ON sml.simulation_id = s.id
LEFT JOIN simulation_scenarios ss ON ss.simulation_id = s.id
LEFT JOIN scenarios sc ON sc.id = ss.scenario_id
GROUP BY s.id, s.display_name, s.difficulty, sml.max_level, sml.total_scenarios,
         sml.end_scenario_count, sml.unique_level_count;

COMMENT ON VIEW simulation_level_statistics IS
  'Comprehensive statistics about hierarchy levels within each simulation for analytics and debugging.';

GRANT SELECT ON simulation_level_statistics TO authenticated;

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for efficient simulation-scenario joins
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_simulation_scenario
  ON simulation_scenarios(simulation_id, scenario_id);

-- Index for end scenario queries
CREATE INDEX IF NOT EXISTS idx_scenarios_end_scenario_level
  ON scenarios(is_end_scenario, hierarchy_level)
  WHERE is_end_scenario = true AND hierarchy_level IS NOT NULL;

-- ============================================================================
-- 6. ADD HELPER COMMENTS
-- ============================================================================

COMMENT ON COLUMN scenarios.hierarchy_level IS
  'Hierarchical level/tier of the scenario in the flow. 0 = root level, higher numbers = deeper in tree. Used for progress display as "Level X of Y".';

COMMENT ON COLUMN scenarios.is_end_scenario IS
  'Marks scenarios that represent terminal/ending points in the simulation. Used to calculate max level for progress indicators.';
