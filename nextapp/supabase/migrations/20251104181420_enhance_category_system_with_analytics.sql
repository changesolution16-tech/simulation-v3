/*
  # Enhance Category System with Analytics and Optimization

  ## Summary
  This migration enhances the simulation category system with analytics tracking,
  performance optimizations, and advanced features to improve category management
  and learner experience.

  ## 1. New Tables
  
  ### `category_statistics`
  Tracks usage statistics and analytics for each category
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key to simulation_categories)
  - `total_views` (integer) - Number of times category was viewed
  - `unique_learners` (integer) - Number of unique learners who viewed
  - `total_simulations_started` (integer) - Simulations started from this category
  - `total_simulations_completed` (integer) - Simulations completed from this category
  - `average_completion_rate` (numeric) - Average completion rate percentage
  - `average_satisfaction_score` (numeric) - Average learner satisfaction
  - `last_updated` (timestamptz) - When statistics were last updated

  ### `category_learner_progress`
  Tracks individual learner progress within categories
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key to simulation_categories)
  - `learner_id` (uuid, foreign key to profiles)
  - `simulations_started` (integer) - Number started in this category
  - `simulations_completed` (integer) - Number completed in this category
  - `total_time_spent_minutes` (integer) - Total time spent in category
  - `last_accessed` (timestamptz) - Last time learner accessed this category
  - `is_favorite` (boolean) - Whether learner favorited this category

  ## 2. Database Functions
  
  - `update_category_statistics()` - Updates aggregated category statistics
  - `get_category_analytics()` - Retrieves comprehensive category analytics
  - `get_learner_category_progress()` - Gets learner progress across all categories

  ## 3. Performance Optimizations
  
  - Add composite indexes for common query patterns
  - Add indexes for category statistics queries
  - Add indexes for learner progress tracking

  ## 4. Security
  
  - Enable RLS on new tables
  - Admins can read all category statistics
  - Learners can only see their own progress
  - Public can view aggregated category statistics (view counts, etc.)
*/

-- ============================================================
-- CATEGORY STATISTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS category_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES simulation_categories(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  unique_learners integer DEFAULT 0,
  total_simulations_started integer DEFAULT 0,
  total_simulations_completed integer DEFAULT 0,
  average_completion_rate numeric(5,2) DEFAULT 0,
  average_satisfaction_score numeric(3,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id)
);

