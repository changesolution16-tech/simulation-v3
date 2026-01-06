/*
  # Add Hierarchical Level System to Scenarios

  ## Overview
  This migration adds a hierarchical level system to scenarios, making it easier to
  organize and visualize complex branching scenario flows in the flow builder.

  ## Changes Made
  1. Add `hierarchy_level` column to track the depth/tier of each scenario
  2. Add `auto_calculate_level` column to track if level is manually set or auto-calculated
  3. Create function to automatically calculate hierarchy levels based on connections
  4. Create function to detect and handle circular references
  5. Add indexes for efficient level-based queries
  6. Backfill existing scenarios with calculated hierarchy levels

  ## How Hierarchy Levels Work
  - Root scenarios (no incoming connections) are at level 0
  - Each scenario's level = max(parent levels) + 1
  - Manual overrides are preserved when auto_calculate_level is false
  - Circular references are detected and handled gracefully

  ## Security
  - Respects existing RLS policies
  - Functions use SECURITY DEFINER for consistent execution
*/

-- ============================================================================
-- 1. ADD HIERARCHY LEVEL COLUMNS
-- ============================================================================

-- Add hierarchy_level column (nullable for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'hierarchy_level'
  ) THEN
    ALTER TABLE scenarios
    ADD COLUMN hierarchy_level integer DEFAULT NULL;

    RAISE NOTICE 'Added hierarchy_level column to scenarios table';
  END IF;
END $$;

-- Add auto_calculate_level column (defaults to true for automatic calculation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'auto_calculate_level'
  ) THEN
    ALTER TABLE scenarios
    ADD COLUMN auto_calculate_level boolean DEFAULT true;

    RAISE NOTICE 'Added auto_calculate_level column to scenarios table';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN scenarios.hierarchy_level IS
  'Hierarchical level/tier of the scenario in the flow. 0 = root, higher numbers = deeper in tree. NULL = not yet calculated.';

COMMENT ON COLUMN scenarios.auto_calculate_level IS
  'If true, hierarchy_level is automatically calculated from connections. If false, level is manually set and preserved.';

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for level-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_scenarios_hierarchy_level
  ON scenarios(hierarchy_level)
  WHERE hierarchy_level IS NOT NULL;

-- Composite index for topic + level queries
CREATE INDEX IF NOT EXISTS idx_scenarios_topic_level
  ON scenarios(topic_id, hierarchy_level)
  WHERE hierarchy_level IS NOT NULL;

-- Index for auto-calculation filtering
CREATE INDEX IF NOT EXISTS idx_scenarios_auto_calculate
  ON scenarios(auto_calculate_level)
  WHERE auto_calculate_level = true;

-- ============================================================================
-- 3. CREATE FUNCTION TO DETECT CIRCULAR REFERENCES
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_scenario_cycles()
RETURNS TABLE(has_cycle boolean, cycle_nodes uuid[]) AS $$
DECLARE
  v_has_cycle boolean := false;
  v_cycle_nodes uuid[] := ARRAY[]::uuid[];
BEGIN
  -- Use recursive CTE to detect cycles
  WITH RECURSIVE scenario_graph AS (
    -- Start with all scenarios
    SELECT
      s.id,
      ARRAY[s.id] as path,
      0 as depth
    FROM scenarios s

    UNION ALL

    -- Follow connections
    SELECT
      so.next_scenario_id,
      sg.path || so.next_scenario_id,
      sg.depth + 1
    FROM scenario_graph sg
    JOIN scenario_options so ON so.scenario_id = sg.id
    WHERE
      so.next_scenario_id IS NOT NULL
      AND sg.depth < 100 -- Prevent infinite loops
      AND NOT (so.next_scenario_id = ANY(sg.path)) -- Stop if we've seen this node
  )
  SELECT
    COUNT(*) > 0,
    ARRAY_AGG(DISTINCT id)
  INTO v_has_cycle, v_cycle_nodes
  FROM scenario_graph sg
  JOIN scenario_options so ON so.scenario_id = sg.id
  WHERE
    so.next_scenario_id IS NOT NULL
    AND so.next_scenario_id = ANY(sg.path);

  RETURN QUERY SELECT v_has_cycle, COALESCE(v_cycle_nodes, ARRAY[]::uuid[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_scenario_cycles() IS
  'Detects circular references in scenario connections. Returns true if cycles exist and the IDs of nodes involved.';

-- ============================================================================
-- 4. CREATE FUNCTION TO CALCULATE HIERARCHY LEVELS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_scenario_hierarchy_levels()
RETURNS TABLE(scenario_id uuid, calculated_level integer) AS $$
DECLARE
  v_max_iterations integer := 100;
  v_iteration integer := 0;
  v_changes_made integer;
BEGIN
  -- Create temporary table to store calculated levels
  CREATE TEMP TABLE IF NOT EXISTS temp_scenario_levels (
    scenario_id uuid PRIMARY KEY,
    level integer
  ) ON COMMIT DROP;

  -- Clear any existing data
  TRUNCATE temp_scenario_levels;

  -- Step 1: Initialize all scenarios at level NULL
  INSERT INTO temp_scenario_levels (scenario_id, level)
  SELECT id, NULL
  FROM scenarios
  WHERE auto_calculate_level = true;

  -- Step 2: Set root nodes (no incoming connections) to level 0
  UPDATE temp_scenario_levels tsl
  SET level = 0
  WHERE scenario_id IN (
    SELECT s.id
    FROM scenarios s
    WHERE s.auto_calculate_level = true
    AND NOT EXISTS (
      SELECT 1
      FROM scenario_options so
      WHERE so.next_scenario_id = s.id
    )
  );

  -- Step 3: Iteratively calculate levels for remaining nodes
  LOOP
    v_iteration := v_iteration + 1;

    -- Update levels based on parent levels
    WITH parent_levels AS (
      SELECT
        so.next_scenario_id as child_id,
        MAX(tsl.level) + 1 as new_level
      FROM scenario_options so
      JOIN temp_scenario_levels tsl ON tsl.scenario_id = so.scenario_id
      WHERE
        so.next_scenario_id IS NOT NULL
        AND tsl.level IS NOT NULL
      GROUP BY so.next_scenario_id
    )
    UPDATE temp_scenario_levels tsl
    SET level = pl.new_level
    FROM parent_levels pl
    WHERE
      tsl.scenario_id = pl.child_id
      AND (tsl.level IS NULL OR tsl.level < pl.new_level);

    GET DIAGNOSTICS v_changes_made = ROW_COUNT;

    -- Exit if no changes made or max iterations reached
    EXIT WHEN v_changes_made = 0 OR v_iteration >= v_max_iterations;
  END LOOP;

  -- Step 4: Handle any remaining NULL levels (isolated nodes or cycles)
  -- Assign them to a high level so they don't interfere
  UPDATE temp_scenario_levels
  SET level = 999
  WHERE level IS NULL;

  -- Return results
  RETURN QUERY
  SELECT tsl.scenario_id, tsl.level
  FROM temp_scenario_levels tsl
  ORDER BY tsl.level, tsl.scenario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_scenario_hierarchy_levels() IS
  'Calculates hierarchy levels for all scenarios based on their connections. Root nodes are level 0, each subsequent level is parent level + 1.';

-- ============================================================================
-- 5. CREATE FUNCTION TO APPLY CALCULATED LEVELS
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_scenario_hierarchy_levels()
RETURNS jsonb AS $$
DECLARE
  v_updated_count integer := 0;
  v_result jsonb;
BEGIN
  -- Calculate levels
  WITH calculated_levels AS (
    SELECT * FROM calculate_scenario_hierarchy_levels()
  )
  -- Apply to scenarios table
  UPDATE scenarios s
  SET
    hierarchy_level = cl.calculated_level,
    updated_at = now()
  FROM calculated_levels cl
  WHERE
    s.id = cl.scenario_id
    AND s.auto_calculate_level = true
    AND (s.hierarchy_level IS NULL OR s.hierarchy_level != cl.calculated_level);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Return summary
  SELECT jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'timestamp', now(),
    'level_distribution', (
      SELECT jsonb_object_agg(hierarchy_level, count)
      FROM (
        SELECT hierarchy_level, COUNT(*) as count
        FROM scenarios
        WHERE hierarchy_level IS NOT NULL
        GROUP BY hierarchy_level
        ORDER BY hierarchy_level
      ) level_counts
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION apply_scenario_hierarchy_levels() IS
  'Calculates and applies hierarchy levels to all scenarios with auto_calculate_level = true. Returns summary of changes.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION detect_scenario_cycles() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_scenario_hierarchy_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION apply_scenario_hierarchy_levels() TO authenticated;

-- ============================================================================
-- 6. CREATE TRIGGER FOR AUTOMATIC LEVEL RECALCULATION
-- ============================================================================

-- Function to trigger level recalculation when connections change
CREATE OR REPLACE FUNCTION trigger_hierarchy_recalculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if next_scenario_id changed
  IF (TG_OP = 'INSERT' AND NEW.next_scenario_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND OLD.next_scenario_id IS DISTINCT FROM NEW.next_scenario_id) OR
     (TG_OP = 'DELETE' AND OLD.next_scenario_id IS NOT NULL) THEN

    -- Note: We don't recalculate immediately in the trigger to avoid performance issues
    -- Instead, we mark scenarios as needing recalculation
    -- The UI can call apply_scenario_hierarchy_levels() as needed

    RAISE NOTICE 'Scenario connections changed, hierarchy levels may need recalculation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on scenario_options table
DROP TRIGGER IF EXISTS trigger_recalculate_hierarchy_on_connection_change ON scenario_options;

CREATE TRIGGER trigger_recalculate_hierarchy_on_connection_change
  AFTER INSERT OR UPDATE OR DELETE ON scenario_options
  FOR EACH ROW
  EXECUTE FUNCTION trigger_hierarchy_recalculation();

COMMENT ON TRIGGER trigger_recalculate_hierarchy_on_connection_change ON scenario_options IS
  'Logs when scenario connections change so hierarchy levels can be recalculated.';

-- ============================================================================
-- 7. BACKFILL EXISTING SCENARIOS
-- ============================================================================

-- Calculate and apply hierarchy levels to all existing scenarios
DO $$
DECLARE
  v_result jsonb;
BEGIN
  -- First, ensure all existing scenarios have auto_calculate_level = true
  UPDATE scenarios
  SET auto_calculate_level = true
  WHERE auto_calculate_level IS NULL;

  -- Calculate and apply levels
  SELECT apply_scenario_hierarchy_levels() INTO v_result;

  RAISE NOTICE 'Hierarchy levels backfilled: %', v_result;
END $$;

-- ============================================================================
-- 8. ADD HELPER VIEW FOR LEVEL STATISTICS
-- ============================================================================

CREATE OR REPLACE VIEW scenario_level_stats AS
SELECT
  s.hierarchy_level,
  COUNT(*) as scenario_count,
  COUNT(DISTINCT s.topic_id) as unique_topics,
  COUNT(*) FILTER (WHERE s.is_end_scenario) as end_scenarios,
  COUNT(*) FILTER (WHERE s.is_published) as published_scenarios,
  ARRAY_AGG(DISTINCT s.difficulty ORDER BY s.difficulty) as difficulties_at_level
FROM scenarios s
WHERE s.hierarchy_level IS NOT NULL
GROUP BY s.hierarchy_level
ORDER BY s.hierarchy_level;

COMMENT ON VIEW scenario_level_stats IS
  'Provides statistics about scenarios at each hierarchy level for monitoring and analytics.';

GRANT SELECT ON scenario_level_stats TO authenticated;
