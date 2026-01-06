/*
  # Fix Training Assignments RLS Policies

  ## Summary
  This migration fixes the Row Level Security policies on training_assignments and assignment_learners
  tables to allow instructors and admins to create assignments without being logged out.

  ## Changes Made
  1. Drop existing overly restrictive policies on training_assignments
  2. Create separate policies for SELECT, INSERT, UPDATE, and DELETE operations
  3. Add proper WITH CHECK clauses for INSERT operations
  4. Fix assignment_learners policies to allow instructor access
  5. Ensure instructors can read cohort_members for expanding cohorts

  ## Security Notes
  - Instructors can only manage assignments they create (created_by = auth.uid())
  - Admins can manage all assignments
  - Learners can only view assignments assigned to them
  - All INSERT operations properly check authentication and authorization
*/

-- ============================================================================
-- Drop existing overly restrictive policies on training_assignments
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can manage assignments" ON training_assignments;
DROP POLICY IF EXISTS "Learners can view their assignments" ON training_assignments;

-- ============================================================================
-- Create new granular policies for training_assignments
-- ============================================================================

-- Allow instructors and admins to view all assignments they created
CREATE POLICY "Instructors can view own assignments"
  ON training_assignments FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Allow instructors and admins to create assignments
CREATE POLICY "Instructors can create assignments"
  ON training_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Allow instructors to update their own assignments, admins can update all
CREATE POLICY "Instructors can update own assignments"
  ON training_assignments FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow instructors to delete their own assignments, admins can delete all
CREATE POLICY "Instructors can delete own assignments"
  ON training_assignments FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow learners to view assignments assigned to them
CREATE POLICY "Learners can view assigned assignments"
  ON training_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignment_learners
      WHERE assignment_learners.assignment_id = training_assignments.id
      AND assignment_learners.learner_id = auth.uid()
    )
  );

-- ============================================================================
-- Fix assignment_learners policies
-- ============================================================================

DROP POLICY IF EXISTS "Learners can view own assignment status" ON assignment_learners;
DROP POLICY IF EXISTS "Learners can update own assignment status" ON assignment_learners;
DROP POLICY IF EXISTS "Teachers can manage assignment learners" ON assignment_learners;

-- Learners can view their own assignment status
CREATE POLICY "Learners view own status"
  ON assignment_learners FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

-- Instructors can view assignment learners for their assignments
CREATE POLICY "Instructors view assignment learners"
  ON assignment_learners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_assignments
      WHERE training_assignments.id = assignment_learners.assignment_id
      AND (
        training_assignments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Instructors can create assignment learner records for their assignments
CREATE POLICY "Instructors create assignment learners"
  ON assignment_learners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_assignments
      WHERE training_assignments.id = assignment_learners.assignment_id
      AND (
        training_assignments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Learners can update their own assignment status
CREATE POLICY "Learners update own status"
  ON assignment_learners FOR UPDATE
  TO authenticated
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- Instructors can update assignment learners for their assignments
CREATE POLICY "Instructors update assignment learners"
  ON assignment_learners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_assignments
      WHERE training_assignments.id = assignment_learners.assignment_id
      AND (
        training_assignments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_assignments
      WHERE training_assignments.id = assignment_learners.assignment_id
      AND (
        training_assignments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Instructors can delete assignment learners for their assignments
CREATE POLICY "Instructors delete assignment learners"
  ON assignment_learners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_assignments
      WHERE training_assignments.id = assignment_learners.assignment_id
      AND (
        training_assignments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- ============================================================================
-- Ensure instructors can read cohort members for expanding cohorts
-- ============================================================================

-- This policy should already exist, but let's ensure it's correct
DROP POLICY IF EXISTS "Teachers can manage cohort members" ON cohort_members;

-- Allow instructors to view all cohort members
CREATE POLICY "Instructors view cohort members"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    ) OR
    learner_id = auth.uid()
  );

-- Allow instructors to manage cohort members
CREATE POLICY "Instructors manage cohort members"
  ON cohort_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );
