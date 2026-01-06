/*
  # Add Level-Based Completion Tracking to Simulation Instances

  ## Overview
  This migration adds fields to track level-based completion metrics for branching simulations.
  These fields enable proper display of completion status based on levels completed rather than
  total scenarios viewed.

  ## Changes Made
  1. Add max_level column to store the total number of levels in the simulation
  2. Add levels_completed column to track how many levels the learner completed
  3. Add decision_count column to track number of decisions/branching points navigated
  4. Update existing records with sensible defaults

  ## Why These Fields
  - max_level: Enables display of "Level X of Y" progress
  - levels_completed: Shows completion based on hierarchy progression
  - decision_count: Tracks engagement through decision points
*/

-- Add level tracking fields to simulation_instances
ALTER TABLE simulation_instances
ADD COLUMN IF NOT EXISTS max_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS levels_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS decision_count integer DEFAULT 0;

-- Add helpful comments
COMMENT ON COLUMN simulation_instances.max_level IS 
  'Maximum hierarchy level available in the simulation (calculated from simulation structure)';

COMMENT ON COLUMN simulation_instances.levels_completed IS 
  'Number of hierarchy levels the learner completed (0-indexed, so max_level of 3 means 4 levels)';

COMMENT ON COLUMN simulation_instances.decision_count IS 
  'Number of decision points (branching choices) the learner navigated';

-- Update existing records to set decision_count equal to total_scenarios_completed
UPDATE simulation_instances 
SET decision_count = COALESCE(total_scenarios_completed, 0)
WHERE decision_count = 0;
