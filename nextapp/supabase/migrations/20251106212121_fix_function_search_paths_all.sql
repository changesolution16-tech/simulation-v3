/*
  # Fix Function Search Paths - Complete

  Functions with role-mutable search paths can have security vulnerabilities.
  This migration sets explicit search_path = '' for all affected functions.

  ## Security Impact
  Setting search_path = '' ensures functions use fully-qualified names,
  preventing potential SQL injection or privilege escalation attacks.

  ## Functions Fixed
  All functions flagged by Supabase security audit with mutable search_path.
*/

-- Batch 1: Core simulation and instance functions
ALTER FUNCTION calculate_competency_for_option(p_scenario_id uuid, p_simulation_id uuid, p_option_id uuid, p_competency_id uuid) SET search_path = '';
ALTER FUNCTION cleanup_abandoned_sessions() SET search_path = '';
ALTER FUNCTION get_category_analytics(p_category_id uuid) SET search_path = '';
ALTER FUNCTION get_learner_category_progress(p_learner_id uuid) SET search_path = '';
ALTER FUNCTION get_next_attempt_number(p_learner_id uuid, p_simulation_id uuid) SET search_path = '';
ALTER FUNCTION get_option_feedback_videos_batch(option_ids uuid[]) SET search_path = '';
ALTER FUNCTION get_simulation_max_level(p_simulation_id uuid) SET search_path = '';
ALTER FUNCTION get_simulation_with_scenarios_optimized(sim_id uuid) SET search_path = '';
ALTER FUNCTION get_supabase_url() SET search_path = '';
ALTER FUNCTION initialize_instance_max_level() SET search_path = '';
ALTER FUNCTION recalculate_stages_completed(p_instance_id uuid) SET search_path = '';
ALTER FUNCTION record_metric_assessment(p_learner_id uuid, p_simulation_instance_id uuid, p_scenario_id uuid, p_option_id uuid) SET search_path = '';
ALTER FUNCTION resolve_video_urls_batch(file_ids text[]) SET search_path = '';
ALTER FUNCTION toggle_category_favorite(p_category_id uuid, p_learner_id uuid) SET search_path = '';
ALTER FUNCTION track_category_view(p_category_id uuid, p_learner_id uuid) SET search_path = '';
ALTER FUNCTION update_category_statistics(p_category_id uuid) SET search_path = '';
ALTER FUNCTION update_simulation_instance_on_response() SET search_path = '';
ALTER FUNCTION update_simulation_instance_stats() SET search_path = '';
ALTER FUNCTION update_simulation_progress(p_instance_id uuid, p_current_scenario_id uuid, p_current_stage integer) SET search_path = '';
ALTER FUNCTION validate_all_active_instances() SET search_path = '';

-- Batch 2: Video, session, and scoring functions
ALTER FUNCTION auto_clean_video_urls() SET search_path = '';
ALTER FUNCTION calculate_final_scores(p_instance_id uuid) SET search_path = '';
ALTER FUNCTION clean_video_url(url text) SET search_path = '';
ALTER FUNCTION complete_simulation_instance(p_instance_id uuid) SET search_path = '';
ALTER FUNCTION get_all_simulation_attempts(p_learner_id uuid, p_simulation_id uuid) SET search_path = '';
ALTER FUNCTION get_best_simulation_attempt(p_learner_id uuid, p_simulation_id uuid) SET search_path = '';
ALTER FUNCTION get_simulation_progress(p_learner_id uuid, p_simulation_id uuid) SET search_path = '';
ALTER FUNCTION get_simulation_session_state(p_instance_id uuid) SET search_path = '';
ALTER FUNCTION link_assignment_to_instance(p_assignment_learner_id uuid, p_instance_id uuid) SET search_path = '';
ALTER FUNCTION mark_abandoned_simulation_instances() SET search_path = '';
ALTER FUNCTION reconcile_decision_count(p_instance_id uuid) SET search_path = '';
ALTER FUNCTION set_attempt_number_on_insert() SET search_path = '';
ALTER FUNCTION sync_assignment_score(p_instance_id uuid, p_final_score numeric) SET search_path = '';
ALTER FUNCTION sync_scenario_branches() SET search_path = '';
ALTER FUNCTION sync_scenario_branches_for_scenario(p_scenario_id uuid) SET search_path = '';
ALTER FUNCTION sync_simulation_session_state(p_instance_id uuid, p_current_scenario_id uuid, p_current_scenario_index integer, p_session_data jsonb, p_competency_scores jsonb, p_decision_history jsonb, p_path_taken uuid[]) SET search_path = '';
ALTER FUNCTION trigger_sync_scenario_branches() SET search_path = '';
ALTER FUNCTION update_best_attempt_flag(p_learner_id uuid, p_simulation_id uuid) SET search_path = '';
ALTER FUNCTION update_simulation_instance_activity() SET search_path = '';
ALTER FUNCTION validate_and_fix_instance_metrics(p_instance_id uuid) SET search_path = '';

COMMENT ON FUNCTION get_supabase_url() IS
  'Returns Supabase URL - search_path fixed for security';

COMMENT ON FUNCTION update_simulation_progress(uuid, uuid, integer) IS
  'Updates simulation progress tracking - search_path fixed for security';

COMMENT ON FUNCTION calculate_competency_for_option(uuid, uuid, uuid, uuid) IS
  'Calculates competency scores - search_path fixed for security';
