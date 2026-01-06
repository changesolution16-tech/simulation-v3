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
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Drop constraint on scenario_id if it exists
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'scenario_options'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%scenario_id%'
  LOOP
    EXECUTE 'ALTER TABLE scenario_options DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name;
  END LOOP;

  -- Drop constraint on next_scenario_id if it exists
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'scenario_options'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%next_scenario_id%'
  LOOP
    EXECUTE 'ALTER TABLE scenario_options DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name;
  END LOOP;
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
