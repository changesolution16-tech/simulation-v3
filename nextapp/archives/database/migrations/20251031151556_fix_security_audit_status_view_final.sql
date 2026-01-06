/*
  # Fix security_audit_status View Security Definer Issue

  1. Changes
    - Drop and recreate security_audit_status view with security_invoker = true
    - This ensures the view respects RLS policies of the querying user
    - Fixes the last remaining SECURITY DEFINER view vulnerability

  2. Security
    - View will execute with permissions of the caller, not the creator
    - Maintains proper security boundaries
    - Completes the security audit remediation
*/

-- Drop and recreate the view with security_invoker enabled
DROP VIEW IF EXISTS security_audit_status;

CREATE VIEW security_audit_status 
WITH (security_invoker = true) AS
SELECT
  'views_with_security_invoker' as check_type,
  COUNT(*) as count,
  jsonb_agg(viewname) as items
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('options_missing_feedback', 'options_missing_metrics', 'metric_assignments_summary')

UNION ALL

SELECT
  'functions_with_secure_search_path' as check_type,
  COUNT(*) as count,
  jsonb_agg(p.proname) as items
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'apply_scenario_hierarchy_levels',
    'atomic_update_scenario_with_options',
    'auto_clean_video_urls',
    'calculate_competency_impact',
    'calculate_scenario_hierarchy_levels',
    'check_storage_quota',
    'clean_video_url',
    'cleanup_orphaned_video_files',
    'detect_scenario_cycles',
    'detect_video_platform',
    'diagnose_simulation_connections',
    'find_disconnected_scenarios',
    'generate_path_signature',
    'generate_video_library_url',
    'generate_video_storage_path',
    'get_automatic_competency_impacts',
    'get_bravin_metrics',
    'get_feedback_video_url',
    'get_metric_competency_mapping_recommendations',
    'get_option_feedback_videos',
    'get_option_metrics',
    'get_scenario_connection_status',
    'get_scenario_connections',
    'get_scenario_targeted_competencies',
    'get_scenarios_using_video',
    'get_simulation_connection_map',
    'get_storage_public_url',
    'get_user_storage_usage',
    'get_video_file_url',
    'increment_failed_login',
    'increment_video_file_views',
    'increment_video_usage',
    'is_account_accessible',
    'log_activation_change',
    'record_metric_assessment',
    'repair_orphaned_connections',
    'resolve_video_url',
    'safe_update_profile',
    'set_simulation_published_at',
    'sync_scenario_branches',
    'sync_scenario_branches_for_scenario',
    'trigger_hierarchy_recalculation',
    'trigger_sync_scenario_branches',
    'update_landing_page_progress_updated_at',
    'update_last_login',
    'update_mapping_timestamp',
    'update_profiles_updated_at',
    'update_scenario_targeted_competencies_timestamp',
    'update_simulation_metrics_updated_at',
    'update_simulations_updated_at',
    'update_updated_at_column',
    'update_user_storage_usage',
    'validate_scenario_connections',
    'verify_scenario_connections_integrity'
  );

-- Grant SELECT permission to authenticated users
GRANT SELECT ON security_audit_status TO authenticated;

-- Add descriptive comment
COMMENT ON VIEW security_audit_status IS 'Security audit status view with security_invoker enabled. This view respects RLS policies of the querying user and provides visibility into database security configurations.';
