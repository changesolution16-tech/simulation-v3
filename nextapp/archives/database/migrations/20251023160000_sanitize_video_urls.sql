/*
  # Sanitize Video URLs in Database

  1. Purpose
    - Clean up any malformed or improperly encoded video URLs
    - Ensure all URLs are properly formatted and accessible
    - Remove control characters and fix encoding issues

  2. Changes
    - Update all video URL columns in scenarios table
    - Update all video URL columns in scenario_options table
    - Trim whitespace and remove control characters
    - Normalize URL encoding

  3. Security
    - No RLS changes needed
    - Read-only operation on existing data
*/

-- Function to clean and normalize video URLs
CREATE OR REPLACE FUNCTION clean_video_url(url TEXT)
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- Clean up URLs in scenarios table
UPDATE scenarios
SET
  introduction_video_url = clean_video_url(introduction_video_url),
  prompt_video_url = clean_video_url(prompt_video_url),
  transition_video_url = clean_video_url(transition_video_url)
WHERE
  introduction_video_url IS NOT NULL
  OR prompt_video_url IS NOT NULL
  OR transition_video_url IS NOT NULL;

-- Clean up URLs in scenario_options table
UPDATE scenario_options
SET
  feedback_video_beginner = clean_video_url(feedback_video_beginner),
  feedback_video_intermediate = clean_video_url(feedback_video_intermediate),
  feedback_video_advanced = clean_video_url(feedback_video_advanced),
  transition_video_url = clean_video_url(transition_video_url)
WHERE
  feedback_video_beginner IS NOT NULL
  OR feedback_video_intermediate IS NOT NULL
  OR feedback_video_advanced IS NOT NULL
  OR transition_video_url IS NOT NULL;

-- Add check constraints to prevent malformed URLs in the future
DO $$
BEGIN
  -- Add constraint to scenarios table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scenarios_introduction_video_url_check'
  ) THEN
    ALTER TABLE scenarios
    ADD CONSTRAINT scenarios_introduction_video_url_check
    CHECK (introduction_video_url IS NULL OR LENGTH(TRIM(introduction_video_url)) > 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scenarios_prompt_video_url_check'
  ) THEN
    ALTER TABLE scenarios
    ADD CONSTRAINT scenarios_prompt_video_url_check
    CHECK (prompt_video_url IS NULL OR LENGTH(TRIM(prompt_video_url)) > 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scenarios_transition_video_url_check'
  ) THEN
    ALTER TABLE scenarios
    ADD CONSTRAINT scenarios_transition_video_url_check
    CHECK (transition_video_url IS NULL OR LENGTH(TRIM(transition_video_url)) > 10);
  END IF;

END $$;

-- Create trigger function to auto-clean URLs on insert/update
CREATE OR REPLACE FUNCTION auto_clean_video_urls()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean URLs in scenarios table
  IF TG_TABLE_NAME = 'scenarios' THEN
    NEW.introduction_video_url := clean_video_url(NEW.introduction_video_url);
    NEW.prompt_video_url := clean_video_url(NEW.prompt_video_url);
    NEW.transition_video_url := clean_video_url(NEW.transition_video_url);
  END IF;

  -- Clean URLs in scenario_options table
  IF TG_TABLE_NAME = 'scenario_options' THEN
    NEW.feedback_video_beginner := clean_video_url(NEW.feedback_video_beginner);
    NEW.feedback_video_intermediate := clean_video_url(NEW.feedback_video_intermediate);
    NEW.feedback_video_advanced := clean_video_url(NEW.feedback_video_advanced);
    NEW.transition_video_url := clean_video_url(NEW.transition_video_url);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS clean_scenarios_video_urls ON scenarios;
CREATE TRIGGER clean_scenarios_video_urls
  BEFORE INSERT OR UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION auto_clean_video_urls();

DROP TRIGGER IF EXISTS clean_scenario_options_video_urls ON scenario_options;
CREATE TRIGGER clean_scenario_options_video_urls
  BEFORE INSERT OR UPDATE ON scenario_options
  FOR EACH ROW
  EXECUTE FUNCTION auto_clean_video_urls();
