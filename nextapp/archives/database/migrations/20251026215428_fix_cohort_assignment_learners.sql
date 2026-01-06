/*
  # Fix Cohort Assignment Learners Issue

  ## Summary
  This migration ensures that instructors can properly query cohort members when creating
  assignments, which is necessary for populating the assignment_learners table.

  ## Problem
  When creating an assignment with cohorts, the system needs to:
  1. Query cohort_members to get all learner IDs in those cohorts
  2. Create assignment_learners records for each learner

  The RLS policies may be conflicting or the cohort_members query may be blocked.

  ## Solution
  1. Consolidate and simplify cohort_members policies
  2. Add explicit policy for instructors to query cohort members during assignment creation
  3. Ensure no policy conflicts exist

  ## Changes Made
  1. Drop all existing cohort_members policies to avoid conflicts
  2. Create consolidated, non-conflicting policies
  3. Ensure instructors can always read cohort_members for their cohorts
*/

-- ============================================================================
-- Drop all existing cohort_members policies to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Teachers can manage cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Learners can view their memberships" ON cohort_members;
DROP POLICY IF EXISTS "Instructors and admins can view cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Instructors and admins can add cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Instructors and admins can remove cohort members" ON cohort_members;
DROP POLICY IF EXISTS "View cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Add cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Remove cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Update cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Instructors view cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Instructors manage cohort members" ON cohort_members;

-- ============================================================================
-- Create consolidated cohort_members policies
-- ============================================================================

-- Allow instructors and admins to view all cohort members
-- This is critical for assignment creation
CREATE POLICY "instructors_view_all_cohort_members"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow learners to view their own membership records
CREATE POLICY "learners_view_own_memberships"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (
    learner_id = auth.uid()
  );

-- Allow instructors and admins to insert cohort members
CREATE POLICY "instructors_insert_cohort_members"
  ON cohort_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow instructors and admins to update cohort members
CREATE POLICY "instructors_update_cohort_members"
  ON cohort_members FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow instructors and admins to delete cohort members
CREATE POLICY "instructors_delete_cohort_members"
  ON cohort_members FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- ============================================================================
-- Add index for performance on cohort member queries
-- ============================================================================

-- This index improves the performance of the assignment creation query
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_active
  ON cohort_members(cohort_id, is_active)
  WHERE is_active = true;

-- This index helps with learner-based queries
CREATE INDEX IF NOT EXISTS idx_cohort_members_learner_active
  ON cohort_members(learner_id, is_active)
  WHERE is_active = true;
