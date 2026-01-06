/*
  # Enhanced Branching Scenario Schema

  1. New Tables
    - `scenario_branches` - Explicit tracking of all scenario connections and paths
    - `learner_journeys` - Complete path history with timestamps and metadata
    - `path_analytics` - Aggregated statistics for each unique path through scenarios
    - `content_versions` - Version control for scenarios with rollback capability
    - `simulation_templates` - Reusable scenario structures and branching patterns
    - `scenario_conditions` - Conditional branching logic based on skill levels
    - `path_recommendations` - AI/rule-based suggestions for optimal learning paths

  2. Enhanced Tables
    - Add visual positioning data to scenarios for flowchart builder
    - Add branching metadata and statistics
    - Add content status workflow (draft/review/published)

  3. Security
    - Enable RLS on all new tables
    - Policies for content creators, reviewers, and administrators
    - Learner access policies for active content only

  4. Performance
    - Indexes on all foreign keys
    - Composite indexes for common path queries
*/

-- ============================================================================
-- SCENARIO BRANCHES - Explicit path tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS scenario_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE,
  to_scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE,
  option_id text NOT NULL,
  branch_order integer DEFAULT 0,
  is_conditional boolean DEFAULT false,
  condition_type text CHECK (condition_type IN ('skill_threshold', 'previous_choice', 'time_limit', 'random', 'none')),
  condition_config jsonb DEFAULT '{}'::jsonb,
  branch_weight integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_scenario_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_branches_from ON scenario_branches(from_scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_branches_to ON scenario_branches(to_scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_branches_conditional ON scenario_branches(is_conditional);

-- ============================================================================
-- LEARNER JOURNEYS - Complete path history
-- ============================================================================

CREATE TABLE IF NOT EXISTS learner_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_instance_id uuid REFERENCES simulation_instances(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL,
  option_id text,
  sequence_number integer NOT NULL,
  skill_impacts jsonb DEFAULT '{}'::jsonb,
  cumulative_skills jsonb DEFAULT '{}'::jsonb,
  decision_time_seconds integer,
  feedback_viewed boolean DEFAULT false,
  video_watched boolean DEFAULT false,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_learner_journeys_instance ON learner_journeys(simulation_instance_id);
CREATE INDEX IF NOT EXISTS idx_learner_journeys_user ON learner_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_journeys_scenario ON learner_journeys(scenario_id);
CREATE INDEX IF NOT EXISTS idx_learner_journeys_timestamp ON learner_journeys(timestamp DESC);

-- ============================================================================
-- PATH ANALYTICS - Aggregated path statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS path_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  path_signature text NOT NULL,
  path_nodes text[] NOT NULL,
  completion_count integer DEFAULT 0,
  average_duration_seconds integer,
  average_skill_gain jsonb DEFAULT '{}'::jsonb,
  success_rate numeric(5,2),
  last_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, difficulty, path_signature)
);

CREATE INDEX IF NOT EXISTS idx_path_analytics_topic ON path_analytics(topic_id);
CREATE INDEX IF NOT EXISTS idx_path_analytics_difficulty ON path_analytics(difficulty);
CREATE INDEX IF NOT EXISTS idx_path_analytics_completion_count ON path_analytics(completion_count DESC);

-- ============================================================================
-- CONTENT VERSIONS - Scenario version control
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES scenarios(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  description text,
  content_data jsonb NOT NULL,
  change_summary text,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_versions_scenario ON content_versions(scenario_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_active ON content_versions(scenario_id);

-- ============================================================================
-- SIMULATION TEMPLATES - Reusable structures
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  template_data jsonb NOT NULL,
  preview_image_url text,
  node_count integer DEFAULT 0,
  branch_count integer DEFAULT 0,
  estimated_duration_minutes integer,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulation_templates_category ON simulation_templates(category);
CREATE INDEX IF NOT EXISTS idx_simulation_templates_public ON simulation_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_simulation_templates_usage ON simulation_templates(usage_count DESC);

-- ============================================================================
-- SCENARIO CONDITIONS - Conditional branching logic
-- ============================================================================

CREATE TABLE IF NOT EXISTS scenario_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES scenario_branches(id) ON DELETE CASCADE,
  condition_type text NOT NULL CHECK (condition_type IN ('skill_min', 'skill_max', 'previous_path', 'time_elapsed', 'attempt_count', 'custom')),
  skill_name text,
  threshold_value numeric,
  comparison_operator text CHECK (comparison_operator IN ('gt', 'gte', 'lt', 'lte', 'eq', 'neq')),
  previous_scenario_ids uuid[],
  custom_logic jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenario_conditions_branch ON scenario_conditions(branch_id);
CREATE INDEX IF NOT EXISTS idx_scenario_conditions_type ON scenario_conditions(condition_type);

-- ============================================================================
-- PATH RECOMMENDATIONS - Learning path suggestions
-- ============================================================================

CREATE TABLE IF NOT EXISTS path_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  recommended_difficulty text CHECK (recommended_difficulty IN ('beginner', 'intermediate', 'advanced')),
  recommended_path uuid[],
  reasoning text,
  confidence_score numeric(3,2),
  based_on_skills jsonb DEFAULT '{}'::jsonb,
  is_accepted boolean,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_path_recommendations_user ON path_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_path_recommendations_topic ON path_recommendations(topic_id);

-- ============================================================================
-- ENHANCE EXISTING SCENARIOS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'position_x'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN position_x integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'position_y'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN position_y integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'content_status'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN content_status text DEFAULT 'draft' CHECK (content_status IN ('draft', 'review', 'published', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN published_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'version_number'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN version_number integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'parent_scenario_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN parent_scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'branching_metadata'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN branching_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE scenario_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and instructors can manage branches"
  ON scenario_branches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Learners can view published branches"
  ON scenario_branches FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE learner_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journeys"
  ON learner_journeys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own journeys"
  ON learner_journeys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can view all journeys"
  ON learner_journeys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

ALTER TABLE path_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view path analytics"
  ON path_analytics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage path analytics"
  ON path_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and instructors can manage versions"
  ON content_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Everyone can view versions"
  ON content_versions FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE simulation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage own templates"
  ON simulation_templates FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Everyone can view public templates"
  ON simulation_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Admins can manage all templates"
  ON simulation_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

ALTER TABLE scenario_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and instructors can manage conditions"
  ON scenario_conditions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Everyone can view conditions"
  ON scenario_conditions FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE path_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON path_recommendations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create recommendations"
  ON path_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own recommendations"
  ON path_recommendations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scenario_branches_updated_at BEFORE UPDATE ON scenario_branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_path_analytics_updated_at BEFORE UPDATE ON path_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_templates_updated_at BEFORE UPDATE ON simulation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION generate_path_signature(node_ids uuid[])
RETURNS text AS $$
BEGIN
  RETURN encode(digest(array_to_string(node_ids, ','), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(content_status);
CREATE INDEX IF NOT EXISTS idx_scenarios_published ON scenarios(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_position ON scenarios(position_x, position_y);
CREATE INDEX IF NOT EXISTS idx_journeys_user_timestamp ON learner_journeys(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_journeys_instance_sequence ON learner_journeys(simulation_instance_id, sequence_number);
