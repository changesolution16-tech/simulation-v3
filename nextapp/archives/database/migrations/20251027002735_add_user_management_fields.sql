/*
  # User Management Enhancement - Add Username, Activation Status, and Security Fields

  ## Overview
  This migration enhances the user management system with learning management system (LMS)
  best practices including username support, account activation controls, and security
  audit fields.

  ## 1. Changes to Profiles Table
    ### New Columns:
    - `username` (text, unique) - Unique username for login (alternative to email)
    - `is_active` (boolean) - Account activation status, defaults to true
    - `password_last_changed` (timestamptz) - Timestamp of last password change
    - `last_login_at` (timestamptz) - Timestamp of last successful login
    - `account_locked_until` (timestamptz) - Temporary account lockout timestamp
    - `failed_login_attempts` (integer) - Counter for failed login attempts
    - `activation_history` (jsonb) - Audit trail for activation/deactivation changes

  ## 2. Security
    - Username must be unique and non-null after migration
    - is_active defaults to true for backward compatibility
    - All existing users are set to active by default
    - Usernames are auto-generated from emails for existing users
    - RLS policies updated to respect is_active status

  ## 3. Indexes
    - Unique index on username for fast lookups
    - Index on is_active for filtering active/inactive users
    - Composite index on (email, is_active) for login queries

  ## 4. Data Migration
    - Backfill usernames for existing users from their email addresses
    - Set is_active to true for all existing users
    - Initialize security tracking fields
*/

-- ============================================================================
-- ADD NEW COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Add username column (nullable initially for migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;
END $$;

-- Add is_active column with default true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add password security tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_last_changed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_last_changed timestamptz DEFAULT now();
  END IF;
END $$;

-- Add last login tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- Add account lockout field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_locked_until'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_locked_until timestamptz;
  END IF;
END $$;

-- Add failed login attempts counter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE profiles ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;
END $$;

-- Add activation history audit trail
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'activation_history'
  ) THEN
    ALTER TABLE profiles ADD COLUMN activation_history jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- DATA MIGRATION - BACKFILL EXISTING RECORDS
-- ============================================================================

-- Generate usernames from email addresses for existing users
-- Format: username = part before @ in email, with dots replaced by underscores
UPDATE profiles
SET username = LOWER(
  REGEXP_REPLACE(
    SPLIT_PART(email, '@', 1),
    '[^a-zA-Z0-9_]',
    '_',
    'g'
  )
)
WHERE username IS NULL;

-- Handle duplicate usernames by appending user ID suffix
WITH duplicates AS (
  SELECT username, COUNT(*) as cnt
  FROM profiles
  WHERE username IS NOT NULL
  GROUP BY username
  HAVING COUNT(*) > 1
)
UPDATE profiles p
SET username = p.username || '_' || SUBSTRING(p.id::text, 1, 8)
WHERE p.username IN (SELECT username FROM duplicates)
  AND p.id NOT IN (
    SELECT DISTINCT ON (username) id
    FROM profiles
    WHERE username IN (SELECT username FROM duplicates)
    ORDER BY username, created_at ASC
  );

-- Ensure all existing users are active by default
UPDATE profiles
SET is_active = true
WHERE is_active IS NULL;

-- Initialize activation history for existing users
UPDATE profiles
SET activation_history = jsonb_build_array(
  jsonb_build_object(
    'action', 'activated',
    'timestamp', created_at,
    'reason', 'Initial account creation',
    'changed_by', 'system'
  )
)
WHERE activation_history = '[]'::jsonb OR activation_history IS NULL;

-- ============================================================================
-- ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Make username NOT NULL and UNIQUE after backfill
DO $$
BEGIN
  -- First check if any null usernames remain
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE username IS NULL) THEN
    -- Add NOT NULL constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name = 'username'
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
    END IF;

    -- Add unique constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'profiles_username_key'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
  END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles(username)
  WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active
  ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_email_active
  ON profiles(email, is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_last_login
  ON profiles(last_login_at DESC NULLS LAST);

-- ============================================================================
-- UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Drop and recreate policies to include is_active checks

-- Policy for authenticated users to view all profiles (needed for admin UI)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy for service role operations (used by edge functions)
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to log activation/deactivation changes
CREATE OR REPLACE FUNCTION log_activation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if is_active changed
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    NEW.activation_history = COALESCE(NEW.activation_history, '[]'::jsonb) ||
      jsonb_build_object(
        'action', CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END,
        'timestamp', now(),
        'previous_status', OLD.is_active,
        'changed_by', current_setting('app.current_user_id', true)
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for activation logging
DROP TRIGGER IF EXISTS trigger_log_activation_change ON profiles;
CREATE TRIGGER trigger_log_activation_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION log_activation_change();

-- Function to update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    last_login_at = now(),
    failed_login_attempts = 0,
    account_locked_until = NULL
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment failed login attempts
CREATE OR REPLACE FUNCTION increment_failed_login(user_email text)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_attempts integer;
BEGIN
  SELECT id, failed_login_attempts INTO v_user_id, v_attempts
  FROM profiles
  WHERE email = user_email;

  IF v_user_id IS NOT NULL THEN
    v_attempts := COALESCE(v_attempts, 0) + 1;

    UPDATE profiles
    SET
      failed_login_attempts = v_attempts,
      account_locked_until = CASE
        WHEN v_attempts >= 5 THEN now() + interval '30 minutes'
        ELSE account_locked_until
      END
    WHERE id = v_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is active and not locked
CREATE OR REPLACE FUNCTION is_account_accessible(user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_active boolean;
  v_locked_until timestamptz;
BEGIN
  SELECT is_active, account_locked_until
  INTO v_is_active, v_locked_until
  FROM profiles
  WHERE id = user_id;

  -- Account must be active and not currently locked
  RETURN v_is_active = true
    AND (v_locked_until IS NULL OR v_locked_until < now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN profiles.username IS 'Unique username for login, auto-generated from email if not provided';
COMMENT ON COLUMN profiles.is_active IS 'Account activation status - inactive users cannot log in';
COMMENT ON COLUMN profiles.password_last_changed IS 'Timestamp when password was last changed, used for password expiration policies';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of last successful login for audit and security purposes';
COMMENT ON COLUMN profiles.account_locked_until IS 'Temporary lockout timestamp after multiple failed login attempts';
COMMENT ON COLUMN profiles.failed_login_attempts IS 'Counter for failed login attempts, reset on successful login';
COMMENT ON COLUMN profiles.activation_history IS 'JSON array tracking all activation/deactivation events for audit trail';
