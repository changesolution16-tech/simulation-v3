/*
  # Fix RLS Auth Function Performance - Part 3

  Final batch of RLS policy optimizations.

  ## Tables Updated (Part 3)
  - video_watch_tracking
  - video_collections
  - video_collection_items
  - video_access_logs
  - video_library
  - video_files
  - storage_quotas
  - simulation_scenarios
  - bravin_learner_scores
  - bravin_decision_assessments
  - trust_impact_events
  - ethical_decision_quality_assessments
  - emotional_intelligence_assessments
  - cultural_stewardship_logs
  - learner_metric_assessments
*/

-- ============================================================================
-- video_watch_tracking
-- ============================================================================

DROP POLICY IF EXISTS "Instructors can view all video watch records" ON video_watch_tracking;
CREATE POLICY "Instructors can view all video watch records"
ON video_watch_tracking FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- video_collections
-- ============================================================================

DROP POLICY IF EXISTS "Users can view public collections" ON video_collections;
CREATE POLICY "Users can view public collections"
ON video_collections FOR SELECT
TO authenticated
USING (
  is_public = true OR
  created_by = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- video_collection_items
-- ============================================================================

DROP POLICY IF EXISTS "Users can view collection items" ON video_collection_items;
CREATE POLICY "Users can view collection items"
ON video_collection_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM video_collections vc
    WHERE vc.id = collection_id
    AND (vc.is_public = true OR vc.created_by = (SELECT auth.uid()))
  ) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- video_access_logs
-- ============================================================================

DROP POLICY IF EXISTS "Instructors can view access logs" ON video_access_logs;
CREATE POLICY "Instructors can view access logs"
ON video_access_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- video_library
-- ============================================================================

DROP POLICY IF EXISTS "Users can view public videos" ON video_library;
CREATE POLICY "Users can view public videos"
ON video_library FOR SELECT
TO authenticated
USING (
  is_public = true OR
  created_by = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- ============================================================================
-- video_files
-- ============================================================================

DROP POLICY IF EXISTS "All authenticated users can view video files" ON video_files;
CREATE POLICY "All authenticated users can view video files"
ON video_files FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- storage_quotas
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all storage quotas" ON storage_quotas;
CREATE POLICY "Admins can view all storage quotas"
ON storage_quotas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- simulation_scenarios
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view published simulation scenarios" ON simulation_scenarios;
CREATE POLICY "Learners can view published simulation scenarios"
ON simulation_scenarios FOR SELECT
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
-- bravin_learner_scores
-- ============================================================================

DROP POLICY IF EXISTS "System can insert learner BRAVIN scores" ON bravin_learner_scores;
CREATE POLICY "System can insert learner BRAVIN scores"
ON bravin_learner_scores FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "System can update learner BRAVIN scores" ON bravin_learner_scores;
CREATE POLICY "System can update learner BRAVIN scores"
ON bravin_learner_scores FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- bravin_decision_assessments
-- ============================================================================

DROP POLICY IF EXISTS "System can insert decision assessments" ON bravin_decision_assessments;
CREATE POLICY "System can insert decision assessments"
ON bravin_decision_assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- trust_impact_events
-- ============================================================================

DROP POLICY IF EXISTS "System can insert trust events" ON trust_impact_events;
CREATE POLICY "System can insert trust events"
ON trust_impact_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM bravin_decision_assessments bda
    WHERE bda.id = decision_assessment_id
    AND bda.learner_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- ethical_decision_quality_assessments
-- ============================================================================

DROP POLICY IF EXISTS "System can insert ethical assessments" ON ethical_decision_quality_assessments;
CREATE POLICY "System can insert ethical assessments"
ON ethical_decision_quality_assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- emotional_intelligence_assessments
-- ============================================================================

DROP POLICY IF EXISTS "System can insert EI assessments" ON emotional_intelligence_assessments;
CREATE POLICY "System can insert EI assessments"
ON emotional_intelligence_assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- cultural_stewardship_logs
-- ============================================================================

DROP POLICY IF EXISTS "System can insert stewardship logs" ON cultural_stewardship_logs;
CREATE POLICY "System can insert stewardship logs"
ON cultural_stewardship_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

-- ============================================================================
-- learner_metric_assessments
-- ============================================================================

DROP POLICY IF EXISTS "Allow metric assessment inserts" ON learner_metric_assessments;
CREATE POLICY "Allow metric assessment inserts"
ON learner_metric_assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  ) OR learner_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Instructors can view all metric assessments" ON learner_metric_assessments;
CREATE POLICY "Instructors can view all metric assessments"
ON learner_metric_assessments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role IN ('admin', 'instructor')
  )
);

DROP POLICY IF EXISTS "Learners can view own metric assessments" ON learner_metric_assessments;
CREATE POLICY "Learners can view own metric assessments"
ON learner_metric_assessments FOR SELECT
TO authenticated
USING (learner_id = (SELECT auth.uid()));
