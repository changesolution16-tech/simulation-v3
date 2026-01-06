/*
  # Fix RLS Auth Function Performance - Part 2

  Continues optimizing RLS policies for remaining tables.

  ## Tables Updated (Part 2)
  - assignment_learners
  - rubric_templates
  - performance_assessments
  - learner_competencies
  - learner_badges
  - decision_analytics
  - learning_events
  - branding_settings
  - category_statistics
  - category_learner_progress
*/

-- ============================================================================
-- assignment_learners
-- ============================================================================

DROP POLICY IF EXISTS "Create assignment learners" ON assignment_learners;
CREATE POLICY "Create assignment learners"
ON assignment_learners FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Delete assignment learners" ON assignment_learners;
CREATE POLICY "Delete assignment learners"
ON assignment_learners FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Update assignment learners" ON assignment_learners;
CREATE POLICY "Update assignment learners"
ON assignment_learners FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "View assignment learners" ON assignment_learners;
CREATE POLICY "View assignment learners"
ON assignment_learners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- rubric_templates
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view public rubrics" ON rubric_templates;
CREATE POLICY "Learners can view public rubrics"
ON rubric_templates FOR SELECT
TO authenticated
USING (
  is_public = true OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- performance_assessments
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own assessments" ON performance_assessments;
CREATE POLICY "Learners can view own assessments"
ON performance_assessments FOR SELECT
TO authenticated
USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- learner_competencies
-- ============================================================================

DROP POLICY IF EXISTS "System can update learner competencies" ON learner_competencies;
CREATE POLICY "System can update learner competencies"
ON learner_competencies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- learner_badges
-- ============================================================================

DROP POLICY IF EXISTS "System can award badges" ON learner_badges;
CREATE POLICY "System can award badges"
ON learner_badges FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- decision_analytics
-- ============================================================================

DROP POLICY IF EXISTS "System can create analytics" ON decision_analytics;
CREATE POLICY "System can create analytics"
ON decision_analytics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- learning_events
-- ============================================================================

DROP POLICY IF EXISTS "System can create learning events" ON learning_events;
CREATE POLICY "System can create learning events"
ON learning_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR actor_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can view their learning events" ON learning_events;
CREATE POLICY "Users can view their learning events"
ON learning_events FOR SELECT
TO authenticated
USING (actor_id = (SELECT auth.uid()));

-- ============================================================================
-- branding_settings
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert branding settings" ON branding_settings;
CREATE POLICY "Admins can insert branding settings"
ON branding_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update branding settings" ON branding_settings;
CREATE POLICY "Admins can update branding settings"
ON branding_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- category_statistics
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all category statistics" ON category_statistics;
CREATE POLICY "Admins can read all category statistics"
ON category_statistics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "System can update category statistics" ON category_statistics;
CREATE POLICY "System can update category statistics"
ON category_statistics FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- category_learner_progress
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all category progress" ON category_learner_progress;
CREATE POLICY "Admins can read all category progress"
ON category_learner_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Learners can read own category progress" ON category_learner_progress;
CREATE POLICY "Learners can read own category progress"
ON category_learner_progress FOR SELECT
TO authenticated
USING (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Learners can update own category progress" ON category_learner_progress;
CREATE POLICY "Learners can update own category progress"
ON category_learner_progress FOR UPDATE
TO authenticated
USING (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can read cohort category progress" ON category_learner_progress;
CREATE POLICY "Teachers can read cohort category progress"
ON category_learner_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);
