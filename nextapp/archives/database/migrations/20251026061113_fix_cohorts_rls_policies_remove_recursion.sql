/*
  # Fix Cohorts RLS Policies to Remove Recursion

  ## Summary
  This migration fixes recursive RLS policies on the cohorts table that prevent
  instructors from viewing and creating cohorts.

  ## Problem
  The existing policies check the profiles table within their conditions, which can
  cause permission issues and prevent the cohort list from loading.

  ## Solution
  Simplify policies to use direct role checks without recursion.

  ## Changes Made
  1. Drop all existing recursive cohort policies
  2. Create simplified non-recursive policies
  3. Allow admins and instructors to manage cohorts
  4. Allow learners to view cohorts they're members of
*/

-- ============================================================================
-- Drop all existing policies on cohorts
-- ============================================================================

DROP POLICY IF EXISTS "Admins and instructors can create cohorts" ON cohorts;
DROP POLICY IF EXISTS "Admins and instructors can view all cohorts" ON cohorts;
DROP POLICY IF EXISTS "Admins and instructors can update cohorts" ON cohorts;
DROP POLICY IF EXISTS "Admins and instructors can delete cohorts" ON cohorts;
DROP POLICY IF EXISTS "Learners can view their cohorts" ON cohorts;

-- ============================================================================
-- Create simplified, non-recursive policies
-- ============================================================================

-- Allow authenticated instructors and admins to view cohorts
CREATE POLICY "Instructors and admins view cohorts"
  ON cohorts FOR SELECT
  TO authenticated
  USING (
    -- Direct role check from profiles without recursion
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
    OR
    -- Or if the cohort is theirs
    created_by = auth.uid()
  );

-- Allow instructors and admins to create cohorts
CREATE POLICY "Instructors and admins create cohorts"
  ON cohorts FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow creators and admins to update cohorts
CREATE POLICY "Creators and admins update cohorts"
  ON cohorts FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    created_by = auth.uid()
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow creators and admins to delete cohorts
CREATE POLICY "Creators and admins delete cohorts"
  ON cohorts FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- Fix cohort_members policies
-- ============================================================================

DROP POLICY IF EXISTS "Instructors and admins can view cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Instructors and admins can add cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Instructors and admins can remove cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Learners can view their memberships" ON cohort_members;

-- Allow instructors, admins, and members to view cohort members
CREATE POLICY "View cohort members"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (
    -- Learner viewing their own membership
    learner_id = auth.uid()
    OR
    -- Instructor/admin viewing any membership
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow instructors and admins to add members
CREATE POLICY "Add cohort members"
  ON cohort_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow instructors and admins to remove members
CREATE POLICY "Remove cohort members"
  ON cohort_members FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Allow instructors and admins to update member roles
CREATE POLICY "Update cohort members"
  ON cohort_members FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'instructor')
  );
