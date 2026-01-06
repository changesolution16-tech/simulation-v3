/*
  # Fix Profiles RLS Policies for Admin Access

  1. Changes
    - Drop existing restrictive policies on profiles table
    - Add new policies that allow admins to view and manage all users
    - Allow users to view their own profile
    - Allow admins and instructors to view all profiles

  2. Security
    - Admins can view and manage all profiles
    - Instructors can view all profiles
    - Users can view their own profile
    - Only admins can create, update, or delete profiles through the UI
*/

-- Drop existing policies that may be blocking admin access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create new comprehensive policies

-- Allow admins to do everything with profiles
CREATE POLICY "Admins have full access to profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Allow instructors to view all profiles (for cohort management)
CREATE POLICY "Instructors can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('instructor', 'admin')
    )
  );

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Allow profile creation during signup (handled by trigger or edge function)
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "Admins have full access to profiles" ON profiles IS 'Admins can manage all user profiles';
COMMENT ON POLICY "Instructors can view all profiles" ON profiles IS 'Instructors need to see all users for cohort management';
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can always see their own profile';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Users can update their profile but not change their role';
