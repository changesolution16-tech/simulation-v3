-- ============================================================================
-- Fix Profile Table UUID Default
-- ============================================================================
-- This SQL script updates the profiles table to automatically generate UUIDs
-- for the id column using gen_random_uuid() as the default value.
--
-- Run this script in your database to fix the issue where user creation
-- fails because no id is provided in the INSERT statement.
-- ============================================================================

-- Step 1: Enable the pgcrypto extension (if not already enabled)
-- This extension provides the gen_random_uuid() function
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Alter the profiles table to add UUID default generation
-- This will automatically generate a UUID for new rows when no id is provided
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 3: Verify the change
-- You should see 'gen_random_uuid()' as the column default
SELECT
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'id';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- The profiles table id column will now automatically generate UUIDs
-- when you create new users without specifying an id.
-- ============================================================================
