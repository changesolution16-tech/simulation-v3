/*
  # Add Missing Columns to Training Assignments

  ## Summary
  This migration adds the missing category_id, start_date, and end_date columns
  to the training_assignments table that are required for assignment creation.

  ## Changes Made
  1. Add category_id column with foreign key to simulation_categories
  2. Add start_date column for assignment start time
  3. Add end_date column for assignment end time
  4. Make scenario_ids nullable to support simulation-based assignments
  5. Add check constraint to ensure either simulation_id or scenario_ids is provided
  6. Create indexes for performance

  ## Notes
  - simulation_id was added in a previous migration
  - This completes the schema update for simulation-based assignments
*/

-- Add category_id for filtering simulations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN category_id uuid REFERENCES simulation_categories(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added category_id column';
  ELSE
    RAISE NOTICE 'category_id column already exists';
  END IF;
END $$;

-- Add start_date for clearer assignment windows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN start_date timestamptz DEFAULT now();
    RAISE NOTICE 'Added start_date column';
  ELSE
    RAISE NOTICE 'start_date column already exists';
  END IF;
END $$;

-- Add end_date for clearer assignment windows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_assignments' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE training_assignments ADD COLUMN end_date timestamptz;
    RAISE NOTICE 'Added end_date column';
  ELSE
    RAISE NOTICE 'end_date column already exists';
  END IF;
END $$;

-- Make scenario_ids nullable since simulation-based assignments won't use it
DO $$
BEGIN
  ALTER TABLE training_assignments ALTER COLUMN scenario_ids DROP NOT NULL;
  RAISE NOTICE 'Made scenario_ids nullable';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'scenario_ids is already nullable or error occurred: %', SQLERRM;
END $$;

-- Create index for category_id lookups
CREATE INDEX IF NOT EXISTS idx_training_assignments_category_id ON training_assignments(category_id);

-- Create index for simulation_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_training_assignments_simulation_id ON training_assignments(simulation_id);

-- Drop existing check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_assignments_content_check'
  ) THEN
    ALTER TABLE training_assignments DROP CONSTRAINT training_assignments_content_check;
    RAISE NOTICE 'Dropped existing training_assignments_content_check constraint';
  END IF;
END $$;

-- Add check constraint to ensure either simulation_id or scenario_ids is provided
ALTER TABLE training_assignments
ADD CONSTRAINT training_assignments_content_check
CHECK (
  (simulation_id IS NOT NULL) OR
  (scenario_ids IS NOT NULL AND array_length(scenario_ids, 1) > 0)
);
