/*
  # Fix Admin User Creation Policies

  ## Overview
  This migration updates RLS policies on the profiles table to allow administrators
  to create new user profiles directly without requiring auth.users entries first.

  ## Changes
  1. Add policy for admins to insert new profiles
  2. Modify profiles table to make auth.users reference optional for admin-created users
  3. Add policy for admins to update and delete profiles

  ## Security
  - Only authenticated users with admin role can create/modify profiles
  - Maintains existing read policies for all authenticated users
*/

-- Drop the foreign key constraint to auth.users to allow manual profile creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- Make id a regular uuid column instead of requiring auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'id' AND column_default LIKE '%gen_random_uuid%'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add INSERT policy for admins to create profiles
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add UPDATE policy for admins
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add DELETE policy for admins
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile (but not role)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
