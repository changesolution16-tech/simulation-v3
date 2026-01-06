/*
  # Create Simulations Architecture

  This migration transforms the system from scenario-centric to simulation-centric architecture.

  ## Changes

  1. New Tables
    - `simulations` - Core learning paths composed of scenarios
    - `simulation_scenarios` - Junction table linking scenarios to simulations

  2. Modified Tables
    - `scenarios` - Add is_reusable flag
    - `training_assignments` - Add simulation_id reference
    - `simulation_instances` - Add simulation_id reference

  3. Security
    - Enable RLS on new tables
    - Add policies for admin access
    - Add policies for learner read access to published simulations
*/

-- Create simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category_id uuid REFERENCES simulation_categories(id) ON DELETE SET NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_duration_minutes integer DEFAULT 30,

  -- Status and Ownership
  status text CHECK (status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
  created_by uuid REFERENCES profiles(id),

  -- Landing Page Configuration
  landing_page_enabled boolean DEFAULT true,
  landing_intro_video_url text,
  landing_intro_video_type text CHECK (landing_intro_video_type IN ('youtube', 'synthesia', 'vimeo', 'file')) DEFAULT 'synthesia',
  landing_title text,
  landing_description text,
  landing_objectives jsonb DEFAULT '[]'::jsonb,
  landing_role_description text,
  landing_fiction_contract text DEFAULT 'I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences.',

  -- Closing Page Configuration
  closing_page_enabled boolean DEFAULT true,
  closing_video_url text,
  closing_video_type text CHECK (closing_video_type IN ('youtube', 'synthesia', 'vimeo', 'file')) DEFAULT 'synthesia',
  closing_title text DEFAULT 'Simulation Complete',
  closing_analysis_type text CHECK (closing_analysis_type IN ('score', 'skill', 'journey', 'comprehensive')) DEFAULT 'comprehensive',
  closing_feedback_templates jsonb DEFAULT '{}'::jsonb,
  closing_recommendations_enabled boolean DEFAULT true,

  -- Flow Configuration
  entry_scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL,

  -- Metadata
  tags text[] DEFAULT ARRAY[]::text[],
  is_template boolean DEFAULT false,
  template_source_id uuid REFERENCES simulations(id),
  version integer DEFAULT 1,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create simulation_scenarios junction table
CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Flow Properties
  is_entry_point boolean DEFAULT false,
  is_exit_point boolean DEFAULT false,
  sequence_order integer DEFAULT 0,

  -- Display Properties
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,

  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),

  UNIQUE(simulation_id, scenario_id)
);

-- Add is_reusable flag to scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_reusable boolean DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulations_category ON simulations(category_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_created_by ON simulations(created_by);
CREATE INDEX IF NOT EXISTS idx_simulations_difficulty ON simulations(difficulty);
CREATE INDEX IF NOT EXISTS idx_simulations_name ON simulations(name);

CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_simulation ON simulation_scenarios(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_scenario ON simulation_scenarios(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_entry ON simulation_scenarios(is_entry_point) WHERE is_entry_point = true;
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_exit ON simulation_scenarios(is_exit_point) WHERE is_exit_point = true;

-- Update training_assignments to reference simulation_id
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS simulation_id uuid REFERENCES simulations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_training_assignments_simulation ON training_assignments(simulation_id);

-- Update simulation_instances to reference simulation_id
ALTER TABLE simulation_instances ADD COLUMN IF NOT EXISTS simulation_id uuid REFERENCES simulations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_simulation_instances_simulation ON simulation_instances(simulation_id);

-- Enable Row Level Security
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for simulations

-- Admins and instructors can view all simulations
CREATE POLICY "Admins and instructors can view all simulations"
  ON simulations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Learners can view published simulations
CREATE POLICY "Learners can view published simulations"
  ON simulations FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can create simulations
CREATE POLICY "Admins and instructors can create simulations"
  ON simulations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can update their own simulations or all if admin
CREATE POLICY "Admins and instructors can update simulations"
  ON simulations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'instructor' AND simulations.created_by = auth.uid())
      )
    )
  );

-- Admins and instructors can delete their own simulations or all if admin
CREATE POLICY "Admins and instructors can delete simulations"
  ON simulations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'instructor' AND simulations.created_by = auth.uid())
      )
    )
  );

-- RLS Policies for simulation_scenarios

-- Admins and instructors can manage all simulation-scenario links
CREATE POLICY "Admins and instructors can manage simulation scenarios"
  ON simulation_scenarios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Learners can view simulation-scenario links for published simulations
CREATE POLICY "Learners can view published simulation scenarios"
  ON simulation_scenarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM simulations
      WHERE simulations.id = simulation_scenarios.simulation_id
      AND simulations.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER simulations_updated_at
  BEFORE UPDATE ON simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_simulations_updated_at();

-- Create trigger to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_simulation_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER simulation_publish_timestamp
  BEFORE UPDATE ON simulations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_simulation_published_at();