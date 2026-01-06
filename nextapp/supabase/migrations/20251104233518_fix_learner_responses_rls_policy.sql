-- Fix learner_responses RLS policy to work with instance_id
-- The current policy checks for attempt_id/learner_attempts, but the code uses instance_id

-- Drop old policies
DROP POLICY IF EXISTS "Learners can create responses" ON learner_responses;
DROP POLICY IF EXISTS "Learners can view own responses" ON learner_responses;

-- Create new INSERT policy that works with simulation_instances
CREATE POLICY "Learners can create responses via instance"
  ON learner_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if inserting for own simulation instance
    EXISTS (
      SELECT 1 FROM simulation_instances si
      WHERE si.id = instance_id
      AND si.learner_id = auth.uid()
    )
    OR
    -- Allow if using attempt_id (legacy)
    EXISTS (
      SELECT 1 FROM learner_attempts la
      WHERE la.id = attempt_id
      AND la.learner_id = auth.uid()
    )
  );

-- Create new SELECT policy
CREATE POLICY "Learners can view own responses via instance"
  ON learner_responses FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing own responses via instance_id
    EXISTS (
      SELECT 1 FROM simulation_instances si
      WHERE si.id = instance_id
      AND si.learner_id = auth.uid()
    )
    OR
    -- Allow viewing via attempt_id (legacy)
    EXISTS (
      SELECT 1 FROM learner_attempts la
      WHERE la.id = attempt_id
      AND la.learner_id = auth.uid()
    )
    OR
    -- Allow instructors/admins to view all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin')
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_learner_responses_instance_id
  ON learner_responses(instance_id) WHERE instance_id IS NOT NULL;
