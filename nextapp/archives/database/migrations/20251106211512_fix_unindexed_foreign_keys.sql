/*
  # Fix Unindexed Foreign Keys

  This migration adds indexes to all foreign key columns that don't have covering indexes.
  This significantly improves query performance for JOIN operations and foreign key lookups.

  ## Foreign Keys Being Indexed

  1. branding_settings.updated_by
  2. learner_competency_assessments.competency_id
  3. learner_competency_history.competency_id
  4. scenario_competency_weights.competency_id
  5. scenario_competency_weights.configured_by
  6. simulation_competency_weights.competency_id
  7. simulation_competency_weights.configured_by
  8. simulation_instances.current_scenario_id

  ## Performance Impact

  These indexes will improve:
  - JOIN performance when querying related data
  - Foreign key constraint checking during INSERT/UPDATE/DELETE
  - Query optimization for WHERE clauses on these columns
*/

-- Branding Settings
CREATE INDEX IF NOT EXISTS idx_branding_settings_updated_by
ON branding_settings(updated_by);

-- Learner Competency Assessments
CREATE INDEX IF NOT EXISTS idx_learner_competency_assessments_competency_id
ON learner_competency_assessments(competency_id);

-- Learner Competency History
CREATE INDEX IF NOT EXISTS idx_learner_competency_history_competency_id
ON learner_competency_history(competency_id);

-- Scenario Competency Weights
CREATE INDEX IF NOT EXISTS idx_scenario_competency_weights_competency_id
ON scenario_competency_weights(competency_id);

CREATE INDEX IF NOT EXISTS idx_scenario_competency_weights_configured_by
ON scenario_competency_weights(configured_by);

-- Simulation Competency Weights
CREATE INDEX IF NOT EXISTS idx_simulation_competency_weights_competency_id
ON simulation_competency_weights(competency_id);

CREATE INDEX IF NOT EXISTS idx_simulation_competency_weights_configured_by
ON simulation_competency_weights(configured_by);

-- Simulation Instances
CREATE INDEX IF NOT EXISTS idx_simulation_instances_current_scenario_id
ON simulation_instances(current_scenario_id);

COMMENT ON INDEX idx_branding_settings_updated_by IS
  'Improves performance for queries joining branding_settings with profiles';

COMMENT ON INDEX idx_learner_competency_assessments_competency_id IS
  'Improves performance for competency assessment lookups and aggregations';

COMMENT ON INDEX idx_learner_competency_history_competency_id IS
  'Improves performance for competency history tracking and reporting';

COMMENT ON INDEX idx_scenario_competency_weights_competency_id IS
  'Improves performance for scenario weight calculations';

COMMENT ON INDEX idx_simulation_competency_weights_competency_id IS
  'Improves performance for simulation weight calculations';

COMMENT ON INDEX idx_simulation_instances_current_scenario_id IS
  'Improves performance for current scenario lookups in active simulations';
