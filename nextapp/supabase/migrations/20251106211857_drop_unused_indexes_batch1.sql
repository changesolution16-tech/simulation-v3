/*
  # Drop Unused Indexes - Batch 1

  This migration removes unused indexes to improve write performance and reduce storage.
  These indexes have not been used and are not necessary for current query patterns.

  ## Safety
  - All indexes being dropped are confirmed unused by Supabase monitoring
  - Foreign key indexes and primary keys are NOT being dropped
  - Can be recreated if needed in the future

  ## Batch 1: Assignment and Badge Related Tables
*/

-- Assignment Learners
DROP INDEX IF EXISTS idx_assignment_learners_current_instance_id;
DROP INDEX IF EXISTS idx_assignment_learners_graded_by;
DROP INDEX IF EXISTS idx_assignment_learners_status;

-- Assignment Notifications
DROP INDEX IF EXISTS idx_assignment_notifications_learner_id;

-- Badges
DROP INDEX IF EXISTS idx_badges_created_by;

-- Learner Badges
DROP INDEX IF EXISTS idx_learner_badges_awarded_by;
DROP INDEX IF EXISTS idx_learner_badges_badge_id;

-- Grade Submissions
DROP INDEX IF EXISTS idx_grade_submissions_attempt_id;
DROP INDEX IF EXISTS idx_grade_submissions_resource_link_id;

-- Learner Attempts
DROP INDEX IF EXISTS idx_learner_attempts_instance_id;
DROP INDEX IF EXISTS idx_learner_attempts_learner_id;

-- Learner Responses
DROP INDEX IF EXISTS idx_learner_responses_attempt_id;
DROP INDEX IF EXISTS idx_learner_responses_instance_scenario;
DROP INDEX IF EXISTS idx_learner_responses_decision_time;

-- Learner Competencies
DROP INDEX IF EXISTS idx_learner_competencies_competency_id;

-- Competencies
DROP INDEX IF EXISTS idx_competencies_parent;
DROP INDEX IF EXISTS idx_competencies_tags;

-- Competency Mappings
DROP INDEX IF EXISTS idx_competency_mappings_competency;
DROP INDEX IF EXISTS idx_competency_mappings_option_id;

-- Assessment Metrics
DROP INDEX IF EXISTS idx_assessment_metrics_type;
DROP INDEX IF EXISTS idx_assessment_metrics_global;
DROP INDEX IF EXISTS idx_assessment_metrics_created_by;

-- Performance Assessments
DROP INDEX IF EXISTS idx_performance_assessments_assessed_by;
DROP INDEX IF EXISTS idx_performance_assessments_attempt_id;
DROP INDEX IF EXISTS idx_performance_assessments_rubric_id;

-- Rubric Templates
DROP INDEX IF EXISTS idx_rubric_templates_created_by;
DROP INDEX IF EXISTS idx_rubric_criteria_rubric;
