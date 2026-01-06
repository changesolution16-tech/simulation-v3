/*
  # Fix Scenario Access for Learners in Published Simulations

  ## Problem
  Learners cannot view scenarios when they are part of published simulations because
  the RLS policy only checks if scenarios are individually published, not if they're
  part of a published simulation.

  ## Changes
  1. Add new RLS policy to scenarios table
     - Allow authenticated learners to view scenarios that are linked to published simulations
     - This enables the nested query in SimulationService.getSimulation() to work properly
  
  2. Security Notes
     - Policy still restricts access to authenticated users only
     - Only scenarios in published simulations are accessible
     - Scenarios must be linked via simulation_scenarios junction table
*/

-- Drop the policy if it exists and recreate it
DROP POLICY IF EXISTS "Learners can view scenarios in published simulations" ON scenarios;

-- Add policy to allow learners to view scenarios in published simulations
CREATE POLICY "Learners can view scenarios in published simulations"
  ON scenarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM simulation_scenarios ss
      INNER JOIN simulations sim ON sim.id = ss.simulation_id
      WHERE ss.scenario_id = scenarios.id
        AND sim.status = 'published'
    )
  );
