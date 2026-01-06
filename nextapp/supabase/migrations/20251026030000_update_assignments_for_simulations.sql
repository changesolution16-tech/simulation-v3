/*
  # Update Training Assignments to Support Simulation-Based Assignments

  1. Changes
    - Add `simulation_id` column to training_assignments
    - Add `category_id` column to training_assignments
    - Add `start_date` column (replaces available_from)
    - Add `end_date` column (replaces available_until)
    - Make scenario_ids nullable for simulation-based assignments
    - Add foreign key constraint for simulation_id
    - Add foreign key constraint for category_id

  2. Migration Strategy
    - Add new columns without breaking existing data
    - Keep scenario_ids for backwards compatibility
    - New assignments can use either simulation_id OR scenario_ids

  3. Notes
    - Existing assignments using scenario_ids will continue to work
    - New simulation-based assignments will use simulation_id
    - Category helps filter simulations for assignment creation
*/

-- Add simulation_id column for simulation-based assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'simulation_id'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN simulation_id uuid REFERENCES simulations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add category_id for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN category_id uuid REFERENCES simulation_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add start_date and end_date for clearer assignment windows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN start_date timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN end_date timestamptz;
  END IF;
END $$;

-- Make scenario_ids nullable since simulation-based assignments won't use it
DO $$
BEGIN
  ALTER TABLE training_assignments ALTER COLUMN scenario_ids DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- Create index for simulation_id lookups
CREATE INDEX IF NOT EXISTS idx_training_assignments_simulation_id ON training_assignments(simulation_id);

-- Create index for category_id lookups
CREATE INDEX IF NOT EXISTS idx_training_assignments_category_id ON training_assignments(category_id);

-- Add check constraint to ensure either simulation_id or scenario_ids is provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_assignments_content_check'
  ) THEN
    ALTER TABLE training_assignments
    ADD CONSTRAINT training_assignments_content_check
    CHECK (
      (simulation_id IS NOT NULL) OR
      (scenario_ids IS NOT NULL AND array_length(scenario_ids, 1) > 0)
    );
  END IF;
END $$;
