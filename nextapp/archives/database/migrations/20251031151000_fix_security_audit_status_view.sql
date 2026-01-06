/*
  # Fix security_audit_status View Security Definer Issue

  1. Changes
    - Convert security_audit_status view to use security_invoker = true
    - This ensures the view respects RLS policies of the querying user
    - Fixes the last remaining SECURITY DEFINER view vulnerability

  2. Security
    - View will execute with permissions of the caller, not the creator
    - Maintains proper security boundaries
    - Completes the security audit remediation
*/

-- Fix security_audit_status view to use security_invoker
ALTER VIEW security_audit_status SET (security_invoker = true);

-- Add comment documenting the security configuration
COMMENT ON VIEW security_audit_status IS 'Security audit status view with security_invoker enabled. This view respects RLS policies of the querying user and provides visibility into database security configurations.';
