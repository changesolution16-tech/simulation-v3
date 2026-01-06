/*
  # Fix clean_video_url Function Search Path Issue

  ## Problem
  The clean_video_url function has `SET search_path TO ''` which prevents it from being
  callable within triggers. This causes "function clean_video_url(text) does not exist" errors.

  ## Solution
  Recreate the function with proper search_path settings to ensure it can be called from triggers.

  ## Changes
  1. Drop and recreate clean_video_url function with correct search_path
  2. Recreate the auto_clean_video_urls trigger function
  3. Keep the same logic and functionality
*/

-- Drop existing function and trigger function
DROP FUNCTION IF EXISTS clean_video_url(text) CASCADE;
DROP FUNCTION IF EXISTS auto_clean_video_urls() CASCADE;

-- Recreate clean_video_url function with proper search path
CREATE OR REPLACE FUNCTION public.clean_video_url(url TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return NULL if input is NULL or empty
  IF url IS NULL OR TRIM(url) = '' THEN
    RETURN NULL;
  END IF;

  -- Trim whitespace
  url := TRIM(url);

  -- Remove control characters (ASCII 0-31 and 127-159)
  url := REGEXP_REPLACE(url, '[\x00-\x1F\x7F-\x9F]', '', 'g');

  -- Replace multiple spaces with single space
  url := REGEXP_REPLACE(url, '\s+', ' ', 'g');

  -- Trim again after cleanup
  url := TRIM(url);

  -- Return NULL if empty after cleanup
  IF url = '' THEN
    RETURN NULL;
  END IF;

  RETURN url;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.clean_video_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_video_url(text) TO service_role;

-- Recreate trigger function with explicit schema qualification
CREATE OR REPLACE FUNCTION public.auto_clean_video_urls()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean URLs in scenarios table
  IF TG_TABLE_NAME = 'scenarios' THEN
    NEW.introduction_video_url := public.clean_video_url(NEW.introduction_video_url);
    NEW.prompt_video_url := public.clean_video_url(NEW.prompt_video_url);
    NEW.transition_video_url := public.clean_video_url(NEW.transition_video_url);
  END IF;

  -- Clean URLs in scenario_options table
  IF TG_TABLE_NAME = 'scenario_options' THEN
    NEW.feedback_video_beginner := public.clean_video_url(NEW.feedback_video_beginner);
    NEW.feedback_video_intermediate := public.clean_video_url(NEW.feedback_video_intermediate);
    NEW.feedback_video_advanced := public.clean_video_url(NEW.feedback_video_advanced);
    NEW.transition_video_url := public.clean_video_url(NEW.transition_video_url);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS clean_scenarios_video_urls ON scenarios;
CREATE TRIGGER clean_scenarios_video_urls
  BEFORE INSERT OR UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_clean_video_urls();

DROP TRIGGER IF EXISTS clean_scenario_options_video_urls ON scenario_options;
CREATE TRIGGER clean_scenario_options_video_urls
  BEFORE INSERT OR UPDATE ON scenario_options
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_clean_video_urls();

COMMENT ON FUNCTION public.clean_video_url(text) IS 
  'Cleans and normalizes video URLs by removing control characters and extra whitespace';

COMMENT ON FUNCTION public.auto_clean_video_urls() IS 
  'Trigger function to automatically clean video URLs on insert/update';
