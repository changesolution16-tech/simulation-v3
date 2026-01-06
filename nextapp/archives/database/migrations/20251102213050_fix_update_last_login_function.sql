/*
  # Fix update_last_login Function

  1. Problem
    - The `update_last_login` function has `search_path` set to empty string for security
    - This prevents it from finding the `profiles` table
    - Results in error: "relation 'profiles' does not exist"

  2. Solution
    - Update function to use fully qualified table name `public.profiles`
    - Keep security setting `search_path = ''` for safety
    - This ensures the function works correctly while maintaining security

  3. Changes
    - Replace `UPDATE profiles` with `UPDATE public.profiles`
    - Keep all other functionality the same
*/

CREATE OR REPLACE FUNCTION public.update_last_login(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_login_at = now(),
    failed_login_attempts = 0,
    account_locked_until = NULL
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
