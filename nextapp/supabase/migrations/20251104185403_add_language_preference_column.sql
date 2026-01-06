/*
  # Add Language Preference to Profiles

  1. Changes
    - Add `preferred_language` column to profiles table
    - Set default value to 'en' (English)
    - Add check constraint for valid language codes
    - Update existing profiles to have default language

  2. Security
    - Users can update their own language preference
    - No changes to RLS policies needed (existing policies handle this)
*/

-- Add preferred_language column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es'));

    -- Update existing profiles to have default language
    UPDATE profiles SET preferred_language = 'en' WHERE preferred_language IS NULL;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language: en (English) or es (Spanish - Dominican Republic)';