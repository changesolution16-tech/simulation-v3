/*
  # Fix Infinite Recursion in Training Assignments RLS Policies

  ## Summary
  This migration fixes the infinite recursion error in training_assignments RLS policies
  by removing recursive policy checks that reference the same table.

  ## Problem
  The previous policies were checking the training_assignments table within the policies
  themselves, causing infinite recursion during INSERT operations.

  ## Solution
  Simplify policies to directly check user role and ownership without recursive lookups.

  ## Changes Made
  1. Drop all existing policies on training_assignments
  2. Create simplified, non-recursive policies
  3. Use direct auth.uid() and role checks from profiles table
  4. Avoid any subqueries that reference training_assignments within its own policies
*/

-- ============================================================================
-- Drop all existing policies on training_assignments
-- ============================================================================

DROP POLICY IF EXISTS "Instructors can view own assignments" ON training_assignments;
DROP POLICY IF EXISTS "Instructors can create assignments" ON training_assignments;
DROP POLICY IF EXISTS "Instructors can update own assignments" ON training_assignments;
DROP POLICY IF EXISTS "Instructors can delete own assignments" ON training_assignments;
DROP POLICY IF EXISTS "Learners can view assigned assignments" ON training_assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments" ON training_assignments;
DROP POLICY IF EXISTS "Learners can view their assignments" ON training_assignments;

-- ============================================================================
-- Create simplified, non-recursive policies
-- ============================================================================

-- Allow authenticated users with instructor/admin role to SELECT all assignments
-- or users can see assignments where they are the creator
CREATE POLICY "View assignments"
  ON training_assignments FOR SELECT
  TO authenticated
  USING (
    -- User is the creator
    created_by = auth.uid()
    OR
    -- User is admin or instructor (check role directly)
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
    OR
    -- User is a learner assigned to this assignment
    auth.uid() IN (
      SELECT learner_id FROM assignment_learners 
      WHERE assignment_id = training_assignments.id
    )
  );

-- Allow instructors and admins to INSERT assignments
-- They must set created_by to their own user ID
CREATE POLICY "Create assignments"
  ON training_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
  );

-- Allow users to UPDATE their own assignments
-- Admins can update all assignments
CREATE POLICY "Update assignments"
  ON training_assignments FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
  )
  WITH CHECK (
    created_by = auth.uid()
    OR
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- Allow users to DELETE their own assignments
-- Admins can delete all assignments
CREATE POLICY "Delete assignments"
  ON training_assignments FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- ============================================================================
-- Update assignment_learners policies to avoid recursion
-- ============================================================================

DROP POLICY IF EXISTS "Learners view own status" ON assignment_learners;
DROP POLICY IF EXISTS "Instructors view assignment learners" ON assignment_learners;
DROP POLICY IF EXISTS "Instructors create assignment learners" ON assignment_learners;
DROP POLICY IF EXISTS "Learners update own status" ON assignment_learners;
DROP POLICY IF EXISTS "Instructors update assignment learners" ON assignment_learners;
DROP POLICY IF EXISTS "Instructors delete assignment learners" ON assignment_learners;
DROP POLICY IF EXISTS "Learners can view own assignment status" ON assignment_learners;
DROP POLICY IF EXISTS "Learners can update own assignment status" ON assignment_learners;
DROP POLICY IF EXISTS "Teachers can manage assignment learners" ON assignment_learners;

-- Simplified assignment_learners policies
CREATE POLICY "View assignment learners"
  ON assignment_learners FOR SELECT
  TO authenticated
  USING (
    -- User is the learner
    learner_id = auth.uid()
    OR
    -- User is admin or instructor
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
  );

CREATE POLICY "Create assignment learners"
  ON assignment_learners FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only admins and instructors can create assignment learners
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
  );

CREATE POLICY "Update assignment learners"
  ON assignment_learners FOR UPDATE
  TO authenticated
  USING (
    -- Learner can update their own status
    learner_id = auth.uid()
    OR
    -- Instructors and admins can update
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
  )
  WITH CHECK (
    learner_id = auth.uid()
    OR
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
  );

CREATE POLICY "Delete assignment learners"
  ON assignment_learners FOR DELETE
  TO authenticated
  USING (
    -- Only admins and instructors can delete
    (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('admin', 'instructor')
  );
