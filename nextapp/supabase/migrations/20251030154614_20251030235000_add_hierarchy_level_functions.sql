/*
  # Add Hierarchy Level Calculation Functions

  This migration adds the functions needed to calculate and manage scenario hierarchy levels.

  ## Functions Added
  1. detect_scenario_cycles() - Detects circular references in scenario connections
  2. calculate_scenario_hierarchy_levels() - Calculates levels based on connections
  3. apply_scenario_hierarchy_levels() - Applies calculated levels to scenarios table
  4. trigger_hierarchy_recalculation() - Trigger function for automatic recalculation
*/

-- ============================================================================
-- 1. CREATE FUNCTION TO DETECT CIRCULAR REFERENCES
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
      AND sg.depth < 100
      AND NOT (so.next_scenario_id = ANY(sg.path))
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
-- 2. CREATE FUNCTION TO CALCULATE HIERARCHY LEVELS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_scenario_hierarchy_levels()
RETURNS TABLE(scenario_id uuid, calculated_level integer) AS $$
DECLARE
  v_max_iterations integer := 100;
  v_iteration integer := 0;
  v_changes_made integer;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_scenario_levels (
    scenario_id uuid PRIMARY KEY,
    level integer
  ) ON COMMIT DROP;

  TRUNCATE temp_scenario_levels;

  INSERT INTO temp_scenario_levels (scenario_id, level)
  SELECT id, NULL
  FROM scenarios
  WHERE auto_calculate_level = true;

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

  LOOP
    v_iteration := v_iteration + 1;

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

    EXIT WHEN v_changes_made = 0 OR v_iteration >= v_max_iterations;
  END LOOP;

  UPDATE temp_scenario_levels
  SET level = 999
  WHERE level IS NULL;

  RETURN QUERY
  SELECT tsl.scenario_id, tsl.level
  FROM temp_scenario_levels tsl
  ORDER BY tsl.level, tsl.scenario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_scenario_hierarchy_levels() IS
  'Calculates hierarchy levels for all scenarios based on their connections. Root nodes are level 0, each subsequent level is parent level + 1.';

-- ============================================================================
-- 3. CREATE FUNCTION TO APPLY CALCULATED LEVELS
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_scenario_hierarchy_levels()
RETURNS jsonb AS $$
DECLARE
  v_updated_count integer := 0;
  v_result jsonb;
BEGIN
  WITH calculated_levels AS (
    SELECT * FROM calculate_scenario_hierarchy_levels()
  )
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

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC LEVEL RECALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_hierarchy_recalculation()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.next_scenario_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND OLD.next_scenario_id IS DISTINCT FROM NEW.next_scenario_id) OR
     (TG_OP = 'DELETE' AND OLD.next_scenario_id IS NOT NULL) THEN
    RAISE NOTICE 'Scenario connections changed, hierarchy levels may need recalculation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_recalculate_hierarchy_on_connection_change ON scenario_options;

CREATE TRIGGER trigger_recalculate_hierarchy_on_connection_change
  AFTER INSERT OR UPDATE OR DELETE ON scenario_options
  FOR EACH ROW
  EXECUTE FUNCTION trigger_hierarchy_recalculation();

COMMENT ON TRIGGER trigger_recalculate_hierarchy_on_connection_change ON scenario_options IS
  'Logs when scenario connections change so hierarchy levels can be recalculated.';

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION detect_scenario_cycles() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_scenario_hierarchy_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION apply_scenario_hierarchy_levels() TO authenticated;
