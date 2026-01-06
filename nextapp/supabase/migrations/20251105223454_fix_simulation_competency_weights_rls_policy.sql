/*
  # Fix Simulation Competency Weights RLS Policy

  ## Changes
  - Drop existing "Admins manage sim weights" policy
  - Create separate policies for INSERT, UPDATE, DELETE with proper with_check clauses
  - Ensure admins and instructors can save weight matrix changes

  ## Security
  - Only authenticated users with admin or instructor role can modify weights
  - All authenticated users can view weights
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Admins manage sim weights" ON simulation_competency_weights;

-- Create separate policies for each operation
CREATE POLICY "Admins can insert simulation weights"
  ON simulation_competency_weights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Admins can update simulation weights"
  ON simulation_competency_weights
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Admins can delete simulation weights"
  ON simulation_competency_weights
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );
