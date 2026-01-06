/*
  # Add Simulation Metrics and Competency Tracking

  ## Overview
  Extends the simulations architecture to support admin-defined metrics and competency tracking
  for personalized learner feedback and recommendations.

  ## Changes

  1. New Tables
    - `simulation_metrics` - Links simulations to active assessment metrics with custom weights
    - `simulation_competencies` - Maps simulations to competencies being developed

  2. Modified Tables
    - `simulations` - Add tracked metrics and competencies configurations
    - `scenario_options` - Add competency impact tracking

  3. Security
    - Enable RLS on new tables
    - Add policies for admin management and learner read access

  4. Indexes
    - Performance indexes for common queries
*/

-- Add simulation metric configuration
CREATE TABLE IF NOT EXISTS simulation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES assessment_metrics(id) ON DELETE CASCADE,
  
  -- Configuration
  weight numeric(5,2) DEFAULT 1.00,
  is_required boolean DEFAULT true,
  custom_passing_threshold numeric(5,2),
  show_to_learner boolean DEFAULT true,
  
  -- Display
  display_order integer DEFAULT 0,
  custom_label text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(simulation_id, metric_id)
);

-- Add simulation competency mapping
CREATE TABLE IF NOT EXISTS simulation_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  
  -- Configuration
  is_primary boolean DEFAULT false,
  target_level integer DEFAULT 3,
  is_prerequisite boolean DEFAULT false,
  prerequisite_level integer,
  
  -- Display
  display_order integer DEFAULT 0,
  show_in_results boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(simulation_id, competency_id)
);

-- Add competency impacts to scenario options if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'competency_impacts'
  ) THEN
    ALTER TABLE scenario_options 
    ADD COLUMN competency_impacts jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add is_optimal_choice flag to scenario options
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'is_optimal_choice'
  ) THEN
    ALTER TABLE scenario_options 
    ADD COLUMN is_optimal_choice boolean DEFAULT false;
  END IF;
END $$;

-- Add quality score to scenario options
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE scenario_options 
    ADD COLUMN quality_score numeric(5,2) DEFAULT 50.00;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulation_metrics_simulation ON simulation_metrics(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_metrics_metric ON simulation_metrics(metric_id);
CREATE INDEX IF NOT EXISTS idx_simulation_competencies_simulation ON simulation_competencies(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_competencies_competency ON simulation_competencies(competency_id);

-- Enable Row Level Security
ALTER TABLE simulation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for simulation_metrics

CREATE POLICY "Admins and instructors can manage simulation metrics"
  ON simulation_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Learners can view metrics for published simulations"
  ON simulation_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM simulations
      WHERE simulations.id = simulation_metrics.simulation_id
      AND simulations.status = 'published'
    )
  );

-- RLS Policies for simulation_competencies

CREATE POLICY "Admins and instructors can manage simulation competencies"
  ON simulation_competencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Learners can view competencies for published simulations"
  ON simulation_competencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM simulations
      WHERE simulations.id = simulation_competencies.simulation_id
      AND simulations.status = 'published'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulation_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER simulation_metrics_updated_at
  BEFORE UPDATE ON simulation_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_metrics_updated_at();
