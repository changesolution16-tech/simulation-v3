/*
  # Optimize RLS Policies for Performance

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth function for each row
    - Significantly improves query performance at scale

  2. Purpose
    - Fix Auth RLS Initialization Plan warnings
    - Optimize RLS policy evaluation
    - Improve database query performance

  3. Notes
    - Only updates policies with auth.uid() calls
    - Does not change policy logic, only optimization
    - Safe to apply to production
*/

-- ============================================================================
-- learner_attempts policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can create attempts" ON learner_attempts;
CREATE POLICY "Learners can create attempts"
  ON learner_attempts FOR INSERT
  TO authenticated
  WITH CHECK (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Learners can view own attempts" ON learner_attempts;
CREATE POLICY "Learners can view own attempts"
  ON learner_attempts FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- learner_responses policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can create responses" ON learner_responses;
CREATE POLICY "Learners can create responses"
  ON learner_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learner_attempts la
      WHERE la.id = learner_responses.attempt_id
      AND la.learner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Learners can view own responses" ON learner_responses;
CREATE POLICY "Learners can view own responses"
  ON learner_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learner_attempts la
      WHERE la.id = learner_responses.attempt_id
      AND la.learner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- skill_tracking policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own skills" ON skill_tracking;
CREATE POLICY "Learners can view own skills"
  ON skill_tracking FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System can update skills" ON skill_tracking;
CREATE POLICY "System can update skills"
  ON skill_tracking FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- learning_recommendations policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own recommendations" ON learning_recommendations;
CREATE POLICY "Learners can view own recommendations"
  ON learning_recommendations FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- simulation_instances policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can create instances" ON simulation_instances;
CREATE POLICY "Learners can create instances"
  ON simulation_instances FOR INSERT
  TO authenticated
  WITH CHECK (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Learners can update own instances" ON simulation_instances;
CREATE POLICY "Learners can update own instances"
  ON simulation_instances FOR UPDATE
  TO authenticated
  USING (learner_id = (SELECT auth.uid()))
  WITH CHECK (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Learners can view own instances" ON simulation_instances;
CREATE POLICY "Learners can view own instances"
  ON simulation_instances FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- profiles policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- learner_journeys policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own journeys" ON learner_journeys;
CREATE POLICY "Users can insert own journeys"
  ON learner_journeys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own journeys" ON learner_journeys;
CREATE POLICY "Users can view own journeys"
  ON learner_journeys FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- cohorts policies
-- ============================================================================

DROP POLICY IF EXISTS "Creators and admins delete cohorts" ON cohorts;
CREATE POLICY "Creators and admins delete cohorts"
  ON cohorts FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Creators and admins update cohorts" ON cohorts;
CREATE POLICY "Creators and admins update cohorts"
  ON cohorts FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
    )
  );

-- ============================================================================
-- cohort_members policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view their own cohort membership" ON cohort_members;
CREATE POLICY "Learners can view their own cohort membership"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- learner_competencies policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own competency levels" ON learner_competencies;
CREATE POLICY "Learners can view own competency levels"
  ON learner_competencies FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System can update learner competencies" ON learner_competencies;
CREATE POLICY "System can update learner competencies"
  ON learner_competencies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- learner_badges policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own badges" ON learner_badges;
CREATE POLICY "Learners can view own badges"
  ON learner_badges FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- decision_analytics policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own analytics" ON decision_analytics;
CREATE POLICY "Learners can view own analytics"
  ON decision_analytics FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- learning_events policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their learning events" ON learning_events;
CREATE POLICY "Users can view their learning events"
  ON learning_events FOR SELECT
  TO authenticated
  USING (actor_id = (SELECT auth.uid()));

-- ============================================================================
-- video_watch_tracking policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own video watch records" ON video_watch_tracking;
CREATE POLICY "Users can insert own video watch records"
  ON video_watch_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own video watch records" ON video_watch_tracking;
CREATE POLICY "Users can update own video watch records"
  ON video_watch_tracking FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own video watch records" ON video_watch_tracking;
CREATE POLICY "Users can view own video watch records"
  ON video_watch_tracking FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- storage_quotas policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own storage quota" ON storage_quotas;
CREATE POLICY "Users can view their own storage quota"
  ON storage_quotas FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- landing_page_progress policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own landing page progress" ON landing_page_progress;
CREATE POLICY "Users can delete own landing page progress"
  ON landing_page_progress FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own landing page progress" ON landing_page_progress;
CREATE POLICY "Users can insert own landing page progress"
  ON landing_page_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read own landing page progress" ON landing_page_progress;
CREATE POLICY "Users can read own landing page progress"
  ON landing_page_progress FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own landing page progress" ON landing_page_progress;
CREATE POLICY "Users can update own landing page progress"
  ON landing_page_progress FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- bravin_learner_scores policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own BRAVIN scores" ON bravin_learner_scores;
CREATE POLICY "Learners can view own BRAVIN scores"
  ON bravin_learner_scores FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- bravin_decision_assessments policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own decision assessments" ON bravin_decision_assessments;
CREATE POLICY "Learners can view own decision assessments"
  ON bravin_decision_assessments FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- trust_impact_events policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own trust events" ON trust_impact_events;
CREATE POLICY "Learners can view own trust events"
  ON trust_impact_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bravin_decision_assessments bda
      WHERE bda.id = trust_impact_events.decision_assessment_id
      AND bda.learner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- ethical_decision_quality_assessments policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own ethical assessments" ON ethical_decision_quality_assessments;
CREATE POLICY "Learners can view own ethical assessments"
  ON ethical_decision_quality_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bravin_decision_assessments bda
      WHERE bda.id = ethical_decision_quality_assessments.decision_assessment_id
      AND bda.learner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- emotional_intelligence_assessments policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own EI assessments" ON emotional_intelligence_assessments;
CREATE POLICY "Learners can view own EI assessments"
  ON emotional_intelligence_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bravin_decision_assessments bda
      WHERE bda.id = emotional_intelligence_assessments.decision_assessment_id
      AND bda.learner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- cultural_stewardship_logs policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own stewardship logs" ON cultural_stewardship_logs;
CREATE POLICY "Learners can view own stewardship logs"
  ON cultural_stewardship_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bravin_decision_assessments bda
      WHERE bda.id = cultural_stewardship_logs.decision_assessment_id
      AND bda.learner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- learner_metric_assessments policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own metric assessments" ON learner_metric_assessments;
CREATE POLICY "Learners can view own metric assessments"
  ON learner_metric_assessments FOR SELECT
  TO authenticated
  USING (learner_id = (SELECT auth.uid()));

-- ============================================================================
-- mapping_templates policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can create their own templates" ON mapping_templates;
CREATE POLICY "Users can create their own templates"
  ON mapping_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own templates" ON mapping_templates;
CREATE POLICY "Users can update their own templates"
  ON mapping_templates FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- ============================================================================
-- simulation_templates policies
-- ============================================================================

DROP POLICY IF EXISTS "Creators can manage own templates" ON simulation_templates;
CREATE POLICY "Creators can manage own templates"
  ON simulation_templates FOR ALL
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- ============================================================================
-- path_recommendations policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own recommendations" ON path_recommendations;
CREATE POLICY "Users can update own recommendations"
  ON path_recommendations FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own recommendations" ON path_recommendations;
CREATE POLICY "Users can view own recommendations"
  ON path_recommendations FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
