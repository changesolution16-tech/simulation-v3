/*
  # Fix RLS Auth Function Performance - Part 4

  Final remaining RLS policy optimizations.

  ## Tables Updated (Part 4)
  - simulation_metric_competency_mappings
  - mapping_templates
  - competency_impact_overrides
  - simulations
  - competency_metric_weights_global
  - simulation_competency_weights
  - scenario_competency_weights
  - learner_competency_assessments
  - learner_competency_history
*/

-- ============================================================================
-- simulation_metric_competency_mappings
-- ============================================================================

DROP POLICY IF EXISTS "Users can view mappings for published simulations" ON simulation_metric_competency_mappings;
CREATE POLICY "Users can view mappings for published simulations"
ON simulation_metric_competency_mappings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM simulations s
    WHERE s.id = simulation_id
    AND s.published_at IS NOT NULL
  ) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- mapping_templates
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all templates" ON mapping_templates;
CREATE POLICY "Admins can manage all templates"
ON mapping_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can create their own templates" ON mapping_templates;
CREATE POLICY "Users can create their own templates"
ON mapping_templates FOR INSERT
TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own templates" ON mapping_templates;
CREATE POLICY "Users can update their own templates"
ON mapping_templates FOR UPDATE
TO authenticated
USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view public templates" ON mapping_templates;
CREATE POLICY "Users can view public templates"
ON mapping_templates FOR SELECT
TO authenticated
USING (
  is_public = true OR
  created_by = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- competency_impact_overrides
-- ============================================================================

DROP POLICY IF EXISTS "Instructors can view all overrides" ON competency_impact_overrides;
CREATE POLICY "Instructors can view all overrides"
ON competency_impact_overrides FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- simulations
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view published simulations" ON simulations;
CREATE POLICY "Learners can view published simulations"
ON simulations FOR SELECT
TO authenticated
USING (
  published_at IS NOT NULL OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- competency_metric_weights_global
-- ============================================================================

DROP POLICY IF EXISTS "Admins manage weights" ON competency_metric_weights_global;
CREATE POLICY "Admins manage weights"
ON competency_metric_weights_global FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- simulation_competency_weights
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete simulation weights" ON simulation_competency_weights;
CREATE POLICY "Admins can delete simulation weights"
ON simulation_competency_weights FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert simulation weights" ON simulation_competency_weights;
CREATE POLICY "Admins can insert simulation weights"
ON simulation_competency_weights FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update simulation weights" ON simulation_competency_weights;
CREATE POLICY "Admins can update simulation weights"
ON simulation_competency_weights FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- scenario_competency_weights
-- ============================================================================

DROP POLICY IF EXISTS "Admins manage scenario weights" ON scenario_competency_weights;
CREATE POLICY "Admins manage scenario weights"
ON scenario_competency_weights FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- learner_competency_assessments
-- ============================================================================

DROP POLICY IF EXISTS "Learners view own assessments" ON learner_competency_assessments;
CREATE POLICY "Learners view own assessments"
ON learner_competency_assessments FOR SELECT
TO authenticated
USING (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System creates assessments" ON learner_competency_assessments;
CREATE POLICY "System creates assessments"
ON learner_competency_assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- learner_competency_history
-- ============================================================================

DROP POLICY IF EXISTS "Learners view own history" ON learner_competency_history;
CREATE POLICY "Learners view own history"
ON learner_competency_history FOR SELECT
TO authenticated
USING (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System manages history" ON learner_competency_history;
CREATE POLICY "System manages history"
ON learner_competency_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);
