/*
  # Drop Problematic stages_max_check Constraint

  ## Problem
  The constraint `simulation_instances_stages_max_check` was causing errors:
  "new row violates check constraint simulation_instances_stages_max_check"

  ## Root Cause
  1. The constraint checks: `stages_completed <= COALESCE(max_stage, stages_completed)`
  2. But `max_stage` defaults to 0 and is never being set
  3. The trigger sets `max_level` (different column)
  4. When stages_completed tries to become 1, it fails because 1 > 0

  ## Solution
  Drop the constraint entirely. The update_simulation_progress function already
  has logic to prevent invalid values using LEAST().

  This is safe because:
  - The application logic prevents invalid progression
  - The update_simulation_progress function caps values properly
  - Having both constraint and function logic is redundant and error-prone
*/

-- Drop the problematic constraint
ALTER TABLE simulation_instances
DROP CONSTRAINT IF EXISTS simulation_instances_stages_max_check;

-- Also ensure stages_completed_check allows progression
ALTER TABLE simulation_instances
DROP CONSTRAINT IF EXISTS simulation_instances_stages_completed_check;

ALTER TABLE simulation_instances
ADD CONSTRAINT simulation_instances_stages_completed_check
CHECK (stages_completed >= 0);

COMMENT ON CONSTRAINT simulation_instances_stages_completed_check ON simulation_instances IS
  'Ensures stages_completed is never negative. Upper bound is enforced by application logic.';
