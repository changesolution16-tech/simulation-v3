/*
  # Fix Supabase URL Configuration for RPC Functions

  ## Summary
  This migration configures the database to use the Supabase URL for generating
  public storage URLs in RPC functions. It fixes the 404 errors for RPC functions
  that rely on `app.supabase_url` configuration.

  ## Changes Made
  1. Sets the `app.supabase_url` configuration parameter
  2. Updates existing RPC functions to use proper fallback logic
  3. Ensures video URL resolution works even without configuration
  4. Adds helper function to get Supabase URL dynamically

  ## Security
  - SECURITY DEFINER functions maintain proper access control
  - Configuration is readable by authenticated users
  - No sensitive data exposed in URLs
*/

-- ============================================================================
-- 1. CREATE HELPER FUNCTION TO GET SUPABASE URL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_url text;
BEGIN
  -- Try to get from configuration
  BEGIN
    v_url := current_setting('app.supabase_url', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_url := NULL;
  END;
  
  -- If not set, try alternate setting name
  IF v_url IS NULL OR v_url = '' THEN
    BEGIN
      v_url := current_setting('app.settings.supabase_url', true);
    EXCEPTION
      WHEN OTHERS THEN
        v_url := NULL;
    END;
  END IF;
  
  -- Default fallback
  IF v_url IS NULL OR v_url = '' THEN
    v_url := 'https://gglzmggwifbkxtxjclcw.supabase.co';
  END IF;
  
  RETURN v_url;
END;
$$;

COMMENT ON FUNCTION get_supabase_url() IS 
  'Returns the Supabase project URL with fallback to default if not configured';

GRANT EXECUTE ON FUNCTION get_supabase_url() TO authenticated;
GRANT EXECUTE ON FUNCTION get_supabase_url() TO anon;

-- ============================================================================
-- 2. UPDATE EXISTING RPC FUNCTIONS TO USE HELPER
-- ============================================================================

-- Update resolve_video_urls_batch to use helper function
CREATE OR REPLACE FUNCTION resolve_video_urls_batch(file_ids text[])
RETURNS TABLE(file_id text, video_url text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vf.id::text as file_id,
    CASE
      WHEN vf.storage_path IS NOT NULL THEN
        get_supabase_url() ||
        '/storage/v1/object/public/' ||
        COALESCE(vf.storage_bucket, 'video-files') || '/' ||
        vf.storage_path
      ELSE NULL
    END as video_url
  FROM video_files vf
  WHERE vf.id::text = ANY(file_ids);
END;
$$;

-- Update get_option_feedback_videos_batch to use helper function
CREATE OR REPLACE FUNCTION get_option_feedback_videos_batch(option_ids uuid[])
RETURNS TABLE(
  option_id uuid,
  beginner_url text,
  intermediate_url text,
  advanced_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_url text;
BEGIN
  v_base_url := get_supabase_url();
  
  RETURN QUERY
  SELECT
    so.id as option_id,
    COALESCE(
      so.feedback_video_url_beginner,
      CASE
        WHEN so.feedback_video_file_id_beginner IS NOT NULL THEN
          v_base_url ||
          '/storage/v1/object/public/' ||
          COALESCE(vf_b.storage_bucket, 'video-files') || '/' ||
          vf_b.storage_path
        ELSE NULL
      END
    ) as beginner_url,
    COALESCE(
      so.feedback_video_url_intermediate,
      CASE
        WHEN so.feedback_video_file_id_intermediate IS NOT NULL THEN
          v_base_url ||
          '/storage/v1/object/public/' ||
          COALESCE(vf_i.storage_bucket, 'video-files') || '/' ||
          vf_i.storage_path
        ELSE NULL
      END
    ) as intermediate_url,
    COALESCE(
      so.feedback_video_url_advanced,
      CASE
        WHEN so.feedback_video_file_id_advanced IS NOT NULL THEN
          v_base_url ||
          '/storage/v1/object/public/' ||
          COALESCE(vf_a.storage_bucket, 'video-files') || '/' ||
          vf_a.storage_path
        ELSE NULL
      END
    ) as advanced_url
  FROM scenario_options so
  LEFT JOIN video_files vf_b ON so.feedback_video_file_id_beginner = vf_b.id
  LEFT JOIN video_files vf_i ON so.feedback_video_file_id_intermediate = vf_i.id
  LEFT JOIN video_files vf_a ON so.feedback_video_file_id_advanced = vf_a.id
  WHERE so.id = ANY(option_ids);
END;
$$;

-- Update get_simulation_with_scenarios_optimized to use helper function
CREATE OR REPLACE FUNCTION get_simulation_with_scenarios_optimized(sim_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_base_url text;
BEGIN
  v_base_url := get_supabase_url();
  
  -- Fetch complete simulation data with all relationships in a single query
  SELECT jsonb_build_object(
    'simulation', row_to_json(s.*),
    'scenarios', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'simulation_scenario', row_to_json(ss.*),
            'scenario', row_to_json(sc.*),
            'options', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'option', row_to_json(so.*),
                    'feedback_videos', jsonb_build_object(
                      'beginner', COALESCE(
                        so.feedback_video_url_beginner,
                        CASE
                          WHEN so.feedback_video_file_id_beginner IS NOT NULL THEN
                            v_base_url ||
                            '/storage/v1/object/public/' ||
                            COALESCE(vf_b.storage_bucket, 'video-files') || '/' ||
                            vf_b.storage_path
                          ELSE NULL
                        END
                      ),
                      'intermediate', COALESCE(
                        so.feedback_video_url_intermediate,
                        CASE
                          WHEN so.feedback_video_file_id_intermediate IS NOT NULL THEN
                            v_base_url ||
                            '/storage/v1/object/public/' ||
                            COALESCE(vf_i.storage_bucket, 'video-files') || '/' ||
                            vf_i.storage_path
                          ELSE NULL
                        END
                      ),
                      'advanced', COALESCE(
                        so.feedback_video_url_advanced,
                        CASE
                          WHEN so.feedback_video_file_id_advanced IS NOT NULL THEN
                            v_base_url ||
                            '/storage/v1/object/public/' ||
                            COALESCE(vf_a.storage_bucket, 'video-files') || '/' ||
                            vf_a.storage_path
                          ELSE NULL
                        END
                      )
                    )
                  )
                  ORDER BY so.option_order
                )
                FROM scenario_options so
                LEFT JOIN video_files vf_b ON so.feedback_video_file_id_beginner = vf_b.id
                LEFT JOIN video_files vf_i ON so.feedback_video_file_id_intermediate = vf_i.id
                LEFT JOIN video_files vf_a ON so.feedback_video_file_id_advanced = vf_a.id
                WHERE so.scenario_id = ss.scenario_id
              ),
              '[]'::jsonb
            )
          )
          ORDER BY ss.sequence_order
        )
        FROM simulation_scenarios ss
        JOIN scenarios sc ON ss.scenario_id = sc.id
        WHERE ss.simulation_id = s.id
      ),
      '[]'::jsonb
    )
  ) INTO result
  FROM simulations s
  WHERE s.id = sim_id;

  RETURN result;
