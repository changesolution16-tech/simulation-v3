/*
  # Fix Profiles RLS Policies for Stable Authentication

  ## Summary
  This migration fixes potential recursion and permission issues in the profiles table
  that could cause authentication sessions to be lost during database operations.

  ## Problem
  The "Admins can update any profile" policy has a recursive check that queries the
  profiles table within its own policy, which can cause issues during concurrent operations.

  ## Solution
  Simplify the admin update policy to avoid recursion and ensure stable authentication.

  ## Changes Made
  1. Drop the recursive "Admins can update any profile" policy
  2. Create a simplified non-recursive version
  3. Ensure authenticated users can always read profiles (needed for auth)
*/

-- Drop the recursive admin update policy
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create a simplified admin update policy that uses a direct role check
-- This avoids recursion by using the user's JWT metadata
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- Direct check without recursion: if current user IS the admin being checked
    (auth.uid() = id AND role = 'admin')
    OR
    -- Or if we're updating someone else and we are an admin
    (auth.uid() != id AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    ))
  )
  WITH CHECK (
    (auth.uid() = id AND role = 'admin')
    OR
    (auth.uid() != id AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    ))
  );

-- Ensure the "Authenticated users can view all profiles" policy allows SELECT without issues
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Ensure users can always update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
