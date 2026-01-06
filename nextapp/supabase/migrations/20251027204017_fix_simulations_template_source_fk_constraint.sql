/*
  # Fix Simulations Template Source Foreign Key Constraint

  ## Problem
  The `template_source_id` column in the `simulations` table has a self-referencing 
  foreign key constraint without an ON DELETE action. This prevents deletion of 
  simulations that have been used as templates for duplicated simulations.

  ## Solution
  Drop the existing constraint and recreate it with `ON DELETE SET NULL` behavior.
  This allows template source simulations to be deleted while preserving duplicated
  simulations by setting their `template_source_id` to NULL.

  ## Changes
  1. Drop the existing `simulations_template_source_id_fkey` constraint
  2. Add new constraint with `ON DELETE SET NULL` behavior
  3. This affects the `simulations` table `template_source_id` column

  ## Impact
  - Deleting a simulation that was used as a template source will now succeed
  - Duplicated simulations will have their `template_source_id` set to NULL
  - No data loss occurs - duplicated simulations remain intact
  - Users can delete any simulation without foreign key constraint errors
*/

-- Drop the existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'simulations_template_source_id_fkey'
    AND table_name = 'simulations'
  ) THEN
    ALTER TABLE simulations DROP CONSTRAINT simulations_template_source_id_fkey;
  END IF;
END $$;

-- Add the new foreign key constraint with ON DELETE SET NULL
ALTER TABLE simulations 
  ADD CONSTRAINT simulations_template_source_id_fkey 
  FOREIGN KEY (template_source_id) 
  REFERENCES simulations(id) 
  ON DELETE SET NULL;