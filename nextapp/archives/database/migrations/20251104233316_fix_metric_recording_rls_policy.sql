-- Fix Metric Recording RLS Policy Issue
-- This migration fixes the RLS policy that prevents metric assessments from being recorded

-- Update the record_metric_assessment function to bypass RLS
CREATE OR REPLACE FUNCTION record_metric_assessment(
  p_learner_id uuid,
  p_simulation_instance_id uuid,
  p_scenario_id uuid,
  p_option_id uuid
)
RETURNS void AS $$
DECLARE
  v_metric RECORD;
  v_performance_level text;
  v_rows_inserted integer := 0;
BEGIN
  -- Bypass RLS for this function execution (safe because function is SECURITY DEFINER)
  SET LOCAL row_security = off;

  -- Validate inputs
  IF p_learner_id IS NULL OR p_simulation_instance_id IS NULL OR
     p_scenario_id IS NULL OR p_option_id IS NULL THEN
    RAISE EXCEPTION 'All parameters must be non-null';
  END IF;

  -- Get all metrics for this option and record assessments
  FOR v_metric IN
    SELECT
      som.metric_id,
      am.name as metric_name,
      am.metric_type,
      som.score_value,
      som.score_description,
      am.min_score,
      am.max_score,
      am.passing_threshold,
      som.competency_impacts
    FROM scenario_option_metrics som
    JOIN assessment_metrics am ON am.id = som.metric_id
    WHERE som.scenario_id = p_scenario_id
      AND som.option_id = p_option_id
      AND am.is_active = true
    ORDER BY som.is_primary_metric DESC, am.name
  LOOP
    -- Determine performance level
    IF v_metric.score_value < v_metric.passing_threshold THEN
      v_performance_level := 'below_threshold';
    ELSIF v_metric.score_value < (v_metric.max_score * 0.85) THEN
      v_performance_level := 'meets_threshold';
    ELSIF v_metric.score_value < (v_metric.max_score * 0.95) THEN
      v_performance_level := 'exceeds_threshold';
    ELSE
      v_performance_level := 'exemplary';
    END IF;

    -- Insert assessment record
    INSERT INTO learner_metric_assessments (
      learner_id,
      simulation_instance_id,
      scenario_id,
      option_id,
      metric_id,
      score_achieved,
      metric_min_score,
      metric_max_score,
      metric_passing_threshold,
      performance_level,
      competencies_impacted
    ) VALUES (
      p_learner_id,
      p_simulation_instance_id,
      p_scenario_id,
      p_option_id,
      v_metric.metric_id,
      v_metric.score_value,
      v_metric.min_score,
      v_metric.max_score,
      v_metric.passing_threshold,
      v_performance_level,
      v_metric.competency_impacts
    );

    v_rows_inserted := v_rows_inserted + 1;
  END LOOP;

  RAISE NOTICE 'Successfully inserted % metric assessment(s)', v_rows_inserted;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in record_metric_assessment: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_metric_assessment TO authenticated;

-- Update RLS Policies
DROP POLICY IF EXISTS "System can insert metric assessments" ON learner_metric_assessments;

CREATE POLICY "Allow metric assessment inserts"
  ON learner_metric_assessments FOR INSERT
  TO authenticated
  WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS "Learners can view own metric assessments" ON learner_metric_assessments;
CREATE POLICY "Learners can view own metric assessments"
  ON learner_metric_assessments FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view cohort metric assessments" ON learner_metric_assessments;
CREATE POLICY "Instructors can view all metric assessments"
  ON learner_metric_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin')
    )
  );
