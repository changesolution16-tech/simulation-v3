/*
  # Fix Profile Functions with Empty Search Path

  1. Problem
    - Multiple functions have `search_path = ''` for security
    - This prevents them from finding the `profiles` table
    - Results in error: "relation 'profiles' does not exist"

  2. Functions Fixed
    - `increment_failed_login` - tracks failed login attempts
    - `is_account_accessible` - checks if account is active and unlocked

  3. Solution
    - Update all functions to use fully qualified table name `public.profiles`
    - Keep security setting `search_path = ''` for safety
    - Ensures functions work correctly while maintaining security
*/

-- Fix increment_failed_login function
CREATE OR REPLACE FUNCTION public.increment_failed_login(user_email text)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_attempts integer;
BEGIN
  SELECT id, failed_login_attempts INTO v_user_id, v_attempts
  FROM public.profiles
  WHERE email = user_email;

  IF v_user_id IS NOT NULL THEN
    v_attempts := COALESCE(v_attempts, 0) + 1;

    UPDATE public.profiles
    SET
      failed_login_attempts = v_attempts,
      account_locked_until = CASE
        WHEN v_attempts >= 5 THEN now() + interval '30 minutes'
        ELSE account_locked_until
      END
    WHERE id = v_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix is_account_accessible function
CREATE OR REPLACE FUNCTION public.is_account_accessible(user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_active boolean;
  v_locked_until timestamptz;
BEGIN
  SELECT is_active, account_locked_until
  INTO v_is_active, v_locked_until
  FROM public.profiles
  WHERE id = user_id;

  -- Account must be active and not currently locked
  RETURN v_is_active = true
    AND (v_locked_until IS NULL OR v_locked_until < now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
