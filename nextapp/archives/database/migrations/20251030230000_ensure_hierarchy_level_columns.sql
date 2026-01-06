/*
  # Ensure Hierarchy Level Columns Exist

  This migration ensures that the hierarchy_level and auto_calculate_level columns
  exist in the scenarios table. This is a safe migration that checks for column
  existence before attempting to add them.

  ## Changes Made
  1. Add hierarchy_level column if it doesn't exist
  2. Add auto_calculate_level column if it doesn't exist
  3. Add helpful column comments
  4. Set default values for existing rows
*/

-- Add hierarchy_level column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scenarios'
    AND column_name = 'hierarchy_level'
  ) THEN
    ALTER TABLE scenarios
    ADD COLUMN hierarchy_level integer DEFAULT NULL;

    RAISE NOTICE 'Added hierarchy_level column to scenarios table';
  ELSE
    RAISE NOTICE 'hierarchy_level column already exists in scenarios table';
  END IF;
END $$;

-- Add auto_calculate_level column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scenarios'
    AND column_name = 'auto_calculate_level'
  ) THEN
    ALTER TABLE scenarios
    ADD COLUMN auto_calculate_level boolean DEFAULT true;

    RAISE NOTICE 'Added auto_calculate_level column to scenarios table';
  ELSE
    RAISE NOTICE 'auto_calculate_level column already exists in scenarios table';
  END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN scenarios.hierarchy_level IS
  'Hierarchical level/tier of the scenario in the flow. 0 = root, higher numbers = deeper in tree. NULL = not yet calculated.';

COMMENT ON COLUMN scenarios.auto_calculate_level IS
  'If true, hierarchy_level is automatically calculated from connections. If false, level is manually set and preserved.';

-- Set default value for existing rows that have NULL auto_calculate_level
UPDATE scenarios
SET auto_calculate_level = true
WHERE auto_calculate_level IS NULL;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_scenarios_hierarchy_level
  ON scenarios(hierarchy_level)
  WHERE hierarchy_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenarios_auto_calculate
  ON scenarios(auto_calculate_level)
  WHERE auto_calculate_level = true;

RAISE NOTICE 'Hierarchy level columns ensured in scenarios table';
