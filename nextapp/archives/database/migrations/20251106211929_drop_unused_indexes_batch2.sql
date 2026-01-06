/*
  # Drop Unused Indexes - Batch 2

  Continues removing unused indexes to improve performance.

  ## Batch 2: Scenario, Simulation, and Video Related Tables
*/

-- Scenarios
DROP INDEX IF EXISTS idx_scenarios_topic;
DROP INDEX IF EXISTS idx_scenarios_created_by;
DROP INDEX IF EXISTS idx_scenarios_status;
DROP INDEX IF EXISTS idx_scenarios_published;
DROP INDEX IF EXISTS idx_scenarios_position;
DROP INDEX IF EXISTS idx_scenarios_prompt_video_file;
DROP INDEX IF EXISTS idx_scenarios_intro_video_file;
DROP INDEX IF EXISTS idx_scenarios_conclusion_video_file;
DROP INDEX IF EXISTS idx_scenarios_transition_file;
DROP INDEX IF EXISTS idx_scenarios_category_id;
DROP INDEX IF EXISTS idx_scenarios_timer_enabled;
DROP INDEX IF EXISTS idx_scenarios_hierarchy_level;
DROP INDEX IF EXISTS idx_scenarios_question_text;

-- Scenario Options
DROP INDEX IF EXISTS idx_scenario_options_feedback_beginner_file;
DROP INDEX IF EXISTS idx_scenario_options_feedback_intermediate_file;
DROP INDEX IF EXISTS idx_scenario_options_feedback_advanced_file;
DROP INDEX IF EXISTS idx_scenario_options_feedback_file_beginner;
DROP INDEX IF EXISTS idx_scenario_options_feedback_file_intermediate;
DROP INDEX IF EXISTS idx_scenario_options_feedback_file_advanced;
DROP INDEX IF EXISTS idx_scenario_options_transition_file;
DROP INDEX IF EXISTS idx_scenario_options_next_scenario;
DROP INDEX IF EXISTS idx_options_feedback_beginner_source;

-- Scenario Branches
DROP INDEX IF EXISTS idx_scenario_branches_conditional;

-- Scenario Conditions
DROP INDEX IF EXISTS idx_scenario_conditions_type;

-- Scenario Analytics
DROP INDEX IF EXISTS idx_scenario_analytics_scenario_id;

-- Scenario Paths
DROP INDEX IF EXISTS idx_scenario_paths_created_by;
DROP INDEX IF EXISTS idx_scenario_paths_topic_id;

-- Scenario Videos
DROP INDEX IF EXISTS idx_scenario_videos_option_id;

-- Scenario Option Metrics
DROP INDEX IF EXISTS idx_scenario_option_metrics_configured_by;
DROP INDEX IF EXISTS idx_option_metrics_metric;

-- Scenario Targeted Competencies
DROP INDEX IF EXISTS idx_scenario_targeted_competencies_competency_id;
DROP INDEX IF EXISTS idx_scenario_targeted_competencies_priority;

-- Simulations
DROP INDEX IF EXISTS idx_simulations_created_by;
DROP INDEX IF EXISTS idx_simulations_difficulty;
DROP INDEX IF EXISTS idx_simulations_entry_scenario_id;
DROP INDEX IF EXISTS idx_simulations_introduction_video;
DROP INDEX IF EXISTS idx_simulations_landing_video;
DROP INDEX IF EXISTS idx_simulations_closing_video_excellent_file_id;
DROP INDEX IF EXISTS idx_simulations_closing_video_good_file_id;
DROP INDEX IF EXISTS idx_simulations_closing_video_developing_file_id;
DROP INDEX IF EXISTS idx_simulations_closing_enabled;

-- Simulation Instances
DROP INDEX IF EXISTS idx_simulation_instances_resource;
DROP INDEX IF EXISTS idx_simulation_instances_learner_simulation;
DROP INDEX IF EXISTS idx_simulation_instances_simulation_status;
DROP INDEX IF EXISTS idx_simulation_instances_attempt;
DROP INDEX IF EXISTS idx_simulation_instances_best_attempt;

-- Simulation Scenarios
DROP INDEX IF EXISTS idx_simulation_scenarios_entry;
DROP INDEX IF EXISTS idx_simulation_scenarios_exit;
DROP INDEX IF EXISTS idx_simulation_scenarios_entry_point;
DROP INDEX IF EXISTS idx_simulation_scenarios_exit_point;

-- Simulation Metrics
DROP INDEX IF EXISTS idx_simulation_metrics_metric;

-- Simulation Competencies
DROP INDEX IF EXISTS idx_simulation_competencies_competency;

-- Simulation Templates
DROP INDEX IF EXISTS idx_simulation_templates_category;
DROP INDEX IF EXISTS idx_simulation_templates_public;
DROP INDEX IF EXISTS idx_simulation_templates_usage;
DROP INDEX IF EXISTS idx_simulation_templates_created_by;

-- Simulation Categories
DROP INDEX IF EXISTS idx_simulation_categories_name_en;
DROP INDEX IF EXISTS idx_simulation_categories_name_es;
DROP INDEX IF EXISTS idx_categories_active_order;
DROP INDEX IF EXISTS idx_categories_created;

-- Simulation Metric Competency Mappings
DROP INDEX IF EXISTS idx_simulation_metric_competency_mappings_algorithm_id;
DROP INDEX IF EXISTS idx_simulation_metric_competency_mappings_configured_by;
DROP INDEX IF EXISTS idx_smcm_simulation;
DROP INDEX IF EXISTS idx_smcm_metric;
DROP INDEX IF EXISTS idx_smcm_competency;
