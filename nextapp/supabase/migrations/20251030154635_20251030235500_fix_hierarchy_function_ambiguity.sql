/*
  # Fix Column Ambiguity in Hierarchy Level Function

  Fixes the ambiguous column reference in calculate_scenario_hierarchy_levels function.
*/

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
  WHERE tsl.scenario_id IN (
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
