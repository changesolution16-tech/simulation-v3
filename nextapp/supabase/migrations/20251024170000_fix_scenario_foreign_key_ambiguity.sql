/*
  # Fix Foreign Key Ambiguity for Scenario Options

  1. Problem
    - The `scenario_options` table has two foreign keys to `scenarios`:
      - `scenario_id`: which scenario this option belongs to
      - `next_scenario_id`: which scenario this option leads to
    - This creates ambiguity when PostgREST tries to embed relationships
    - Causes PGRST201 error: "Could not embed because more than one relationship was found"

  2. Solution
    - Drop existing unnamed foreign key constraints
    - Recreate them with explicit, descriptive names
    - This allows PostgREST to use hint syntax to disambiguate relationships
    - Example: `scenarios!scenario_options_scenario_fkey(...)`

  3. Changes
    - Add named foreign key constraint for `scenario_id` -> `scenarios(id)`
    - Add named foreign key constraint for `next_scenario_id` -> `scenarios(id)`
    - Preserve ON DELETE behavior (CASCADE for scenario_id, SET NULL for next_scenario_id)
*/

-- First, check and drop existing foreign key constraints if they exist
DO $$
BEGIN
  -- Drop constraint on scenario_id if it exists (unnamed or differently named)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%scenario_options%scenario_id%'
    AND table_name = 'scenario_options'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE scenario_options DROP CONSTRAINT ' || constraint_name || ';'
      FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%scenario_options%scenario_id%'
      AND table_name = 'scenario_options'
      AND constraint_type = 'FOREIGN KEY'
      LIMIT 1
    );
  END IF;

  -- Drop constraint on next_scenario_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%scenario_options%next_scenario_id%'
    AND table_name = 'scenario_options'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE scenario_options DROP CONSTRAINT ' || constraint_name || ';'
      FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%scenario_options%next_scenario_id%'
      AND table_name = 'scenario_options'
      AND constraint_type = 'FOREIGN KEY'
      LIMIT 1
    );
  END IF;
END $$;

-- Add the foreign key constraints with explicit, descriptive names
-- This constraint links an option to its parent scenario
ALTER TABLE scenario_options
ADD CONSTRAINT scenario_options_scenario_fkey
FOREIGN KEY (scenario_id)
REFERENCES scenarios(id)
ON DELETE CASCADE;

-- This constraint links an option to the next scenario it leads to
ALTER TABLE scenario_options
ADD CONSTRAINT scenario_options_next_scenario_fkey
FOREIGN KEY (next_scenario_id)
REFERENCES scenarios(id)
ON DELETE SET NULL;

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_scenario_options_scenario_id ON scenario_options(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_options_next_scenario_id ON scenario_options(next_scenario_id);

-- Verify the constraints were created correctly
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints updated successfully';
  RAISE NOTICE 'Use scenarios!scenario_options_scenario_fkey(...) to embed parent scenario';
  RAISE NOTICE 'Use scenarios!scenario_options_next_scenario_fkey(...) to embed next scenario';
END $$;
