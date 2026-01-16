/*
  Fix simulation_scenarios Foreign Key Constraint Issue

  Problem:
  - The simulation_scenarios table has a foreign key constraint on scenario_id
  - This is a legacy/optional field that is not being used
  - When creating new scenarios, scenario_id is not set (NULL)
  - The foreign key constraint may have issues preventing inserts

  Solution:
  - Drop the foreign key constraint
  - Make scenario_id explicitly nullable
  - Keep the column for backward compatibility but without enforcement

  This is safe because:
  1. The code doesn't set scenario_id when creating scenarios
  2. The code uses simulation_scenarios.id as the primary identifier
  3. This is documented as "Optional legacy link" in SIMULATION_SCENARIOS_SCHEMA_GUIDE.md
*/

-- Step 1: Find the constraint name (it may vary)
DO $$
DECLARE
  constraint_name_var text;
BEGIN
  -- Get the constraint name
  SELECT tc.constraint_name INTO constraint_name_var
  FROM information_schema.table_constraints AS tc
  WHERE tc.table_name = 'simulation_scenarios'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE '%scenario_id%'
  LIMIT 1;

  -- Drop the constraint if it exists
  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE simulation_scenarios DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
    RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name_var;
  ELSE
    RAISE NOTICE 'No foreign key constraint found on scenario_id';
  END IF;
END $$;

-- Step 2: Ensure scenario_id is nullable (should already be, but let's be sure)
DO $$
BEGIN
  -- Check if the column exists first
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_scenarios' AND column_name = 'scenario_id'
  ) THEN
    -- Make it nullable
    ALTER TABLE simulation_scenarios ALTER COLUMN scenario_id DROP NOT NULL;
    RAISE NOTICE 'scenario_id column is now nullable';
  ELSE
    RAISE NOTICE 'scenario_id column does not exist (this is fine)';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'scenario_id was already nullable or does not exist';
END $$;

-- Step 3: Add a comment explaining this is optional/legacy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_scenarios' AND column_name = 'scenario_id'
  ) THEN
    COMMENT ON COLUMN simulation_scenarios.scenario_id IS
      'LEGACY/OPTIONAL: Reference to scenarios table. Not used by current code. ' ||
      'simulation_scenarios.id is the primary identifier.';
  END IF;
END $$;

-- Step 4: Show the current state
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'simulation_scenarios'
  AND column_name = 'scenario_id';

-- Step 5: Verify no foreign key constraints remain on scenario_id
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'simulation_scenarios'
  AND kcu.column_name = 'scenario_id'
  AND tc.constraint_type = 'FOREIGN KEY';
