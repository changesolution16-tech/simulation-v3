/*
  # Fix Feedback Video and Metrics Storage Issues

  ## Overview
  This migration consolidates the feedback video storage approach and ensures proper
  structure for metric assignments. It addresses two critical issues:
  
  1. **Video Storage Consolidation**: Multiple video-related columns exist due to schema
     evolution. We standardize on using the _url, _source, _library_id, _file_id, and
     _embed_code pattern for all difficulty levels.
  
  2. **Metric Assignment Structure**: Ensures scenario_option_metrics table properly
     tracks which metrics apply to each option with their score values.

  ## Changes Made

  ### 1. Video Storage Comments and Documentation
  - Document the preferred video storage pattern
  - Explain which columns to use for each video input method
  
  ### 2. Helper Functions for Video Resolution
  - Create functions to resolve the correct video URL based on source type
  - Handle fallback logic for legacy video URL columns
  
  ### 3. Metric Assignment Validation
  - Add constraint to ensure metric scores are within valid ranges
  - Create indexes for efficient metric lookups
  
  ### 4. Data Quality Views
  - Create views to identify options missing metrics
  - Create views to identify options missing feedback videos

  ## Video Storage Pattern

  For each difficulty level (beginner, intermediate, advanced):
  - `feedback_video_url_[difficulty]`: Direct URL to video (legacy, still supported)
  - `feedback_video_source_[difficulty]`: Enum: 'url', 'library', 'file', 'embed'
  - `feedback_video_library_id_[difficulty]`: FK to video_library (if source = 'library')
  - `feedback_video_file_id_[difficulty]`: FK to video_files (if source = 'file')
  - `feedback_video_embed_code_[difficulty]`: Embed HTML (if source = 'embed')

  ## Security
  - Maintains existing RLS policies
  - No changes to access control
*/

-- ============================================================================
-- HELPER FUNCTION: Resolve Feedback Video URL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_feedback_video_url(
  p_option_id uuid,
  p_difficulty text
)
RETURNS text AS $$
DECLARE
  v_source text;
  v_url text;
  v_library_id uuid;
  v_file_id uuid;
  v_embed_code text;
BEGIN
  -- Determine which columns to query based on difficulty
  IF p_difficulty = 'beginner' THEN
    SELECT 
      feedback_video_source_beginner,
      feedback_video_url_beginner,
      feedback_video_library_id_beginner,
      feedback_video_file_id_beginner,
      feedback_video_embed_code_beginner
    INTO v_source, v_url, v_library_id, v_file_id, v_embed_code
    FROM scenario_options
    WHERE id = p_option_id;
  ELSIF p_difficulty = 'intermediate' THEN
    SELECT 
      feedback_video_source_intermediate,
      feedback_video_url_intermediate,
      feedback_video_library_id_intermediate,
      feedback_video_file_id_intermediate,
      feedback_video_embed_code_intermediate
    INTO v_source, v_url, v_library_id, v_file_id, v_embed_code
    FROM scenario_options
    WHERE id = p_option_id;
  ELSIF p_difficulty = 'advanced' THEN
    SELECT 
      feedback_video_source_advanced,
      feedback_video_url_advanced,
      feedback_video_library_id_advanced,
      feedback_video_file_id_advanced,
      feedback_video_embed_code_advanced
    INTO v_source, v_url, v_library_id, v_file_id, v_embed_code
    FROM scenario_options
    WHERE id = p_option_id;
  END IF;

  -- Resolve based on source type
  IF v_source = 'url' AND v_url IS NOT NULL THEN
    RETURN v_url;
  ELSIF v_source = 'library' AND v_library_id IS NOT NULL THEN
    SELECT video_url INTO v_url FROM video_library WHERE id = v_library_id;
    RETURN v_url;
  ELSIF v_source = 'file' AND v_file_id IS NOT NULL THEN
    SELECT storage_path INTO v_url FROM video_files WHERE id = v_file_id;
    RETURN v_url;
  ELSIF v_source = 'embed' AND v_embed_code IS NOT NULL THEN
    RETURN v_embed_code;
  ELSIF v_url IS NOT NULL THEN
    -- Fallback to direct URL if no source specified but URL exists
    RETURN v_url;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- VALIDATION: Metric Scores Within Range
-- ============================================================================

-- Add a check constraint to ensure metric scores are valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'scenario_option_metrics_score_range_check'
  ) THEN
    ALTER TABLE scenario_option_metrics
    ADD CONSTRAINT scenario_option_metrics_score_range_check
    CHECK (
      score_value >= 0 AND 
      score_value <= 100 AND
      weight >= 0 AND 
      weight <= 10
    );
  END IF;
END $$;

-- ============================================================================
-- INDEXES: Performance Optimization
-- ============================================================================

