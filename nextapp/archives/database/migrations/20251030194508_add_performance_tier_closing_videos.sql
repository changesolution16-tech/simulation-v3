/*
  # Add Performance-Tier Closing Videos to Simulations

  ## Overview
  This migration enhances the closing page functionality to support multiple videos
  based on learner performance metrics. Instead of a single closing video, simulations
  can now have three tier-specific videos that are shown based on the learner's
  total metric score percentage.

  ## Changes

  1. New Closing Video Tier Fields
    - Add `closing_video_excellent_url` - Video URL for top performers (≥85% by default)
    - Add `closing_video_excellent_type` - Video platform type for excellent tier
    - Add `closing_video_excellent_file_id` - File reference for excellent tier
    - Add `closing_video_excellent_source` - Source type for excellent tier

    - Add `closing_video_good_url` - Video URL for good performers (70-84% by default)
    - Add `closing_video_good_type` - Video platform type for good tier
    - Add `closing_video_good_file_id` - File reference for good tier
    - Add `closing_video_good_source` - Source type for good tier

    - Add `closing_video_developing_url` - Video URL for developing performers (<70%)
    - Add `closing_video_developing_type` - Video platform type for developing tier
    - Add `closing_video_developing_file_id` - File reference for developing tier
    - Add `closing_video_developing_source` - Source type for developing tier

  2. Performance Threshold Configuration
    - Add `closing_excellent_threshold` - Percentage threshold for excellent tier (default: 85)
    - Add `closing_good_threshold` - Percentage threshold for good tier (default: 70)

  3. Display Configuration
    - Add `closing_page_show_before_results` - Whether to show closing as separate page (default: true)

  ## Data Migration
  - Existing `closing_video_url` values are copied to all three tier fields for backward compatibility
  - Existing simulations will show the same video to all learners until updated
  - Old closing_video_url field is kept for backward compatibility (marked as deprecated)

  ## Security
  - No RLS changes needed - existing policies apply to all new columns
*/

-- Add performance tier video fields for excellent performance
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS closing_video_excellent_url text,
ADD COLUMN IF NOT EXISTS closing_video_excellent_type text
  CHECK (closing_video_excellent_type IN ('youtube', 'synthesia', 'vimeo', 'file', 'embed'))
  DEFAULT 'synthesia',
ADD COLUMN IF NOT EXISTS closing_video_excellent_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS closing_video_excellent_source text
  CHECK (closing_video_excellent_source IN ('url', 'embed', 'upload', 'library'));

-- Add performance tier video fields for good performance
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS closing_video_good_url text,
ADD COLUMN IF NOT EXISTS closing_video_good_type text
  CHECK (closing_video_good_type IN ('youtube', 'synthesia', 'vimeo', 'file', 'embed'))
  DEFAULT 'synthesia',
ADD COLUMN IF NOT EXISTS closing_video_good_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS closing_video_good_source text
  CHECK (closing_video_good_source IN ('url', 'embed', 'upload', 'library'));

-- Add performance tier video fields for developing performance
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS closing_video_developing_url text,
ADD COLUMN IF NOT EXISTS closing_video_developing_type text
  CHECK (closing_video_developing_type IN ('youtube', 'synthesia', 'vimeo', 'file', 'embed'))
  DEFAULT 'synthesia',
ADD COLUMN IF NOT EXISTS closing_video_developing_file_id uuid REFERENCES video_files(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS closing_video_developing_source text
  CHECK (closing_video_developing_source IN ('url', 'embed', 'upload', 'library'));

-- Add threshold configuration fields
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS closing_excellent_threshold integer DEFAULT 85
  CHECK (closing_excellent_threshold >= 0 AND closing_excellent_threshold <= 100),
ADD COLUMN IF NOT EXISTS closing_good_threshold integer DEFAULT 70
  CHECK (closing_good_threshold >= 0 AND closing_good_threshold <= 100);

-- Add display configuration
ALTER TABLE simulations
ADD COLUMN IF NOT EXISTS closing_page_show_before_results boolean DEFAULT true;

-- Add column comments for documentation
COMMENT ON COLUMN simulations.closing_video_excellent_url IS 'Closing video URL for learners who achieve excellent performance (default: ≥85% total metrics)';
COMMENT ON COLUMN simulations.closing_video_good_url IS 'Closing video URL for learners who achieve good performance (default: 70-84% total metrics)';
COMMENT ON COLUMN simulations.closing_video_developing_url IS 'Closing video URL for learners who need development (<70% total metrics)';
COMMENT ON COLUMN simulations.closing_excellent_threshold IS 'Percentage threshold for excellent performance tier (0-100)';
COMMENT ON COLUMN simulations.closing_good_threshold IS 'Percentage threshold for good performance tier (0-100)';
COMMENT ON COLUMN simulations.closing_page_show_before_results IS 'Whether to show closing page as separate page before results (true) or inline on results page (false)';
COMMENT ON COLUMN simulations.closing_video_url IS 'DEPRECATED: Single closing video URL. Use tier-specific fields instead. Kept for backward compatibility.';

-- Migrate existing closing_video_url to all three tiers for backward compatibility
UPDATE simulations
SET
  closing_video_excellent_url = closing_video_url,
  closing_video_good_url = closing_video_url,
  closing_video_developing_url = closing_video_url,
  closing_video_excellent_type = closing_video_type,
  closing_video_good_type = closing_video_type,
  closing_video_developing_type = closing_video_type
WHERE closing_video_url IS NOT NULL AND closing_video_url != '';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulations_closing_enabled
  ON simulations(closing_page_enabled)
  WHERE closing_page_enabled = true;