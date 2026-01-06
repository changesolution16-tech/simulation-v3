/*
  # Add Landing Page Image Support to Simulations
  
  ## Overview
  Adds columns to store landing page images for simulations, allowing admins
  to upload custom images that appear on the simulation landing page.
  
  ## Changes
  1. Add `landing_image_url` column - stores the URL/path to the uploaded image
  2. Add `landing_image_alt` column - stores alt text for accessibility
  
  ## Security
  - No RLS changes needed - existing simulation policies apply
  - Images stored in public storage bucket with public URLs
*/

-- Add landing page image columns to simulations table
ALTER TABLE simulations 
ADD COLUMN IF NOT EXISTS landing_image_url text,
ADD COLUMN IF NOT EXISTS landing_image_alt text;

-- Add helpful comment
COMMENT ON COLUMN simulations.landing_image_url IS 'URL to the landing page hero image';
COMMENT ON COLUMN simulations.landing_image_alt IS 'Alt text for the landing page image (accessibility)';