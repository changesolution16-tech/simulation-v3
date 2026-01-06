/*
  # Drop Duplicate Indexes

  This migration removes duplicate indexes that provide identical functionality.
  Keeping duplicate indexes wastes storage space and slows down write operations.

  ## Duplicates Being Removed

  1. learner_responses table:
     - Keeping: idx_learner_responses_instance_id
     - Dropping: idx_learner_responses_instance (duplicate)
     - Keeping: idx_learner_responses_scenario_id
     - Dropping: idx_learner_responses_scenario (duplicate)

  2. scenario_branches table:
     - Keeping: scenario_branches_from_option_unique (has UNIQUE constraint)
     - Dropping: scenario_branches_from_scenario_id_option_id_key (duplicate unique)
*/

-- Drop duplicate indexes on learner_responses
DROP INDEX IF EXISTS idx_learner_responses_instance;
DROP INDEX IF EXISTS idx_learner_responses_scenario;

-- Drop duplicate unique constraint on scenario_branches
-- Keep the one with clearer name
ALTER TABLE scenario_branches
DROP CONSTRAINT IF EXISTS scenario_branches_from_scenario_id_option_id_key;

COMMENT ON INDEX idx_learner_responses_instance_id IS
  'Primary index for instance lookups (duplicate removed)';

COMMENT ON INDEX idx_learner_responses_scenario_id IS
  'Primary index for scenario lookups (duplicate removed)';

COMMENT ON INDEX scenario_branches_from_option_unique IS
  'Ensures each option can only branch once (duplicate constraint removed)';