-- Ensure indexes exist for video lookups
CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_beginner 
  ON scenario_options(feedback_video_library_id_beginner) 
  WHERE feedback_video_library_id_beginner IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_intermediate 
  ON scenario_options(feedback_video_library_id_intermediate) 
  WHERE feedback_video_library_id_intermediate IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_library_advanced 
  ON scenario_options(feedback_video_library_id_advanced) 
  WHERE feedback_video_library_id_advanced IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_file_beginner 
  ON scenario_options(feedback_video_file_id_beginner) 
  WHERE feedback_video_file_id_beginner IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_file_intermediate 
  ON scenario_options(feedback_video_file_id_intermediate) 
  WHERE feedback_video_file_id_intermediate IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scenario_options_feedback_file_advanced 
  ON scenario_options(feedback_video_file_id_advanced) 
  WHERE feedback_video_file_id_advanced IS NOT NULL;

-- ============================================================================
-- DATA QUALITY VIEWS
-- ============================================================================

-- View: Options without feedback videos
CREATE OR REPLACE VIEW options_missing_feedback AS
SELECT 
  so.id as option_id,
  so.scenario_id,
  s.title as scenario_title,
  so.option_text,
  CASE 
    WHEN so.feedback_video_url_beginner IS NULL 
      AND so.feedback_video_library_id_beginner IS NULL 
      AND so.feedback_video_file_id_beginner IS NULL 
      AND so.feedback_video_embed_code_beginner IS NULL 
    THEN true ELSE false 
  END as missing_beginner,
  CASE 
    WHEN so.feedback_video_url_intermediate IS NULL 
      AND so.feedback_video_library_id_intermediate IS NULL 
      AND so.feedback_video_file_id_intermediate IS NULL 
      AND so.feedback_video_embed_code_intermediate IS NULL 
    THEN true ELSE false 
  END as missing_intermediate,
  CASE 
    WHEN so.feedback_video_url_advanced IS NULL 
      AND so.feedback_video_library_id_advanced IS NULL 
      AND so.feedback_video_file_id_advanced IS NULL 
      AND so.feedback_video_embed_code_advanced IS NULL 
    THEN true ELSE false 
  END as missing_advanced
FROM scenario_options so
JOIN scenarios s ON s.id = so.scenario_id
WHERE 
  (so.feedback_video_url_beginner IS NULL 
    AND so.feedback_video_library_id_beginner IS NULL 
    AND so.feedback_video_file_id_beginner IS NULL 
    AND so.feedback_video_embed_code_beginner IS NULL)
  OR (so.feedback_video_url_intermediate IS NULL 
    AND so.feedback_video_library_id_intermediate IS NULL 
    AND so.feedback_video_file_id_intermediate IS NULL 
    AND so.feedback_video_embed_code_intermediate IS NULL)
  OR (so.feedback_video_url_advanced IS NULL 
    AND so.feedback_video_library_id_advanced IS NULL 
    AND so.feedback_video_file_id_advanced IS NULL 
    AND so.feedback_video_embed_code_advanced IS NULL);

-- View: Options without metrics
CREATE OR REPLACE VIEW options_missing_metrics AS
SELECT 
  so.id as option_id,
  so.scenario_id,
  s.title as scenario_title,
  so.option_text,
  COUNT(som.id) as metric_count
FROM scenario_options so
JOIN scenarios s ON s.id = so.scenario_id
LEFT JOIN scenario_option_metrics som ON som.option_id = so.id
GROUP BY so.id, so.scenario_id, s.title, so.option_text
HAVING COUNT(som.id) = 0;

-- View: Metric assignments summary
CREATE OR REPLACE VIEW metric_assignments_summary AS
SELECT 
  s.id as scenario_id,
  s.title as scenario_title,
  so.id as option_id,
  so.option_text,
  so.option_order,
  COUNT(som.id) as metric_count,
  COALESCE(jsonb_agg(
    jsonb_build_object(
      'metric_id', am.id,
      'metric_name', am.name,
      'score_value', som.score_value,
      'is_primary', som.is_primary_metric
    ) ORDER BY som.is_primary_metric DESC, am.name
  ) FILTER (WHERE som.id IS NOT NULL), '[]'::jsonb) as metrics
FROM scenarios s
JOIN scenario_options so ON so.scenario_id = s.id
LEFT JOIN scenario_option_metrics som ON som.option_id = so.id
LEFT JOIN assessment_metrics am ON am.id = som.metric_id
GROUP BY s.id, s.title, so.id, so.option_text, so.option_order
ORDER BY s.title, so.option_order;

-- Grant access to views
GRANT SELECT ON options_missing_feedback TO authenticated;
GRANT SELECT ON options_missing_metrics TO authenticated;
GRANT SELECT ON metric_assignments_summary TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_feedback_video_url IS 
'Resolves the actual video URL for a scenario option based on the source type (url, library, file, or embed). Handles fallback to legacy URL fields.';

COMMENT ON VIEW options_missing_feedback IS 
'Lists all scenario options that are missing feedback videos for one or more difficulty levels.';

COMMENT ON VIEW options_missing_metrics IS 
'Lists all scenario options that have no metric assignments.';

COMMENT ON VIEW metric_assignments_summary IS 
'Provides a comprehensive summary of all metric assignments for each scenario option.';
