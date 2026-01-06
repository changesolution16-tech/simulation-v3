/*
  # Fix Scenario Options Access for Learners in Published Simulations

  ## Problem
  Learners cannot view scenario options when they are part of published simulations because
  the RLS policy only checks if the parent scenario is individually published, not if it's
  part of a published simulation.

  ## Changes
  1. Add new RLS policy to scenario_options table
     - Allow authenticated learners to view options for scenarios in published simulations
     - This enables the nested query to fetch options properly
  
  2. Security Notes
     - Policy still restricts access to authenticated users only
     - Only options for scenarios in published simulations are accessible
     - Must be linked through simulation_scenarios junction table
*/

-- Drop the policy if it exists and recreate it
DROP POLICY IF EXISTS "Learners can view options in published simulations" ON scenario_options;

-- Add policy to allow learners to view scenario options in published simulations
CREATE POLICY "Learners can view options in published simulations"
  ON scenario_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM scenarios s
      INNER JOIN simulation_scenarios ss ON ss.scenario_id = s.id
      INNER JOIN simulations sim ON sim.id = ss.simulation_id
      WHERE scenario_options.scenario_id = s.id
        AND sim.status = 'published'
    )
  );
