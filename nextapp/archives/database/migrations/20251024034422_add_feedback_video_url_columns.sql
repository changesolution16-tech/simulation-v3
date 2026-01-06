/*
  # Add Feedback Video URL Columns

  ## Changes
  
  1. New Columns
     - `feedback_video_url_beginner` (text) - URL for beginner feedback video
     - `feedback_video_url_intermediate` (text) - URL for intermediate feedback video  
     - `feedback_video_url_advanced` (text) - URL for advanced feedback video
  
  ## Notes
  - These columns complement the existing `feedback_video_beginner`, `feedback_video_intermediate`, and `feedback_video_advanced` columns
  - Allows storing video URLs separately from embed codes or file references
*/

-- Add feedback video URL columns to scenario_options
ALTER TABLE scenario_options 
ADD COLUMN IF NOT EXISTS feedback_video_url_beginner text,
ADD COLUMN IF NOT EXISTS feedback_video_url_intermediate text,
ADD COLUMN IF NOT EXISTS feedback_video_url_advanced text;
