/*
  Test Script: Verify Scenario Creation Works After Foreign Key Fix

  Run this after applying fix-simulation-scenarios-foreign-key.sql
  to verify the issue is resolved.
*/

-- Test 1: Verify foreign key constraint is removed
SELECT
  '✓ Test 1: Check if foreign key constraint exists' as test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS - Foreign key constraint removed'
    ELSE '❌ FAIL - Foreign key constraint still exists'
  END as result
FROM information_schema.table_constraints
WHERE table_name = 'simulation_scenarios'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%scenario_id%';

-- Test 2: Verify scenario_id is nullable
SELECT
  '✓ Test 2: Check if scenario_id is nullable' as test,
  CASE
    WHEN is_nullable = 'YES' THEN '✅ PASS - scenario_id is nullable'
    WHEN is_nullable = 'NO' THEN '❌ FAIL - scenario_id is NOT NULL'
    ELSE '⚠️  WARNING - scenario_id column does not exist'
  END as result
FROM information_schema.columns
WHERE table_name = 'simulation_scenarios'
  AND column_name = 'scenario_id';

-- Test 3: Try a test insert (will rollback)
BEGIN;

-- First, get or create a test simulation
INSERT INTO simulations (
  id,
  title,
  description,
  difficulty,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Simulation',
  'Test only',
  'beginner',
  'draft'
) ON CONFLICT (id) DO NOTHING;

-- Try to insert a test scenario
INSERT INTO simulation_scenarios (
  simulation_id,
  scenario_name,
  question_text,
  hierarchy_level
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Scenario',
  'This is a test question',
  1
);

-- If we got here, the insert worked!
SELECT
  '✓ Test 3: Test scenario creation' as test,
  '✅ PASS - Scenario can be created without foreign key error' as result;

-- Rollback the test data
ROLLBACK;

-- Final Summary
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '📊 TEST RESULTS SUMMARY' as title;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

-- Count passing tests
WITH test_results AS (
  SELECT
    COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'simulation_scenarios'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%scenario_id%'
      )
    ) as test1_pass,
    COUNT(*) FILTER (
      WHERE is_nullable = 'YES'
    ) as test2_pass
  FROM information_schema.columns
  WHERE table_name = 'simulation_scenarios'
    AND column_name = 'scenario_id'
)
SELECT
  CASE
    WHEN test1_pass = 1 AND test2_pass = 1
      THEN '✅ ALL TESTS PASSED - Foreign key fix successful!'
    WHEN test1_pass = 1 AND test2_pass = 0
      THEN '⚠️  PARTIAL - Foreign key removed but scenario_id not nullable'
    WHEN test1_pass = 0 AND test2_pass = 1
      THEN '❌ FAILED - Foreign key constraint still exists'
    ELSE '❌ FAILED - Multiple issues detected'
  END as overall_result
FROM test_results;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

-- Show current schema of simulation_scenarios (for reference)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'simulation_scenarios'
  AND column_name IN ('id', 'simulation_id', 'scenario_id', 'scenario_name')
ORDER BY ordinal_position;