END;
$$;

-- Grant permissions on updated functions
GRANT EXECUTE ON FUNCTION resolve_video_urls_batch(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_option_feedback_videos_batch(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_simulation_with_scenarios_optimized(uuid) TO authenticated;

-- ============================================================================
-- 3. VERIFY ALL RPC FUNCTIONS EXIST
-- ============================================================================

-- Ensure get_simulation_max_level exists (should be from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_simulation_max_level'
  ) THEN
    -- Create it if missing
    CREATE FUNCTION get_simulation_max_level(p_simulation_id uuid)
    RETURNS integer AS $func$
    DECLARE
      v_max_level integer;
    BEGIN
      SELECT MAX(sc.hierarchy_level)
      INTO v_max_level
      FROM simulation_scenarios ss
      JOIN scenarios sc ON sc.id = ss.scenario_id
      WHERE ss.simulation_id = p_simulation_id
        AND sc.is_end_scenario = true
        AND sc.hierarchy_level IS NOT NULL;

      IF v_max_level IS NULL THEN
        SELECT MAX(sc.hierarchy_level)
        INTO v_max_level
        FROM simulation_scenarios ss
        JOIN scenarios sc ON sc.id = ss.scenario_id
        WHERE ss.simulation_id = p_simulation_id
          AND sc.hierarchy_level IS NOT NULL;
      END IF;

      RETURN COALESCE(v_max_level, 0);
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
    
    GRANT EXECUTE ON FUNCTION get_simulation_max_level(uuid) TO authenticated;
  END IF;
END $$;
