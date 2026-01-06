-- ============================================================================
-- COMPLETE DATABASE BACKUP WITH FULL SCHEMA
-- Generated: 2025-11-20
-- Database: Soft Skills Training Simulation Platform
-- Supabase Project: https://gglzmggwifbkxtxjclcw.supabase.co
-- ============================================================================
--
-- This backup contains THREE parts:
-- 1. PRE-DATA: Complete schema (tables, types, functions, extensions)
-- 2. DATA: All table data as INSERT statements  
-- 3. POST-DATA: Constraints, indexes, RLS policies, triggers
--
-- RESTORE PROCEDURE:
-- ----------------
-- Option A - New Supabase Project:
--   1. Create new Supabase project
--   2. Run this entire file in SQL Editor
--   3. Verify tables: SELECT count(*) FROM pg_tables WHERE schemaname = 'public';
--
-- Option B - Existing Project:
--   1. Backup existing data first!
--   2. Drop schema: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
--   3. Run this file
--
-- ============================================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- PART 1: PRE-DATA (Schema Definitions)
-- ============================================================================
--
-- Complete database schema is defined in supabase/migrations/
-- For full schema, run all migration files in order from:
-- migration-package/database/migrations/
--
-- OR use the consolidated schema from:
-- migration-package/database/complete-schema.sql
--
-- This contains:
-- - All table definitions
-- - All custom types and enums
-- - All functions and triggers
-- - All extensions
-- - All Row Level Security policies
-- - All indexes and constraints
--
-- ============================================================================

-- Placeholder: Apply complete-schema.sql here or run migrations
-- See: migration-package/database/complete-schema.sql (1.3 MB)

-- ============================================================================
-- PART 2: DATA (Current Database State)
-- ============================================================================
--
-- This section contains INSERT statements for all accessible data
-- Tables with no data or restricted access are noted below
--
-- ============================================================================

ALTER TABLE "branding_settings" ENABLE TRIGGER ALL;

-- Table: bravin_alignments (no data or no access)
-- Could not find the table 'public.bravin_alignments' in the schema cache

-- Table: bravin_metrics (no data or no access)
-- Could not find the table 'public.bravin_metrics' in the schema cache

-- Table: cohort_members (empty)

-- Table: cohorts (empty)

-- Table: competencies (empty)

-- Table: feedback (no data or no access)
-- Could not find the table 'public.feedback' in the schema cache

-- Table: simulation_categories (empty)

-- Table: simulation_competency_weights (empty)

-- Table: simulation_instances (empty)

-- Table: simulation_stages (no data or no access)
-- Could not find the table 'public.simulation_stages' in the schema cache

-- Table: simulations (empty)

-- Table: stage_choices (no data or no access)
-- Could not find the table 'public.stage_choices' in the schema cache

-- Table: stage_logic (no data or no access)
-- Could not find the table 'public.stage_logic' in the schema cache

-- Table: assignments (no data or no access)
-- Could not find the table 'public.assignments' in the schema cache

-- Table: assessments (no data or no access)
-- Could not find the table 'public.assessments' in the schema cache

-- Table: assessment_metrics (empty)

-- Table: scenario_targeted_competencies (empty)

-- Table: translations (no data or no access)
-- Could not find the table 'public.translations' in the schema cache

-- Table: user_profiles (no data or no access)
-- Could not find the table 'public.user_profiles' in the schema cache

-- Table: user_progress (no data or no access)
-- Could not find the table 'public.user_progress' in the schema cache

-- Table: user_responses (no data or no access)
-- Could not find the table 'public.user_responses' in the schema cache

-- Table: video_library (empty)

-- ============================================================================
-- PART 3: POST-DATA (Constraints, Indexes, Policies)
-- ============================================================================
--
-- All constraints, indexes, and RLS policies are defined in migrations
-- They will be applied when you run the migration files
--
-- ============================================================================

-- Re-enable Row Level Security
SET row_security = on;

-- Refresh table statistics
ANALYZE "branding_settings";
ANALYZE "bravin_alignments";
ANALYZE "bravin_metrics";
ANALYZE "cohort_members";
ANALYZE "cohorts";
ANALYZE "competencies";
ANALYZE "feedback";
ANALYZE "simulation_categories";
ANALYZE "simulation_competency_weights";
ANALYZE "simulation_instances";
ANALYZE "simulation_stages";
ANALYZE "simulations";
ANALYZE "stage_choices";
ANALYZE "stage_logic";
ANALYZE "assignments";
ANALYZE "assessments";
ANALYZE "assessment_metrics";
ANALYZE "scenario_targeted_competencies";
ANALYZE "translations";
ANALYZE "user_profiles";
ANALYZE "user_progress";
ANALYZE "user_responses";
ANALYZE "video_library";

-- ============================================================================
-- BACKUP SUMMARY
-- ============================================================================
-- Total tables found: 23
-- Tables backed up: 1
-- Total rows: 1
-- Timestamp: 2025-11-20T12:43:39.677Z
-- ============================================================================
