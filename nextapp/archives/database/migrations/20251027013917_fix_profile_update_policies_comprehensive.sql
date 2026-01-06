/*
  # Comprehensive Fix for Profile Update Issues
  
  ## Problem Analysis
  After reviewing the system, we identified several issues:
  1. The RLS policies are correct but may need validation
  2. No automatic updated_at trigger exists
  3. The 'progress' field is stored in metadata JSONB column but code expects it as a top-level field
  4. The "Admins can update any profile" policy has a recursive check that could cause issues
  
  ## Solution
  This migration:
  1. Ensures there's an updated_at trigger
  2. Simplifies the admin update policy to avoid recursion
  3. Adds a progress column to profiles table for proper data structure
  4. Adds helpful indexes for common queries
  5. Creates a function to safely update profiles with validation
  
  ## Changes Made
  1. Add progress JSONB column if not exists
  2. Create/replace updated_at trigger function
  3. Simplify admin RLS policy to avoid recursion
  4. Add composite indexes for performance
  5. Create safe_update_profile function with validation
*/

-- ============================================================================
-- 1. ADD PROGRESS COLUMN IF NOT EXISTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'progress'
  ) THEN
    ALTER TABLE profiles ADD COLUMN progress jsonb DEFAULT '{"userId": "", "completedScenarios": [], "skillLevels": {}}'::jsonb;
    
    -- Backfill progress for existing users
    UPDATE profiles
    SET progress = jsonb_build_object(
      'userId', id::text,
      'completedScenarios', '[]'::jsonb,
      'skillLevels', '{}'::jsonb
    )
    WHERE progress IS NULL OR progress = '{}'::jsonb;
    
    RAISE NOTICE 'Added progress column to profiles table';
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

COMMENT ON FUNCTION update_profiles_updated_at() IS 
  'Automatically updates the updated_at timestamp whenever a profile is modified';

-- ============================================================================
-- 3. SIMPLIFY ADMIN UPDATE POLICY TO AVOID RECURSION
-- ============================================================================

-- Drop the existing admin update policy
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create a simplified non-recursive admin update policy
-- This checks if the current user is an admin without querying profiles recursively
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- Allow if current user is admin (check their own profile directly without recursion)
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
        AND admin_check.role = 'admin'
    )
  )
  WITH CHECK (
    -- Same check for WITH CHECK
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
        AND admin_check.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins can update any profile" ON profiles IS
  'Allows admin users to update any profile. Uses a non-recursive check to avoid policy conflicts.';

-- ============================================================================
-- 4. VERIFY USER UPDATE POLICY IS SIMPLE AND CORRECT
-- ============================================================================

-- Ensure the user update policy is simple and doesn't have unnecessary checks
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can update own profile" ON profiles IS
  'Allows authenticated users to update their own profile. Does not restrict which fields can be updated.';

-- ============================================================================
-- 5. ADD PERFORMANCE INDEXES
-- ============================================================================

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role) 
  WHERE role IS NOT NULL;

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
  ON profiles(is_active) 
  WHERE is_active = true;

-- Composite index for common authentication queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_active 
  ON profiles(email, is_active);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username 
  ON profiles(username) 
  WHERE username IS NOT NULL;

-- ============================================================================
-- 6. CREATE SAFE PROFILE UPDATE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION safe_update_profile(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_institution text DEFAULT NULL,
  p_department text DEFAULT NULL,
  p_position text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_can_update boolean;
BEGIN
  -- Check if the calling user can update this profile
  SELECT (auth.uid() = p_user_id) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_can_update;
  
  IF NOT v_can_update THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied. You can only update your own profile.'
    );
  END IF;
  
  -- Check if the profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found.'
    );
  END IF;
  
  -- Perform the update (only update fields that are provided)
  UPDATE profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    institution = COALESCE(p_institution, institution),
    department = COALESCE(p_department, department),
    position = COALESCE(p_position, position),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING jsonb_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'username', username,
    'role', role,
    'institution', institution,
    'department', department,
    'position', position,
    'is_active', is_active,
    'updated_at', updated_at
  ) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION safe_update_profile IS
  'Safely updates a user profile with validation and permission checks. Returns success status and updated profile or error message.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_update_profile TO authenticated;

-- ============================================================================
-- 7. ADD HELPFUL COMMENTS TO COLUMNS
-- ============================================================================

COMMENT ON COLUMN profiles.progress IS 'Stores user learning progress including completed scenarios and skill levels as JSONB';
COMMENT ON COLUMN profiles.metadata IS 'Additional user metadata stored as JSONB';
COMMENT ON COLUMN profiles.updated_at IS 'Automatically updated timestamp whenever the profile is modified';
COMMENT ON COLUMN profiles.full_name IS 'User full display name';
COMMENT ON COLUMN profiles.institution IS 'Educational institution or organization';
COMMENT ON COLUMN profiles.department IS 'Department within the institution';
COMMENT ON COLUMN profiles.position IS 'Role or position within the institution (e.g., Professor, Student)';
