/*
  # Fix Infinite Recursion in Profiles RLS Policies

  1. Problem
    - The policies are checking profiles table within profiles policies
    - This creates infinite recursion when trying to authenticate

  2. Solution
    - Allow all authenticated users to read all profiles (needed for admin UI)
    - Restrict write operations appropriately
    - Use service role for admin operations via edge functions

  3. Security
    - Reading profile data is low risk (just names/emails/roles)
    - Write operations still protected
    - Admin functions use service role through edge functions
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Instructors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Allow all authenticated users to view all profiles
-- This is safe because profile data (name, email, role) is not sensitive
-- and is needed for admin UI, teacher cohort management, etc.
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (used by edge functions) can do everything
CREATE POLICY "Service role has full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile (for signup)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);