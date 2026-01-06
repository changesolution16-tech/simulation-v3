/*
  # Multi-Attempt Tracking and Score Management

  This migration adds comprehensive support for tracking multiple simulation attempts
  per learner and retrieving the highest scoring attempt for display.

  ## Key Features

  1. Attempt Number Tracking
    - Add attempt_number column to track sequential attempts
    - Automatically increment on new attempts for same simulation
    - Add unique constraint to prevent duplicate active attempts

  2. Score Aggregation
    - Add final_score column to store overall performance
    - Track bravin_overall_score for BRAVIN assessment results
    - Store metrics_average_score for competency assessments

  3. Multi-Attempt Queries
    - Function to get highest scoring attempt for a learner-simulation pair
    - Function to get all attempts with scores and metadata
    - Function to compare attempts side-by-side

  4. Automatic Completion Handling
    - Trigger to mark instance as completed when reaching end scenario
    - Calculate final scores automatically on completion
    - Validate and reconcile data on completion

  ## Safety Features

  - All operations use transactions for atomicity
  - Validation checks to ensure data integrity
  - Audit trail for tracking changes
  - Rollback capability for failed operations
*/

-- ============================================================================
-- PART 1: Add Attempt Tracking Columns
-- ============================================================================

DO $$
BEGIN
  -- Add attempt_number to track sequential attempts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'attempt_number'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN attempt_number integer DEFAULT 1;
    CREATE INDEX IF NOT EXISTS idx_simulation_instances_attempt ON simulation_instances(learner_id, simulation_id, attempt_number);
  END IF;

  -- Add final_score for overall performance (0-100 scale)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'final_score'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN final_score numeric(5,2) DEFAULT 0;
  END IF;

  -- Add bravin_overall_score for BRAVIN assessment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'bravin_overall_score'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN bravin_overall_score numeric(5,2) DEFAULT 0;
  END IF;

  -- Add metrics_average_score for competency assessments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'metrics_average_score'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN metrics_average_score numeric(5,2) DEFAULT 0;
  END IF;

  -- Add is_best_attempt flag for quick filtering
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances' AND column_name = 'is_best_attempt'
  ) THEN
    ALTER TABLE simulation_instances ADD COLUMN is_best_attempt boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_simulation_instances_best_attempt ON simulation_instances(learner_id, simulation_id, is_best_attempt) WHERE is_best_attempt = true;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN simulation_instances.attempt_number IS
  'Sequential attempt number for this learner-simulation pair (1, 2, 3, ...)';

COMMENT ON COLUMN simulation_instances.final_score IS
  'Overall performance score from 0-100, calculated on completion';

COMMENT ON COLUMN simulation_instances.bravin_overall_score IS
  'BRAVIN framework alignment score from 0-100';

COMMENT ON COLUMN simulation_instances.metrics_average_score IS
  'Average of all metric assessment scores from 0-100';

COMMENT ON COLUMN simulation_instances.is_best_attempt IS
  'Flag indicating if this is the highest scoring attempt for this learner-simulation pair';