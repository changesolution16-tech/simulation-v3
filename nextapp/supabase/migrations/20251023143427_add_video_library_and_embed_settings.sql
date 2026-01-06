/*
  # Add Video Library and Embed Settings Support

  1. Overview
    This migration adds comprehensive video embedding functionality including:
    - Video library for reusable video URL storage
    - Video collections for organizing related videos
    - Enhanced embed settings and parameters
    - Video access logging for monitoring broken links
    - Multi-platform support tracking

  2. New Tables
    - `video_library` - Stores reusable video URLs with metadata
    - `video_collections` - Groups related videos together
    - `video_collection_items` - Junction table for collection membership
    - `video_access_logs` - Tracks video accessibility and errors

  3. Schema Enhancements
    - Add `video_platform` column to scenarios table
    - Add `embed_parameters` jsonb column for custom settings
    - Add embed settings to scenario_options table

  4. Security
    - Enable RLS on all new tables
    - Instructors and admins can manage video library
    - All authenticated users can view public videos
    - Comprehensive access logging

  5. Performance
    - Add indexes for video URL lookups
    - Add indexes for platform filtering
    - Add indexes for collection queries
*/

-- ============================================================================
-- VIDEO LIBRARY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  video_platform text CHECK (video_platform IN ('synthesia', 'youtube', 'vimeo', 'loom', 'custom')),
  thumbnail_url text,
  duration_seconds integer,
  
  -- Categorization
  tags text[] DEFAULT ARRAY[]::text[],
  topic_ids uuid[],
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all')),
  video_type text CHECK (video_type IN ('introduction', 'prompt', 'feedback', 'transition', 'supplementary')),
  
  -- Embed settings
  embed_parameters jsonb DEFAULT '{
    "autoplay": false,
    "controls": true,
    "muted": false,
    "loop": false
  }'::jsonb,
  
  -- Usage tracking
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Access control
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_public boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  -- Monitoring
  last_validated_at timestamptz,
  is_accessible boolean DEFAULT true,
  last_error text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- VIDEO COLLECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  
  -- Categorization
  collection_type text DEFAULT 'general' CHECK (collection_type IN ('general', 'course', 'topic', 'difficulty_level')),
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  
  -- Access control
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_public boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- VIDEO COLLECTION ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES video_collections(id) ON DELETE CASCADE,
  video_id uuid REFERENCES video_library(id) ON DELETE CASCADE,
  
  display_order integer DEFAULT 0,
  notes text,
  
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  UNIQUE(collection_id, video_id)
);

-- ============================================================================
-- VIDEO ACCESS LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  video_source text CHECK (video_source IN ('library', 'scenario', 'option')),
  source_id uuid,
  
  -- Access attempt details
  access_status text NOT NULL CHECK (access_status IN ('success', 'failed', 'timeout', 'not_found', 'forbidden')),
  http_status_code integer,
  error_message text,
  response_time_ms integer,
  
  -- Context
  checked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  checked_at timestamptz DEFAULT now(),
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ENHANCE SCENARIOS TABLE WITH VIDEO PLATFORM AND EMBED SETTINGS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'video_platform'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN video_platform text CHECK (video_platform IN ('synthesia', 'youtube', 'vimeo', 'loom', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'embed_parameters'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN embed_parameters jsonb DEFAULT '{
      "autoplay": false,
      "controls": true,
      "muted": false,
      "loop": false
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenarios' AND column_name = 'video_library_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN video_library_id uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ENHANCE SCENARIO_OPTIONS TABLE WITH EMBED SETTINGS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'embed_parameters'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN embed_parameters jsonb DEFAULT '{
      "autoplay": false,
      "controls": true,
      "muted": false,
      "loop": false
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_options' AND column_name = 'video_library_id'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN video_library_id uuid REFERENCES video_library(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_video_library_created_by ON video_library(created_by);
CREATE INDEX IF NOT EXISTS idx_video_library_platform ON video_library(video_platform);
CREATE INDEX IF NOT EXISTS idx_video_library_tags ON video_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_video_library_topic_ids ON video_library USING gin(topic_ids);
CREATE INDEX IF NOT EXISTS idx_video_library_is_public ON video_library(is_public);
CREATE INDEX IF NOT EXISTS idx_video_library_usage_count ON video_library(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_video_collections_created_by ON video_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_video_collections_topic ON video_collections(topic_id);
CREATE INDEX IF NOT EXISTS idx_video_collection_items_collection ON video_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_video_collection_items_video ON video_collection_items(video_id);

CREATE INDEX IF NOT EXISTS idx_video_access_logs_url ON video_access_logs(video_url);
CREATE INDEX IF NOT EXISTS idx_video_access_logs_status ON video_access_logs(access_status);
CREATE INDEX IF NOT EXISTS idx_video_access_logs_checked_at ON video_access_logs(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_scenarios_video_library ON scenarios(video_library_id);
CREATE INDEX IF NOT EXISTS idx_scenario_options_video_library ON scenario_options(video_library_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_access_logs ENABLE ROW LEVEL SECURITY;

-- Video Library Policies
CREATE POLICY "Instructors can manage video library"
  ON video_library FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Users can view public videos"
  ON video_library FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

-- Video Collections Policies
CREATE POLICY "Instructors can manage video collections"
  ON video_collections FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Users can view public collections"
  ON video_collections FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

-- Video Collection Items Policies
CREATE POLICY "Users can view collection items"
  ON video_collection_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_collections
      WHERE video_collections.id = video_collection_items.collection_id
      AND (video_collections.is_public = true OR video_collections.created_by = auth.uid())
    )
  );

CREATE POLICY "Instructors can manage collection items"
  ON video_collection_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_collections
      WHERE video_collections.id = video_collection_items.collection_id
      AND video_collections.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Video Access Logs Policies
CREATE POLICY "Instructors can view access logs"
  ON video_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "System can create access logs"
  ON video_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_video_library_updated_at
  BEFORE UPDATE ON video_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_collections_updated_at
  BEFORE UPDATE ON video_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to increment video usage count
CREATE OR REPLACE FUNCTION increment_video_usage(video_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_library
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = video_id_param;
END;
$$;

-- Function to detect video platform from URL
CREATE OR REPLACE FUNCTION detect_video_platform(video_url_param text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF video_url_param ILIKE '%synthesia.io%' THEN
    RETURN 'synthesia';
  ELSIF video_url_param ILIKE '%youtube.com%' OR video_url_param ILIKE '%youtu.be%' THEN
    RETURN 'youtube';
  ELSIF video_url_param ILIKE '%vimeo.com%' THEN
    RETURN 'vimeo';
  ELSIF video_url_param ILIKE '%loom.com%' THEN
    RETURN 'loom';
  ELSE
    RETURN 'custom';
  END IF;
END;
$$;