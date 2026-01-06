/*
  # Add Additional User Profile Fields

  1. Changes
    - Add `institution` (text) - User's institution/organization
    - Add `department` (text) - User's department
    - Add `position` (text) - User's position/title
    - Add `mfa_enabled` (boolean) - Whether 2FA is enabled for the user
    
  2. Security
    - Users can update their own profile fields
    - Policies already in place handle access control
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'institution'
  ) THEN
    ALTER TABLE profiles ADD COLUMN institution text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE profiles ADD COLUMN department text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'position'
  ) THEN
    ALTER TABLE profiles ADD COLUMN position text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mfa_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mfa_enabled boolean DEFAULT false;
  END IF;
END $$;