/*
  # Add BRAVIN Leadership Culture Metrics to Assessment System

  ## Overview
  This migration integrates JMMB's five specialized BRAVIN leadership culture metrics
  into the standard assessment_metrics system, making them visible and manageable
  through the MetricsManager interface.

  ## Changes

  1. **Extend assessment_metrics table**
     - Add new BRAVIN-specific metric types to the CHECK constraint
     - Add the five JMMB leadership culture metrics as assessment metrics

  2. **New Metrics Added**
     - BRAVIN Alignment Score
     - Trust Impact Rating
     - Ethical Decision Quality
     - Emotional Intelligence Index
     - Cultural Stewardship Score

  3. **Integration**
     - All BRAVIN metrics are marked as global and active
     - Configured with appropriate min/max scores and thresholds
     - Set to automatic measurement method (calculated from BRAVIN dimensions)

  ## Security
  - Existing RLS policies on assessment_metrics apply to BRAVIN metrics
  - All authenticated users can view active metrics
  - Only admins can modify metrics
*/

-- ============================================================================
-- STEP 1: Extend metric_type CHECK constraint to include BRAVIN types
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'assessment_metrics_metric_type_check'
    AND table_name = 'assessment_metrics'
  ) THEN
    ALTER TABLE assessment_metrics DROP CONSTRAINT assessment_metrics_metric_type_check;
  END IF;

  ALTER TABLE assessment_metrics ADD CONSTRAINT assessment_metrics_metric_type_check
    CHECK (metric_type IN (
      'decision_quality',
      'timing',
      'critical_thinking',
      'emotional_intelligence',
      'communication',
      'problem_solving',
      'adaptability',
      'collaboration',
      'custom',
      'bravin_alignment',
      'trust_impact',
      'ethical_decision_quality',
      'emotional_intelligence_index',
      'cultural_stewardship'
    ));
END $$;

-- ============================================================================
-- STEP 2: Insert the five JMMB BRAVIN Leadership Culture Metrics
-- ============================================================================

DO $$
BEGIN
  -- BRAVIN Alignment Score
  IF NOT EXISTS (SELECT 1 FROM assessment_metrics WHERE name = 'BRAVIN Alignment Score') THEN
    INSERT INTO assessment_metrics (
      name, description, metric_type, measurement_method,
      min_score, max_score, passing_threshold, is_global, is_active
    ) VALUES (
      'BRAVIN Alignment Score',
      'Tracks how consistently learners choose actions that reflect Boldness, Responsibility, Accountability, Vision, Integrity, and Nurturance. This metric provides an overall measure of alignment with JMMB''s core leadership values.',
      'bravin_alignment',
      'automatic',
      0, 100, 70, true, true
    );
  END IF;

  -- Trust Impact Rating
  IF NOT EXISTS (SELECT 1 FROM assessment_metrics WHERE name = 'Trust Impact Rating') THEN
    INSERT INTO assessment_metrics (
      name, description, metric_type, measurement_method,
      min_score, max_score, passing_threshold, is_global, is_active
    ) VALUES (
      'Trust Impact Rating',
      'Measures the effect of each decision on team trust, psychological safety, and cultural cohesion. Based on the BRAVING framework, this metric evaluates how choices build or damage trust within teams.',
      'trust_impact',
      'automatic',
      -100, 100, 0, true, true
    );
  END IF;

  -- Ethical Decision Quality
  IF NOT EXISTS (SELECT 1 FROM assessment_metrics WHERE name = 'Ethical Decision Quality') THEN
    INSERT INTO assessment_metrics (
      name, description, metric_type, measurement_method,
      min_score, max_score, passing_threshold, is_global, is_active
    ) VALUES (
      'Ethical Decision Quality',
      'Evaluates the learner''s ability to balance performance with values, especially under pressure. This metric assesses ethical reasoning, stakeholder consideration, and long-term thinking in complex situations.',
      'ethical_decision_quality',
      'automatic',
      0, 100, 70, true, true
    );
  END IF;

  -- Emotional Intelligence Index
  IF NOT EXISTS (SELECT 1 FROM assessment_metrics WHERE name = 'Emotional Intelligence Index') THEN
    INSERT INTO assessment_metrics (
      name, description, metric_type, measurement_method,
      min_score, max_score, passing_threshold, is_global, is_active
    ) VALUES (
      'Emotional Intelligence Index',
      'Assesses how well learners recognize emotional cues, respond with empathy, and create space for authentic dialogue. Combines self-awareness, self-regulation, motivation, empathy, and social skills.',
      'emotional_intelligence_index',
      'automatic',
      0, 100, 70, true, true
    );
  END IF;

  -- Cultural Stewardship Score
  IF NOT EXISTS (SELECT 1 FROM assessment_metrics WHERE name = 'Cultural Stewardship Score') THEN
    INSERT INTO assessment_metrics (
      name, description, metric_type, measurement_method,
      min_score, max_score, passing_threshold, is_global, is_active
    ) VALUES (
      'Cultural Stewardship Score',
      'Reflects how actively learners protect and shape JMMB''s desired culture through their choices. Measures culture-shaping actions, values advocacy, and role modeling quality.',
      'cultural_stewardship',
      'automatic',
      0, 100, 70, true, true
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create indexes for BRAVIN metric queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assessment_metrics_type ON assessment_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_assessment_metrics_global ON assessment_metrics(is_global) WHERE is_global = true;

-- ============================================================================
-- STEP 4: Add helper function to get BRAVIN metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bravin_metrics()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  metric_type text,
  min_score numeric,
  max_score numeric,
  passing_threshold numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.name,
    am.description,
    am.metric_type,
    am.min_score,
    am.max_score,
    am.passing_threshold
  FROM assessment_metrics am
  WHERE am.metric_type IN (
    'bravin_alignment',
    'trust_impact',
    'ethical_decision_quality',
    'emotional_intelligence_index',
    'cultural_stewardship'
  )
  AND am.is_active = true
  ORDER BY
    CASE am.metric_type
      WHEN 'bravin_alignment' THEN 1
      WHEN 'trust_impact' THEN 2
      WHEN 'ethical_decision_quality' THEN 3
      WHEN 'emotional_intelligence_index' THEN 4
      WHEN 'cultural_stewardship' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_bravin_metrics() IS 'Helper function to retrieve all BRAVIN leadership culture metrics in their standard order. These metrics integrate with the bravin_dimensions, bravin_decision_assessments, and related BRAVIN assessment tables.';
