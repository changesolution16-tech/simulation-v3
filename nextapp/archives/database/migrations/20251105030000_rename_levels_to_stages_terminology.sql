/*
  # Rename Level Terminology to Stage Terminology

  ## Problem
  The system has been using "level" for two different concepts:
  1. Simulation flow position (hierarchy_level: 0, 1, 2, 3) - renamed to "stage"
  2. Difficulty complexity (beginner, intermediate, advanced) - kept as "difficulty"

  This causes confusion when users see "Level 1 of 4" (stages) and "Select Difficulty Level" (complexity).

  ## Changes
  1. Rename hierarchy_level to stage_number in scenarios table
  2. Rename max_level to max_stage in simulation_instances table
  3. Rename levels_completed to stages_completed in simulation_instances table
  4. Update all related indexes, comments, and constraints
  5. Update database functions that reference these columns
  6. Preserve all existing data during rename

  ## Terminology Going Forward
  - **Stage**: Position in simulation flow (0, 1, 2, 3, 4)
  - **Difficulty**: Complexity level (beginner, intermediate, advanced)
*/

-- Step 1: Rename hierarchy_level to stage_number in scenarios table
DO $$
BEGIN
  -- Check if hierarchy_level exists and stage_number doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'hierarchy_level'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'stage_number'
  ) THEN
    ALTER TABLE scenarios RENAME COLUMN hierarchy_level TO stage_number;
    RAISE NOTICE 'Renamed scenarios.hierarchy_level to stage_number';
  ELSE
    RAISE NOTICE 'scenarios.stage_number already exists or hierarchy_level not found';
  END IF;
END $$;

-- Step 2: Rename max_level to max_stage in simulation_instances table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'max_level'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'max_stage'
  ) THEN
    ALTER TABLE simulation_instances RENAME COLUMN max_level TO max_stage;
    RAISE NOTICE 'Renamed simulation_instances.max_level to max_stage';
  ELSE
    RAISE NOTICE 'simulation_instances.max_stage already exists or max_level not found';
  END IF;
END $$;

-- Step 3: Rename levels_completed to stages_completed in simulation_instances table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'levels_completed'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'stages_completed'
  ) THEN
    ALTER TABLE simulation_instances RENAME COLUMN levels_completed TO stages_completed;
    RAISE NOTICE 'Renamed simulation_instances.levels_completed to stages_completed';
  ELSE
    RAISE NOTICE 'simulation_instances.stages_completed already exists or levels_completed not found';
  END IF;
END $$;

-- Step 4: Update column comments
COMMENT ON COLUMN scenarios.stage_number IS
  'The stage position in the simulation flow (0=start, 1=first decision, 2=second, etc.). This is different from difficulty level.';

COMMENT ON COLUMN simulation_instances.max_stage IS
  'Maximum stage number available in the simulation (0-indexed). Example: max_stage=3 means 4 stages (0,1,2,3).';

COMMENT ON COLUMN simulation_instances.stages_completed IS
  'Highest stage number the learner reached (0-indexed). Example: stages_completed=2 means completed through stage 2.';

-- Step 5: Recreate index with new column name
DROP INDEX IF EXISTS idx_scenarios_hierarchy_level;
CREATE INDEX IF NOT EXISTS idx_scenarios_stage_number
  ON scenarios(stage_number)
  WHERE stage_number IS NOT NULL;

COMMENT ON INDEX idx_scenarios_stage_number IS
  'Index for querying scenarios by their stage position in the simulation flow';

-- Step 6: Update get_simulation_max_level function to use new column names
-- Rename the function itself for clarity
CREATE OR REPLACE FUNCTION get_simulation_max_stage(p_simulation_id uuid)
RETURNS integer AS $$
DECLARE
  v_max_stage integer;
BEGIN
  SELECT COALESCE(MAX(s.stage_number), 0)
  INTO v_max_stage
  FROM simulation_scenarios ss
  INNER JOIN scenarios s ON s.id = ss.scenario_id
  WHERE ss.simulation_id = p_simulation_id
    AND s.stage_number IS NOT NULL;

  RETURN v_max_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_simulation_max_stage IS
  'Returns the maximum stage number for a simulation. Stages represent flow position, not difficulty level.';

