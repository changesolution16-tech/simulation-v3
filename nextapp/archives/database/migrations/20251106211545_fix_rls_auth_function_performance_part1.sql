/*
  # Fix RLS Auth Function Performance - Part 1

  This migration optimizes RLS policies by wrapping auth functions in SELECT statements.
  This prevents re-evaluation of auth.uid() for each row, significantly improving performance.

  ## Pattern Change
  Before: auth.uid() = user_id
  After: (SELECT auth.uid()) = user_id

  ## Tables Updated (Part 1)
  - learner_responses
  - scenario_branches
  - learner_journeys
  - path_analytics
  - simulation_templates
  - path_recommendations
  - cohort_members (partial)
*/

-- ============================================================================
-- learner_responses
-- ============================================================================

DROP POLICY IF EXISTS "Learners can create responses via instance" ON learner_responses;
CREATE POLICY "Learners can create responses via instance"
ON learner_responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM simulation_instances si
    WHERE si.id = instance_id
    AND si.learner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Learners can view own responses via instance" ON learner_responses;
CREATE POLICY "Learners can view own responses via instance"
ON learner_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM simulation_instances si
    WHERE si.id = instance_id
    AND si.learner_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- scenario_branches
-- ============================================================================

DROP POLICY IF EXISTS "Users can view scenario branches" ON scenario_branches;
CREATE POLICY "Users can view scenario branches"
ON scenario_branches FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- ============================================================================
-- learner_journeys
-- ============================================================================

DROP POLICY IF EXISTS "Instructors can view all journeys" ON learner_journeys;
CREATE POLICY "Instructors can view all journeys"
ON learner_journeys FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- path_analytics
-- ============================================================================

DROP POLICY IF EXISTS "System can manage path analytics" ON path_analytics;
CREATE POLICY "System can manage path analytics"
ON path_analytics FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- simulation_templates
-- ============================================================================

DROP POLICY IF EXISTS "Creators can manage own templates" ON simulation_templates;
CREATE POLICY "Creators can manage own templates"
ON simulation_templates FOR ALL
TO authenticated
USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Everyone can view public templates" ON simulation_templates;
CREATE POLICY "Everyone can view public templates"
ON simulation_templates FOR SELECT
TO authenticated
USING (
  is_public = true OR created_by = (SELECT auth.uid())
);

-- ============================================================================
-- path_recommendations
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own recommendations" ON path_recommendations;
CREATE POLICY "Users can update own recommendations"
ON path_recommendations FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own recommendations" ON path_recommendations;
CREATE POLICY "Users can view own recommendations"
ON path_recommendations FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- cohort_members (partial - most frequently accessed policies)
-- ============================================================================

DROP POLICY IF EXISTS "Admins and instructors can view all cohort members" ON cohort_members;
CREATE POLICY "Admins and instructors can view all cohort members"
ON cohort_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Admins and instructors can add cohort members" ON cohort_members;
CREATE POLICY "Admins and instructors can add cohort members"
ON cohort_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Admins and instructors can update cohort members" ON cohort_members;
CREATE POLICY "Admins and instructors can update cohort members"
ON cohort_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Admins and instructors can remove cohort members" ON cohort_members;
CREATE POLICY "Admins and instructors can remove cohort members"
ON cohort_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);
