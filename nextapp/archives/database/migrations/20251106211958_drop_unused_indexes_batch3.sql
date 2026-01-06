/*
  # Drop Unused Indexes - Batch 3

  Final batch of unused index removal.

  ## Batch 3: Video, Category, Learning, and BRAVIN Tables
*/

-- Video Files
DROP INDEX IF EXISTS idx_video_files_storage_path;
DROP INDEX IF EXISTS idx_video_files_file_hash;
DROP INDEX IF EXISTS idx_video_files_upload_status;
DROP INDEX IF EXISTS idx_video_files_created_at;

-- Video Library
DROP INDEX IF EXISTS idx_video_library_created_by;
DROP INDEX IF EXISTS idx_video_library_platform;
DROP INDEX IF EXISTS idx_video_library_tags;
DROP INDEX IF EXISTS idx_video_library_topic_ids;
DROP INDEX IF EXISTS idx_video_library_is_public;
DROP INDEX IF EXISTS idx_video_library_usage_count;
DROP INDEX IF EXISTS idx_video_library_video_file;

-- Video Collections
DROP INDEX IF EXISTS idx_video_collections_created_by;
DROP INDEX IF EXISTS idx_video_collections_topic;

-- Video Collection Items
DROP INDEX IF EXISTS idx_video_collection_items_added_by;
DROP INDEX IF EXISTS idx_video_collection_items_collection;

-- Video Watch Tracking
DROP INDEX IF EXISTS idx_video_watch_tracking_user;
DROP INDEX IF EXISTS idx_video_watch_tracking_user_scenario;
DROP INDEX IF EXISTS idx_video_watch_tracking_completed;

-- Video Access Logs
DROP INDEX IF EXISTS idx_video_access_logs_checked_by;
DROP INDEX IF EXISTS idx_video_access_logs_url;
DROP INDEX IF EXISTS idx_video_access_logs_status;
DROP INDEX IF EXISTS idx_video_access_logs_checked_at;

-- Storage Quotas
DROP INDEX IF EXISTS idx_storage_quotas_user_id;

-- Category Statistics
DROP INDEX IF EXISTS idx_category_stats_category;
DROP INDEX IF EXISTS idx_category_stats_updated;

-- Category Learner Progress
DROP INDEX IF EXISTS idx_category_progress_favorites;

-- Landing Page Progress
DROP INDEX IF EXISTS idx_landing_page_progress_user_topic;

-- Learner Journeys
DROP INDEX IF EXISTS idx_learner_journeys_instance;
DROP INDEX IF EXISTS idx_learner_journeys_user;
DROP INDEX IF EXISTS idx_learner_journeys_timestamp;
DROP INDEX IF EXISTS idx_journeys_user_timestamp;

-- Path Analytics
DROP INDEX IF EXISTS idx_path_analytics_topic;
DROP INDEX IF EXISTS idx_path_analytics_difficulty;

-- Path Recommendations
DROP INDEX IF EXISTS idx_path_recommendations_user;
DROP INDEX IF EXISTS idx_path_recommendations_topic;

-- Learning Events
DROP INDEX IF EXISTS idx_learning_events_verb;
DROP INDEX IF EXISTS idx_learning_events_stored_at;
DROP INDEX IF EXISTS idx_learning_events_context_instructor;

-- Learning Recommendations
DROP INDEX IF EXISTS idx_learning_recommendations_attempt_id;
DROP INDEX IF EXISTS idx_learning_recommendations_learner_id;

-- Engagement Metrics
DROP INDEX IF EXISTS idx_engagement_metrics_instance_id;
DROP INDEX IF EXISTS idx_engagement_metrics_learner_id;

-- Decision Analytics
DROP INDEX IF EXISTS idx_decision_analytics_option_id;

-- Content Versions
DROP INDEX IF EXISTS idx_content_versions_changed_by;
DROP INDEX IF EXISTS idx_content_versions_scenario;

-- BRAVIN Related
DROP INDEX IF EXISTS idx_bravin_scenario_option_mappings_configured_by;
DROP INDEX IF EXISTS idx_bravin_learner_scores_dimension;
DROP INDEX IF EXISTS idx_bravin_learner_scores_updated;
DROP INDEX IF EXISTS idx_decision_assessments_timestamp;

-- Trust and Ethics
DROP INDEX IF EXISTS idx_trust_events_type;
DROP INDEX IF EXISTS idx_trust_events_created;
DROP INDEX IF EXISTS idx_trust_impact_events_decision_assessment_id;
DROP INDEX IF EXISTS idx_ethical_assessments_learner;
DROP INDEX IF EXISTS idx_ethical_decision_quality_assessments_decision_assessment_id;
DROP INDEX IF EXISTS idx_ei_assessments_learner;
DROP INDEX IF EXISTS idx_emotional_intelligence_assessments_decision_assessment_id;
DROP INDEX IF EXISTS idx_stewardship_logs_learner;
DROP INDEX IF EXISTS idx_stewardship_logs_type;
DROP INDEX IF EXISTS idx_cultural_stewardship_logs_decision_assessment_id;

-- Metrics
DROP INDEX IF EXISTS idx_learner_metric_weights_metric_id;
DROP INDEX IF EXISTS idx_learner_metric_weights_set_by;
DROP INDEX IF EXISTS idx_metric_assessments_metric;

-- Competency Weights
DROP INDEX IF EXISTS idx_global_weights_competency;
DROP INDEX IF EXISTS idx_competency_impact_overrides_overridden_by;
DROP INDEX IF EXISTS idx_overrides_scenario_option;
DROP INDEX IF EXISTS idx_overrides_competency;

-- Mapping Templates
DROP INDEX IF EXISTS idx_templates_type;
DROP INDEX IF EXISTS idx_templates_creator;

-- Training Assignments
DROP INDEX IF EXISTS idx_training_assignments_topic;
DROP INDEX IF EXISTS idx_training_assignments_due_date;
DROP INDEX IF EXISTS idx_training_assignments_category_id;

-- Profiles
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_is_active;
DROP INDEX IF EXISTS idx_profiles_email_active;
DROP INDEX IF EXISTS idx_profiles_last_login;

-- Cohort Analytics
DROP INDEX IF EXISTS idx_cohort_analytics_context_id;
DROP INDEX IF EXISTS idx_cohort_analytics_topic_id;

-- LTI User Mappings
DROP INDEX IF EXISTS idx_lti_user_mappings_lti_user;

-- Assessments
DROP INDEX IF EXISTS idx_assessments_learner;
DROP INDEX IF EXISTS idx_history_learner;