-- Keep the old function name as an alias for backward compatibility during transition
CREATE OR REPLACE FUNCTION get_simulation_max_level(p_simulation_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN get_simulation_max_stage(p_simulation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_simulation_max_level IS
  'DEPRECATED: Use get_simulation_max_stage instead. This function exists for backward compatibility.';

-- Step 7: Update calculate_scenario_hierarchy_levels function
CREATE OR REPLACE FUNCTION calculate_scenario_stage_numbers()
RETURNS TABLE(
  scenario_id uuid,
  calculated_stage integer
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE scenario_tree AS (
    -- Base case: root scenarios (no parent or stage=0)
    SELECT
      s.id,
      0 as stage_number
    FROM scenarios s
    WHERE s.parent_scenario_id IS NULL
       OR s.stage_number = 0

    UNION ALL

    -- Recursive case: child scenarios
    SELECT
      s.id,
      st.stage_number + 1
    FROM scenarios s
    INNER JOIN scenario_options so ON s.id = so.next_scenario_id
    INNER JOIN scenario_tree st ON so.scenario_id = st.id
  )
  SELECT
    st.id as scenario_id,
    MAX(st.stage_number) as calculated_stage
  FROM scenario_tree st
  GROUP BY st.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_scenario_stage_numbers IS
  'Calculates stage numbers for scenarios based on their position in the branching tree';

-- Keep old function name as alias
CREATE OR REPLACE FUNCTION calculate_scenario_hierarchy_levels()
RETURNS TABLE(
  scenario_id uuid,
  calculated_level integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT scenario_id, calculated_stage
  FROM calculate_scenario_stage_numbers();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_scenario_hierarchy_levels IS
  'DEPRECATED: Use calculate_scenario_stage_numbers instead. This function exists for backward compatibility.';

-- Step 8: Update the view that shows simulation statistics
CREATE OR REPLACE VIEW simulation_stage_statistics AS
SELECT
  s.id as simulation_id,
  s.display_name,
  s.difficulty as difficulty_level,
  COUNT(DISTINCT ss.scenario_id) as total_scenarios,
  COUNT(DISTINCT sc.stage_number) as total_stages,
  MIN(sc.stage_number) as min_stage,
  MAX(sc.stage_number) as max_stage,
  s.status
FROM simulations s
LEFT JOIN simulation_scenarios ss ON s.id = ss.simulation_id
LEFT JOIN scenarios sc ON ss.scenario_id = sc.id
GROUP BY s.id, s.display_name, s.difficulty, s.status;

COMMENT ON VIEW simulation_stage_statistics IS
  'Statistics about simulation stages and scenarios. Note: difficulty_level is complexity (beginner/intermediate/advanced), stages are flow positions (0,1,2,3).';

-- Step 9: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_simulation_max_stage TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_scenario_stage_numbers TO authenticated;
GRANT SELECT ON simulation_stage_statistics TO authenticated;

-- Step 10: Add a helper view to clarify terminology
CREATE OR REPLACE VIEW terminology_clarification AS
SELECT
  'stage_number' as column_name,
  'scenarios' as table_name,
  'Position in simulation flow (0, 1, 2, 3, etc.)' as meaning,
  'Stage' as display_term,
  'The step in the branching journey' as user_explanation
UNION ALL
SELECT
  'difficulty',
  'scenarios',
  'Complexity level (beginner, intermediate, advanced)',
  'Difficulty Level',
  'How challenging the content is'
UNION ALL
SELECT
  'max_stage',
  'simulation_instances',
  'Highest stage number in simulation',
  'Total Stages',
  'Number of steps in the simulation'
UNION ALL
SELECT
  'stages_completed',
  'simulation_instances',
  'Highest stage reached by learner',
  'Stages Completed',
  'How far the learner progressed';

COMMENT ON VIEW terminology_clarification IS
  'Reference view explaining the difference between stages (flow position) and difficulty (complexity level)';

-- Step 11: Log the migration completion
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration Complete: Level → Stage Terminology';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. scenarios.hierarchy_level → stage_number';
  RAISE NOTICE '2. simulation_instances.max_level → max_stage';
  RAISE NOTICE '3. simulation_instances.levels_completed → stages_completed';
  RAISE NOTICE '4. Updated all related functions and indexes';
  RAISE NOTICE '5. Old function names kept for backward compatibility';
  RAISE NOTICE '';
  RAISE NOTICE 'Terminology clarified:';
  RAISE NOTICE '- STAGE = position in flow (0,1,2,3)';
  RAISE NOTICE '- DIFFICULTY = complexity (beginner/intermediate/advanced)';
  RAISE NOTICE '===========================================';
END $$;
