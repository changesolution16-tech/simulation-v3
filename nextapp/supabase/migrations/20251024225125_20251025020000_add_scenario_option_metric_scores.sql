/*
  # Scenario Option Metric Scores

  ## Overview
  This migration adds the ability for scenario creators to assign specific metric scores
  to each response option. When learners select a response, the system uses these scores
  to:
  1. Calculate competency impacts based on metric performance
  2. Provide detailed feedback on which metrics were demonstrated
  3. Track learner development across multiple assessment dimensions
  4. Generate comprehensive final results showing metric-based competency growth

  ## Tables Created

  ### scenario_option_metrics
  Links scenario options to assessment metrics with specific score values
  - Allows creators to select which metrics apply to each option
  - Stores the score value for each metric (within metric's min/max range)
  - Includes optional description explaining the metric score
  - Supports multiple metrics per option for comprehensive assessment

  ## Flow
  1. Creator: Select metrics and assign scores while building scenario options
  2. Learner: Makes decision, system captures selected option's metric scores
  3. System: Calculates competency impacts based on metric scores
  4. Feedback: Shows learner which metrics they demonstrated and at what level
  5. Results: Aggregates all metric data to show comprehensive competency development

  ## Security
  - RLS enabled
  - Authenticated users can read mappings
  - Only admins can create/update/delete metric mappings
*/

-- ============================================================================
-- TABLE: Scenario Option Metric Scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS scenario_option_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL,
  option_id uuid NOT NULL,
  metric_id uuid NOT NULL REFERENCES assessment_metrics(id) ON DELETE CASCADE,

  -- Score configuration
  score_value decimal(5,2) NOT NULL,
  score_description text,

  -- Competency mapping (optional override of default metric->competency mapping)
  competency_impacts jsonb DEFAULT '{}'::jsonb,

  -- Weight and importance
  weight decimal(3,2) DEFAULT 1.0,
  is_primary_metric boolean DEFAULT false,

  -- Metadata
  configured_by uuid REFERENCES profiles(id),
  configuration_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(scenario_id, option_id, metric_id)
);

-- Enable RLS
ALTER TABLE scenario_option_metrics ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view metric mappings
CREATE POLICY "Authenticated users can view scenario option metrics"
  ON scenario_option_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage metric mappings
CREATE POLICY "Admins can insert scenario option metrics"
  ON scenario_option_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update scenario option metrics"
  ON scenario_option_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete scenario option metrics"
  ON scenario_option_metrics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_option_metrics_scenario ON scenario_option_metrics(scenario_id);
CREATE INDEX IF NOT EXISTS idx_option_metrics_option ON scenario_option_metrics(option_id);
CREATE INDEX IF NOT EXISTS idx_option_metrics_metric ON scenario_option_metrics(metric_id);
CREATE INDEX IF NOT EXISTS idx_option_metrics_scenario_option ON scenario_option_metrics(scenario_id, option_id);

-- ============================================================================
-- TABLE: Learner Metric Assessments
-- ============================================================================

CREATE TABLE IF NOT EXISTS learner_metric_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  simulation_instance_id uuid REFERENCES simulation_instances(id) ON DELETE CASCADE,
  scenario_id uuid,
  option_id uuid,
  metric_id uuid NOT NULL REFERENCES assessment_metrics(id) ON DELETE CASCADE,

  -- Assessment data
  score_achieved decimal(5,2) NOT NULL,
  metric_min_score decimal(5,2) NOT NULL,
  metric_max_score decimal(5,2) NOT NULL,
  metric_passing_threshold decimal(5,2),

  -- Performance indicators
  passed_threshold boolean GENERATED ALWAYS AS (
    CASE
      WHEN metric_passing_threshold IS NOT NULL
      THEN score_achieved >= metric_passing_threshold
      ELSE true
    END
  ) STORED,

  performance_level text CHECK (performance_level IN ('below_threshold', 'meets_threshold', 'exceeds_threshold', 'exemplary')),

  -- Context
  decision_timestamp timestamptz NOT NULL DEFAULT now(),
  competencies_impacted jsonb DEFAULT '{}'::jsonb,

  -- Metadata
  assessment_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learner_metric_assessments ENABLE ROW LEVEL SECURITY;

-- Learners can view their own assessments
CREATE POLICY "Learners can view own metric assessments"
  ON learner_metric_assessments FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

-- Instructors can view cohort assessments
CREATE POLICY "Instructors can view cohort metric assessments"
  ON learner_metric_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin')
    )
  );

-- System can insert assessments
CREATE POLICY "System can insert metric assessments"
  ON learner_metric_assessments FOR INSERT
  TO authenticated
  WITH CHECK (learner_id = auth.uid());

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_metric_assessments_learner ON learner_metric_assessments(learner_id);
CREATE INDEX IF NOT EXISTS idx_metric_assessments_simulation ON learner_metric_assessments(simulation_instance_id);
CREATE INDEX IF NOT EXISTS idx_metric_assessments_metric ON learner_metric_assessments(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_assessments_timestamp ON learner_metric_assessments(decision_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metric_assessments_learner_metric ON learner_metric_assessments(learner_id, metric_id);

-- ============================================================================
-- HELPER FUNCTION: Get Option Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_option_metrics(p_scenario_id uuid, p_option_id uuid)
RETURNS TABLE (
  metric_id uuid,
  metric_name text,
  metric_type text,
  score_value decimal,
  score_description text,
  min_score decimal,
  max_score decimal,
  passing_threshold decimal,
  competency_impacts jsonb
) AS $$
BEGIN
  RETURN QUERY
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
  ORDER BY som.is_primary_metric DESC, am.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Record Metric Assessment
-- ============================================================================

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
BEGIN
  -- Get all metrics for this option and record assessments
  FOR v_metric IN
    SELECT * FROM get_option_metrics(p_scenario_id, p_option_id)
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
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;