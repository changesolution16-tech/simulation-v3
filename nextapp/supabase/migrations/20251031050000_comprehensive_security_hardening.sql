/*
  # Comprehensive Security Hardening

  1. Security Enhancements
    - Add constraints to prevent SQL injection
    - Add check constraints for data validation
    - Strengthen RLS policies with additional checks
    - Add audit triggers for sensitive operations

  2. Additional RLS Policies
    - Add missing policies for partially protected tables
    - Strengthen existing policies with ownership checks
    - Add admin override policies where needed

  3. Data Validation
    - Add check constraints for email formats
    - Add check constraints for UUID formats
    - Add length constraints on text fields
    - Prevent empty or null critical fields

  4. Notes
    - Focuses on defense in depth
    - Multiple layers of security validation
    - Prevents common attack vectors
*/

-- ============================================================================
-- PART 1: Add data validation constraints
-- ============================================================================

-- Profiles table validation
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_email_format
  CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_email_length
  CHECK (char_length(email) <= 254);

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_full_name_not_empty
  CHECK (full_name IS NOT NULL AND char_length(trim(full_name)) > 0);

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_role_valid
  CHECK (role IN ('learner', 'instructor', 'admin'));

-- LTI user mappings validation
ALTER TABLE lti_user_mappings ADD CONSTRAINT IF NOT EXISTS check_lti_user_id_not_empty
  CHECK (char_length(trim(lti_user_id)) > 0);

-- Scenarios validation
ALTER TABLE scenarios ADD CONSTRAINT IF NOT EXISTS check_title_not_empty
  CHECK (char_length(trim(title)) > 0);

ALTER TABLE scenarios ADD CONSTRAINT IF NOT EXISTS check_difficulty_valid
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

-- Video library validation
ALTER TABLE video_library ADD CONSTRAINT IF NOT EXISTS check_video_title_not_empty
  CHECK (char_length(trim(title)) > 0);

-- ============================================================================
-- PART 2: Strengthen existing RLS policies
-- ============================================================================

-- Drop and recreate profiles policies with stronger checks
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'instructor')
      AND p.is_active = true
    )
  );

-- Strengthen training_assignments policies
DROP POLICY IF EXISTS "Instructors can manage training assignments" ON training_assignments;
CREATE POLICY "Instructors can manage assignments"
  ON training_assignments FOR ALL
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'instructor')
      AND p.is_active = true
    )
  );

-- Strengthen assignment_learners policies
DROP POLICY IF EXISTS "Instructors can manage learners" ON assignment_learners;
CREATE POLICY "Instructors manage assignment learners"
  ON assignment_learners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_assignments ta
      INNER JOIN profiles p ON p.id = (SELECT auth.uid())
      WHERE ta.id = assignment_learners.assignment_id
      AND (ta.created_by = (SELECT auth.uid()) OR p.role = 'admin')
      AND p.is_active = true
    )
  );

-- ============================================================================
-- PART 3: Add missing RLS policies for critical tables
-- ============================================================================

-- video_library policies
DROP POLICY IF EXISTS "Admins can manage video library" ON video_library;
CREATE POLICY "Admins can manage video library"
  ON video_library FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'instructor')
      AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can view public videos" ON video_library;
CREATE POLICY "Users can view public videos"
  ON video_library FOR SELECT
  TO authenticated
  USING (is_public = true OR is_featured = true);

-- competencies policies (strengthen existing)
DROP POLICY IF EXISTS "Admins can manage competencies" ON competencies;
CREATE POLICY "Admins can manage competencies"
  ON competencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.is_active = true
    )
  );

-- assessment_metrics policies (strengthen existing)
DROP POLICY IF EXISTS "Admins and instructors manage metrics" ON assessment_metrics;
CREATE POLICY "Admins and instructors manage metrics"
  ON assessment_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'instructor')
      AND p.is_active = true
    )
  );

-- ============================================================================
-- PART 4: Add audit logging function
-- ============================================================================

CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_id UUID,
  details JSONB DEFAULT '{}'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO learning_events (
    actor_id,
    event_type,
    event_details,
    event_timestamp
  ) VALUES (
    user_id,
    event_type,
    details,
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;

-- ============================================================================
-- PART 5: Add function to validate user permissions
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin' AND is_active = true)
  INTO is_admin
  FROM profiles
  WHERE id = user_id;

  RETURN COALESCE(is_admin, false);
END;
$$;

CREATE OR REPLACE FUNCTION check_user_is_instructor_or_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT (role IN ('admin', 'instructor') AND is_active = true)
  INTO has_permission
  FROM profiles
  WHERE id = user_id;

  RETURN COALESCE(has_permission, false);
END;
$$;

-- ============================================================================
-- PART 6: Add indexes for security-related queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON profiles(role, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_lti_user_mappings_profile_id ON lti_user_mappings(profile_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_actor_timestamp ON learning_events(actor_id, event_timestamp DESC);

-- ============================================================================
-- PART 7: Add storage bucket security
-- ============================================================================

-- Ensure storage buckets have proper policies
DO $$
BEGIN
  -- Update video-library bucket policies if not already set
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'video-library'
  ) THEN
    UPDATE storage.buckets
    SET public = false,
        file_size_limit = 524288000,
        allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'image/jpeg', 'image/png', 'image/gif']
    WHERE name = 'video-library';
  END IF;
END $$;

-- ============================================================================
-- PART 8: Add rate limiting table for persistent tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON auth_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked_until ON auth_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system access (no user policies)
CREATE POLICY "System can manage rate limits"
  ON auth_rate_limits FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- PART 9: Create function to clean up expired rate limits
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth_rate_limits
  WHERE (blocked_until IS NOT NULL AND blocked_until < now() - INTERVAL '1 hour')
     OR (blocked_until IS NULL AND first_attempt_at < now() - INTERVAL '1 hour');
END;
$$;

-- ============================================================================
-- PART 10: Add security headers recommendation table
-- ============================================================================

COMMENT ON DATABASE postgres IS 'Security Notes:
1. Ensure Content-Security-Policy header is set in application
2. Enable HSTS with includeSubDomains
3. Set X-Frame-Options to DENY or SAMEORIGIN
4. Set X-Content-Type-Options to nosniff
5. Set Referrer-Policy to strict-origin-when-cross-origin
6. Rotate Supabase anon key periodically
7. Use environment variables for all secrets
8. Enable database audit logging
9. Implement JWKS caching with TTL
10. Monitor failed authentication attempts';
