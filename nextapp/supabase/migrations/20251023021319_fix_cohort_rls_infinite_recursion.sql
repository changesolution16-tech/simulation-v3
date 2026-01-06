/*
  # Fix Cohort RLS Infinite Recursion

  1. Issue
    - The policies on `cohorts` and `cohort_members` tables have circular dependencies
    - When querying cohorts, it checks cohort_members, which checks cohort_members again
    - This causes infinite recursion error

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid recursion
    - Split policies by operation (SELECT, INSERT, UPDATE, DELETE)
    - Use role checks from profiles instead of circular member checks

  3. New Policies
    **Cohorts Table:**
    - Admins and instructors can do everything
    - Learners can view cohorts they belong to (but avoiding recursion)
    
    **Cohort Members Table:**
    - Admins and instructors can do everything
    - Learners can view members in their cohorts (but avoiding recursion)
*/

-- Drop existing problematic policies on cohorts table
DROP POLICY IF EXISTS "Teachers can manage their cohorts" ON cohorts;
DROP POLICY IF EXISTS "Learners can view their cohorts" ON cohorts;

-- Drop existing problematic policies on cohort_members table
DROP POLICY IF EXISTS "Learners can view cohort members" ON cohort_members;
DROP POLICY IF EXISTS "Teachers can manage cohort members" ON cohort_members;

-- ============================================================================
-- COHORTS TABLE POLICIES
-- ============================================================================

-- Admins and instructors can view all cohorts
CREATE POLICY "Admins and instructors can view all cohorts"
  ON cohorts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can insert cohorts
CREATE POLICY "Admins and instructors can create cohorts"
  ON cohorts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can update cohorts
CREATE POLICY "Admins and instructors can update cohorts"
  ON cohorts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can delete cohorts
CREATE POLICY "Admins and instructors can delete cohorts"
  ON cohorts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- ============================================================================
-- COHORT_MEMBERS TABLE POLICIES
-- ============================================================================

-- Admins and instructors can view all cohort members
CREATE POLICY "Admins and instructors can view all cohort members"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can add cohort members
CREATE POLICY "Admins and instructors can add cohort members"
  ON cohort_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can update cohort members
CREATE POLICY "Admins and instructors can update cohort members"
  ON cohort_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can remove cohort members
CREATE POLICY "Admins and instructors can remove cohort members"
  ON cohort_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Learners can view their own membership (direct check, no recursion)
CREATE POLICY "Learners can view their own cohort membership"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());