-- ============================================================
-- CATEGORY LEARNER PROGRESS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS category_learner_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES simulation_categories(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  simulations_started integer DEFAULT 0,
  simulations_completed integer DEFAULT 0,
  total_time_spent_minutes integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now(),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, learner_id)
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Indexes for simulation_categories
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON simulation_categories(is_active, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_created ON simulation_categories(created_at DESC);

-- Indexes for simulations category relationships
CREATE INDEX IF NOT EXISTS idx_simulations_category_status ON simulations(category_id, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_simulations_category_created ON simulations(category_id, created_at DESC);

-- Indexes for category statistics
CREATE INDEX IF NOT EXISTS idx_category_stats_category ON category_statistics(category_id);
CREATE INDEX IF NOT EXISTS idx_category_stats_updated ON category_statistics(last_updated DESC);

-- Indexes for learner progress
CREATE INDEX IF NOT EXISTS idx_category_progress_learner ON category_learner_progress(learner_id, last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_category_progress_category ON category_learner_progress(category_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_category_progress_favorites ON category_learner_progress(learner_id, is_favorite) WHERE is_favorite = true;

-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Function to update category statistics
CREATE OR REPLACE FUNCTION update_category_statistics(p_category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO category_statistics (
    category_id,
    total_simulations_started,
    total_simulations_completed,
    unique_learners,
    average_completion_rate,
    last_updated
  )
  SELECT
    p_category_id,
    COALESCE(SUM(simulations_started), 0),
    COALESCE(SUM(simulations_completed), 0),
    COUNT(DISTINCT learner_id),
    CASE 
      WHEN SUM(simulations_started) > 0 
      THEN (SUM(simulations_completed)::numeric / SUM(simulations_started)::numeric) * 100
      ELSE 0
    END,
    now()
  FROM category_learner_progress
  WHERE category_id = p_category_id
  ON CONFLICT (category_id)
  DO UPDATE SET
    total_simulations_started = EXCLUDED.total_simulations_started,
    total_simulations_completed = EXCLUDED.total_simulations_completed,
    unique_learners = EXCLUDED.unique_learners,
    average_completion_rate = EXCLUDED.average_completion_rate,
    last_updated = EXCLUDED.last_updated;
END;
$$;

-- Function to get comprehensive category analytics
CREATE OR REPLACE FUNCTION get_category_analytics(p_category_id uuid DEFAULT NULL)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  total_simulations integer,
  published_simulations integer,
  total_views integer,
  unique_learners integer,
  simulations_started integer,
  simulations_completed integer,
  completion_rate numeric,
  average_time_spent integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.name,
    COUNT(DISTINCT s.id)::integer AS total_simulations,
    COUNT(DISTINCT CASE WHEN s.status = 'published' THEN s.id END)::integer AS published_simulations,
    COALESCE(cs.total_views, 0),
    COALESCE(cs.unique_learners, 0),
    COALESCE(cs.total_simulations_started, 0),
    COALESCE(cs.total_simulations_completed, 0),
    COALESCE(cs.average_completion_rate, 0),
    COALESCE(AVG(clp.total_time_spent_minutes)::integer, 0)
  FROM simulation_categories sc
  LEFT JOIN simulations s ON s.category_id = sc.id
  LEFT JOIN category_statistics cs ON cs.category_id = sc.id
  LEFT JOIN category_learner_progress clp ON clp.category_id = sc.id
  WHERE (p_category_id IS NULL OR sc.id = p_category_id)
    AND sc.is_active = true
  GROUP BY sc.id, sc.name, cs.total_views, cs.unique_learners, 
           cs.total_simulations_started, cs.total_simulations_completed,
           cs.average_completion_rate
  ORDER BY sc.display_order;
END;
$$;

-- Function to get learner category progress
CREATE OR REPLACE FUNCTION get_learner_category_progress(p_learner_id uuid)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_icon text,
  category_color text,
  simulations_started integer,
  simulations_completed integer,
  total_available integer,
  completion_percentage numeric,
  total_time_spent_minutes integer,
  last_accessed timestamptz,
  is_favorite boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.name,
    sc.icon,
    sc.color,
    COALESCE(clp.simulations_started, 0),
    COALESCE(clp.simulations_completed, 0),
    COUNT(s.id)::integer AS total_available,
    CASE 
      WHEN COUNT(s.id) > 0 
      THEN (COALESCE(clp.simulations_completed, 0)::numeric / COUNT(s.id)::numeric) * 100
      ELSE 0
    END AS completion_percentage,
    COALESCE(clp.total_time_spent_minutes, 0),
    clp.last_accessed,
    COALESCE(clp.is_favorite, false)
  FROM simulation_categories sc
  LEFT JOIN simulations s ON s.category_id = sc.id AND s.status = 'published'
  LEFT JOIN category_learner_progress clp ON clp.category_id = sc.id AND clp.learner_id = p_learner_id
  WHERE sc.is_active = true
  GROUP BY sc.id, sc.name, sc.icon, sc.color, clp.simulations_started, 
           clp.simulations_completed, clp.total_time_spent_minutes, 
           clp.last_accessed, clp.is_favorite
  ORDER BY sc.display_order;
END;
$$;

-- Function to track category view
CREATE OR REPLACE FUNCTION track_category_view(p_category_id uuid, p_learner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update learner progress
  INSERT INTO category_learner_progress (
    category_id,
    learner_id,
    last_accessed
  )
  VALUES (
    p_category_id,
    p_learner_id,
    now()
  )
  ON CONFLICT (category_id, learner_id)
  DO UPDATE SET
    last_accessed = now(),
    updated_at = now();

  -- Update category statistics
  INSERT INTO category_statistics (
    category_id,
    total_views,
    last_updated
  )
  VALUES (
    p_category_id,
    1,
    now()
  )
  ON CONFLICT (category_id)
  DO UPDATE SET
    total_views = category_statistics.total_views + 1,
    last_updated = now();

  -- Update unique learners count
  PERFORM update_category_statistics(p_category_id);
END;
$$;

-- Function to toggle category favorite
CREATE OR REPLACE FUNCTION toggle_category_favorite(p_category_id uuid, p_learner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_favorite boolean;
BEGIN
  INSERT INTO category_learner_progress (
    category_id,
    learner_id,
    is_favorite
  )
  VALUES (
    p_category_id,
    p_learner_id,
    true
  )
  ON CONFLICT (category_id, learner_id)
  DO UPDATE SET
    is_favorite = NOT category_learner_progress.is_favorite,
    updated_at = now()
  RETURNING is_favorite INTO v_is_favorite;

  RETURN v_is_favorite;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE category_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_learner_progress ENABLE ROW LEVEL SECURITY;

-- Category statistics policies
CREATE POLICY "Admins can read all category statistics"
  ON category_statistics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view basic category statistics"
  ON category_statistics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update category statistics"
  ON category_statistics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Category learner progress policies
CREATE POLICY "Learners can read own category progress"
  ON category_learner_progress
  FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

CREATE POLICY "Learners can update own category progress"
  ON category_learner_progress
  FOR ALL
  TO authenticated
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Admins can read all category progress"
  ON category_learner_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can read cohort category progress"
  ON category_learner_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN cohort_members cm ON cm.cohort_id IN (
        SELECT cohort_id FROM cohorts WHERE created_by = p.id
      )
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND cm.learner_id = category_learner_progress.learner_id
    )
  );

-- ============================================================
-- INITIALIZE STATISTICS FOR EXISTING CATEGORIES
-- ============================================================

-- Create initial statistics records for all existing categories
INSERT INTO category_statistics (category_id)
SELECT id FROM simulation_categories
ON CONFLICT (category_id) DO NOTHING;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE category_statistics IS 'Aggregated statistics and analytics for simulation categories';
COMMENT ON TABLE category_learner_progress IS 'Individual learner progress and preferences within categories';
COMMENT ON FUNCTION update_category_statistics(uuid) IS 'Updates aggregated statistics for a specific category';
COMMENT ON FUNCTION get_category_analytics(uuid) IS 'Retrieves comprehensive analytics for categories';
COMMENT ON FUNCTION get_learner_category_progress(uuid) IS 'Gets detailed progress for a learner across all categories';
COMMENT ON FUNCTION track_category_view(uuid, uuid) IS 'Tracks when a learner views a category';
COMMENT ON FUNCTION toggle_category_favorite(uuid, uuid) IS 'Toggles favorite status for a category';
