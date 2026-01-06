-- ============================================================================
-- COMPLETE DATABASE BACKUP
-- Generated: 2025-11-20T12:43:37.264Z
-- Database: Soft Skills Training Simulation
-- ============================================================================
--
-- This file contains:
-- 1. PRE-DATA: Complete schema from migrations
-- 2. DATA: All table data as INSERT statements
-- 3. POST-DATA: Constraints, indexes, RLS policies
--
-- RESTORE INSTRUCTIONS:
-- 1. Create new Supabase project
-- 2. Apply all migrations from supabase/migrations/ (in order)
-- 3. Run this file to populate data
--
-- ============================================================================

-- Connection settings
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;


-- ============================================================================
-- PART 1: PRE-DATA (Schema Definitions)
-- ============================================================================
--
-- Schema is defined in: supabase/migrations/
-- Apply all migration files before importing data
--
-- Migration files should be applied in chronological order:
-- 1. 20250605003318_pink_field.sql (initial schema)
-- 2. 20251022141416_create_lti_moodle_simulation_schema.sql
-- ... (continue with all migrations)
--
-- ============================================================================

-- ============================================================================
-- PART 2: DATA (Table Contents with INSERT Statements)
-- ============================================================================


-- ============================================================================
-- Table: branding_settings
-- Rows: 1
-- ============================================================================

ALTER TABLE "branding_settings" DISABLE TRIGGER ALL;

INSERT INTO "branding_settings" ("id", "logo_url", "primary_color", "secondary_color", "company_name", "login_title", "login_subtitle", "updated_at", "updated_by") VALUES ('844a26a4-f3ff-4817-874c-05223e205342', 'https://gglzmggwifbkxtxjclcw.supabase.co/storage/v1/object/public/video-files/branding/logo-1761945076430.png', '#016a73', '#8dc73f', '2025 Softskills Simulations - Change Solutions Limited', 'Soft Skills Simulation', 'Sign in to access your personalized soft skills training', '2025-10-31T22:12:00.04703+00:00', '88c8037d-0c8f-4527-9209-8ecf4ffdcff8');

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
