-- ============================================================================
-- COMPLETE DATABASE BACKUP
-- Generated: 2025-11-20T12:42:51.572Z
-- Database: Soft Skills Training Simulation Platform
-- Supabase Project: https://gglzmggwifbkxtxjclcw.supabase.co
-- ============================================================================
--
-- This backup contains:
-- 1. PRE-DATA: Schema definitions (from migrations)
-- 2. DATA: All table data as INSERT statements
-- 3. POST-DATA: Indexes, constraints, policies (from migrations)
--
-- To restore:
-- 1. Create new Supabase project
-- 2. Run all migrations from supabase/migrations/ folder
-- 3. Run the DATA section below
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- PART 1: PRE-DATA (Schema)
-- ============================================================================
--
-- Note: Schema is defined in supabase/migrations/ folder
-- Apply all migrations before restoring data
-- This ensures tables, types, and functions exist
--

-- ============================================================================
-- PART 2: DATA (Table Contents)
-- ============================================================================


-- Table: user_profiles (empty)

-- Table: competencies (empty)

-- Table: bravin_metrics (empty)

-- Table: video_library (empty)

-- Table: simulation_categories (empty)

-- Table: simulations (empty)

-- Table: simulation_stages (empty)

-- Table: stage_choices (empty)

-- Table: stage_logic (empty)

-- Table: scenario_targeted_competencies (empty)

-- Table: simulation_competency_weights (empty)

-- Table: bravin_alignments (empty)

-- Table: cohorts (empty)

-- Table: cohort_members (empty)

-- Table: assignments (empty)

-- Table: simulation_instances (empty)

-- Table: assessments (empty)

-- Table: assessment_metrics (empty)

-- Table: user_responses (empty)

-- Table: user_progress (empty)

-- Table: feedback (empty)

-- Table: translations (empty)

-- ============================================================================
-- Table: branding_settings
-- Rows: 1
-- ============================================================================

-- Disable triggers temporarily for faster import
ALTER TABLE "branding_settings" DISABLE TRIGGER ALL;

INSERT INTO "branding_settings" ("id", "logo_url", "primary_color", "secondary_color", "company_name", "login_title", "login_subtitle", "updated_at", "updated_by") VALUES ('844a26a4-f3ff-4817-874c-05223e205342', 'https://gglzmggwifbkxtxjclcw.supabase.co/storage/v1/object/public/video-files/branding/logo-1761945076430.png', '#016a73', '#8dc73f', '2025 Softskills Simulations - Change Solutions Limited', 'Soft Skills Simulation', 'Sign in to access your personalized soft skills training', '2025-10-31T22:12:00.04703+00:00', '88c8037d-0c8f-4527-9209-8ecf4ffdcff8');

-- Re-enable triggers
ALTER TABLE "branding_settings" ENABLE TRIGGER ALL;

-- ============================================================================
-- PART 3: POST-DATA (Constraints, Indexes, Policies)
-- ============================================================================
--
-- Note: These are already defined in migrations
-- The migrations include:
-- - Foreign key constraints
-- - Indexes for performance
-- - Row Level Security policies
-- - Database functions and triggers
--
-- After importing data, verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- ============================================================================

-- Re-enable Row Level Security
SET row_security = on;

-- Update sequences to current max values
-- (if you have any sequences, add them here)

-- Analyze tables for query optimizer
ANALYZE "user_profiles";
ANALYZE "competencies";
ANALYZE "bravin_metrics";
ANALYZE "video_library";
ANALYZE "simulation_categories";
ANALYZE "simulations";
ANALYZE "simulation_stages";
ANALYZE "stage_choices";
ANALYZE "stage_logic";
ANALYZE "scenario_targeted_competencies";
ANALYZE "simulation_competency_weights";
ANALYZE "bravin_alignments";
ANALYZE "cohorts";
ANALYZE "cohort_members";
ANALYZE "assignments";
ANALYZE "simulation_instances";
ANALYZE "assessments";
ANALYZE "assessment_metrics";
ANALYZE "user_responses";
ANALYZE "user_progress";
ANALYZE "feedback";
ANALYZE "translations";
ANALYZE "branding_settings";

-- ============================================================================
-- BACKUP COMPLETE
-- ============================================================================
-- Total tables: 23
-- Total rows: 1
-- Generated: 2025-11-20T12:42:54.637Z
--
-- To restore:
-- 1. Apply all migrations from supabase/migrations/
-- 2. Run this SQL file
-- 3. Verify data: SELECT count(*) FROM [table_name];
-- ============================================================================
