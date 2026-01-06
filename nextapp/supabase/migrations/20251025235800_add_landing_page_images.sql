/*
  # Add Landing Page Image Support

  1. Changes to Existing Tables
    - Add image URL fields to `scenarios` table for each difficulty level
    - Images can be used for hero sections, illustrations, or context setting
    - Support for both external URLs and Supabase storage references

  2. Security
    - No RLS changes needed - images are part of scenario content
    - Same access control as other scenario fields
*/

-- Add landing page image URLs per difficulty level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_image_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_image_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_image_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_image_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_image_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_image_advanced text;
  END IF;

  -- Add image alt text for accessibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_image_alt_beginner'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_image_alt_beginner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_image_alt_intermediate'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_image_alt_intermediate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'landing_page_image_alt_advanced'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN landing_page_image_alt_advanced text;
  END IF;
END $$;