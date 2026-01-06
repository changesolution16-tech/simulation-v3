/*
  # Add Scenario-Targeted Competencies System
  
  1. New Tables
    - `scenario_targeted_competencies`
      - Links scenarios to target competencies with priority weighting
      - Tracks which competencies each scenario is designed to develop
      - Supports primary/secondary competency designation
      - Enables automatic metric-to-competency mapping
  
  2. Helper Functions
    - `get_scenario_targeted_competencies(scenario_id)` - Retrieve competencies for a scenario
    - `auto_generate_metric_competency_mappings(scenario_id, simulation_id)` - Automatically create mappings
  
  3. Security
    - Enable RLS on scenario_targeted_competencies
    - Admins can manage targeted competencies
    - Authenticated users can view targeted competencies
*/

-- Create scenario_targeted_competencies table
CREATE TABLE IF NOT EXISTS scenario_targeted_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  target_weight decimal(3,2) DEFAULT 1.0 CHECK (target_weight >= 0 AND target_weight <= 1.0),
  is_primary boolean DEFAULT false,
  development_priority text CHECK (development_priority IN ('primary', 'secondary', 'supplementary')) DEFAULT 'secondary',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(scenario_id, competency_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenario_targeted_competencies_scenario_id 
  ON scenario_targeted_competencies(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_targeted_competencies_competency_id 
  ON scenario_targeted_competencies(competency_id);
CREATE INDEX IF NOT EXISTS idx_scenario_targeted_competencies_priority 
  ON scenario_targeted_competencies(development_priority);

-- Enable RLS
ALTER TABLE scenario_targeted_competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view targeted competencies"
  ON scenario_targeted_competencies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert targeted competencies"
  ON scenario_targeted_competencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update targeted competencies"
  ON scenario_targeted_competencies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete targeted competencies"
  ON scenario_targeted_competencies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Helper function to get targeted competencies for a scenario
CREATE OR REPLACE FUNCTION get_scenario_targeted_competencies(p_scenario_id uuid)
RETURNS TABLE (
  id uuid,
  scenario_id uuid,
  competency_id uuid,
  competency_code text,
  competency_name text,
  competency_description text,
  competency_level integer,
  target_weight decimal,
  is_primary boolean,
  development_priority text,
  notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    stc.id,
    stc.scenario_id,
    stc.competency_id,
    c.code as competency_code,
    c.name as competency_name,
    c.description as competency_description,
    c.competency_level,
    stc.target_weight,
    stc.is_primary,
    stc.development_priority,
    stc.notes
  FROM scenario_targeted_competencies stc
  JOIN competencies c ON c.id = stc.competency_id
  WHERE stc.scenario_id = p_scenario_id
  ORDER BY 
    stc.is_primary DESC,
    stc.development_priority,
    c.name;
END;
$$;

-- Function to get metric type to competency type mapping recommendations
CREATE OR REPLACE FUNCTION get_metric_competency_mapping_recommendations(
  p_metric_type text,
  p_competency_codes text[]
)
RETURNS TABLE (
  competency_code text,
  recommended_method text,
  recommended_weight decimal,
  rationale text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    code,
    method,
    weight,
    reason
  FROM (
    -- Communication metrics map to communication competencies
    SELECT 
      unnest(p_competency_codes) as code,
      CASE 
        WHEN unnest(p_competency_codes) LIKE 'COM%' AND p_metric_type = 'communication' THEN 'linear'
        WHEN unnest(p_competency_codes) LIKE 'IPC%' AND p_metric_type = 'communication' THEN 'linear'
        WHEN unnest(p_competency_codes) LIKE 'STR%' AND p_metric_type = 'decision_quality' THEN 'threshold_based'
        WHEN unnest(p_competency_codes) LIKE 'PRO%' AND p_metric_type = 'problem_solving' THEN 'linear'
        WHEN unnest(p_competency_codes) LIKE 'EI%' AND p_metric_type = 'emotional_intelligence' THEN 'threshold_based'
        WHEN unnest(p_competency_codes) LIKE 'SLF%' AND p_metric_type = 'emotional_intelligence' THEN 'exponential_growth'
        ELSE 'linear'
      END as method,
      CASE
        WHEN unnest(p_competency_codes) LIKE 'COM%' AND p_metric_type = 'communication' THEN 1.0
        WHEN unnest(p_competency_codes) LIKE 'IPC%' AND p_metric_type = 'communication' THEN 0.8
        WHEN unnest(p_competency_codes) LIKE 'STR%' AND p_metric_type = 'decision_quality' THEN 1.0
        WHEN unnest(p_competency_codes) LIKE 'PRO%' AND p_metric_type = 'problem_solving' THEN 1.0
        WHEN unnest(p_competency_codes) LIKE 'EI%' AND p_metric_type = 'emotional_intelligence' THEN 1.0
        ELSE 0.6
      END as weight,
      CASE
        WHEN unnest(p_competency_codes) LIKE 'COM%' AND p_metric_type = 'communication' 
          THEN 'Direct mapping: Communication metric to Communication competency'
        WHEN unnest(p_competency_codes) LIKE 'STR%' AND p_metric_type = 'decision_quality'
          THEN 'Strategic thinking requires quality decision-making'
        WHEN unnest(p_competency_codes) LIKE 'PRO%' AND p_metric_type = 'problem_solving'
          THEN 'Direct mapping: Problem-solving metric to Problem-solving competency'
        WHEN unnest(p_competency_codes) LIKE 'EI%' AND p_metric_type = 'emotional_intelligence'
          THEN 'Direct mapping: EI metric to EI competency'
        ELSE 'Supporting competency relationship'
      END as reason
  ) mapping_data;
END;
$$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_scenario_targeted_competencies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scenario_targeted_competencies_timestamp
  BEFORE UPDATE ON scenario_targeted_competencies
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_targeted_competencies_timestamp();
