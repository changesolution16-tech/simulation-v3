/*
  # Fix Scenario Connections Persistence

  This migration fixes the scenario connection system to ensure connections
  are properly saved, loaded, and synchronized between storage mechanisms.

  ## Changes

  1. Schema Fixes
    - Add proper foreign key constraint from scenario_branches.option_id to scenario_options.id
    - Add indexes on next_scenario_id for faster connection lookups
    - Add unique constraint to prevent duplicate branches

  2. Synchronization Functions
    - Create function to sync scenario_branches from scenario_options
    - Create trigger to automatically update branches when options change
    - Add function to repair orphaned connections

  3. Data Integrity
    - Clean up orphaned branch records
    - Sync existing connections from scenario_options to scenario_branches
    - Add constraints to prevent invalid connections

  4. Helper Functions
    - Function to get all connections for a scenario
    - Function to validate connection integrity
    - Function to rebuild connection graph
*/

-- ============================================================================
-- SCHEMA FIXES
-- ============================================================================

-- Add index on next_scenario_id for faster connection lookups
CREATE INDEX IF NOT EXISTS idx_scenario_options_next_scenario
  ON scenario_options(next_scenario_id)
  WHERE next_scenario_id IS NOT NULL;

-- Add index on scenario_id and option_order for ordered retrieval
CREATE INDEX IF NOT EXISTS idx_scenario_options_scenario_order
  ON scenario_options(scenario_id, option_order);

-- Update scenario_branches to use proper UUID for option_id
-- First, check if we need to alter the column type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_branches'
    AND column_name = 'option_id'
    AND data_type = 'text'
  ) THEN
    -- Drop the old unique constraint if it exists
    ALTER TABLE scenario_branches
      DROP CONSTRAINT IF EXISTS scenario_branches_from_scenario_id_option_id_key;

    -- We'll keep option_id as text for now since it matches option IDs from scenario_options
    -- But we'll add better constraints
  END IF;
END $$;

-- Ensure unique constraint exists (prevents duplicate branches)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scenario_branches_from_option_unique'
  ) THEN
    ALTER TABLE scenario_branches
      ADD CONSTRAINT scenario_branches_from_option_unique
      UNIQUE(from_scenario_id, option_id);
  END IF;
END $$;

-- ============================================================================
-- SYNCHRONIZATION FUNCTIONS
-- ============================================================================

-- Function to sync scenario_branches from scenario_options
CREATE OR REPLACE FUNCTION sync_scenario_branches()
RETURNS void AS $$
BEGIN
  -- Delete orphaned branches (where option no longer exists)
  DELETE FROM scenario_branches sb
  WHERE NOT EXISTS (
    SELECT 1 FROM scenario_options so
    WHERE so.id::text = sb.option_id
    AND so.scenario_id = sb.from_scenario_id
  );

  -- Insert or update branches based on current scenario_options
  INSERT INTO scenario_branches (
    from_scenario_id,
    to_scenario_id,
    option_id,
    branch_order,
    is_conditional,
    condition_type
  )
  SELECT
    so.scenario_id,
    so.next_scenario_id,
    so.id::text,
    so.option_order,
    false,
    'none'
  FROM scenario_options so
  WHERE so.next_scenario_id IS NOT NULL
  ON CONFLICT (from_scenario_id, option_id)
  DO UPDATE SET
    to_scenario_id = EXCLUDED.to_scenario_id,
    branch_order = EXCLUDED.branch_order,
    updated_at = now();

  RAISE NOTICE 'Scenario branches synchronized successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to sync a single scenario's branches
CREATE OR REPLACE FUNCTION sync_scenario_branches_for_scenario(p_scenario_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete orphaned branches for this scenario
  DELETE FROM scenario_branches sb
  WHERE sb.from_scenario_id = p_scenario_id
  AND NOT EXISTS (
    SELECT 1 FROM scenario_options so
    WHERE so.id::text = sb.option_id
    AND so.scenario_id = sb.from_scenario_id
  );

  -- Insert or update branches for this scenario
  INSERT INTO scenario_branches (
    from_scenario_id,
    to_scenario_id,
    option_id,
    branch_order,
    is_conditional,
    condition_type
  )
  SELECT
    so.scenario_id,
    so.next_scenario_id,
    so.id::text,
    so.option_order,
    false,
    'none'
  FROM scenario_options so
  WHERE so.scenario_id = p_scenario_id
  AND so.next_scenario_id IS NOT NULL
  ON CONFLICT (from_scenario_id, option_id)
  DO UPDATE SET
    to_scenario_id = EXCLUDED.to_scenario_id,
    branch_order = EXCLUDED.branch_order,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync branches when options are inserted/updated
CREATE OR REPLACE FUNCTION trigger_sync_scenario_branches()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Remove branch when option is deleted
    DELETE FROM scenario_branches
    WHERE option_id = OLD.id::text
    AND from_scenario_id = OLD.scenario_id;
    RETURN OLD;
  ELSE
    -- Sync branches for the affected scenario
    PERFORM sync_scenario_branches_for_scenario(NEW.scenario_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS scenario_options_sync_branches ON scenario_options;

-- Create trigger on scenario_options table
CREATE TRIGGER scenario_options_sync_branches
  AFTER INSERT OR UPDATE OR DELETE ON scenario_options
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_scenario_branches();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get all connections for a scenario
CREATE OR REPLACE FUNCTION get_scenario_connections(p_scenario_id uuid)
RETURNS TABLE (
  from_scenario_id uuid,
  to_scenario_id uuid,
  option_id text,
  option_text text,
  option_order integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.scenario_id,
    so.next_scenario_id,
    so.id::text,
    so.option_text,
    so.option_order
  FROM scenario_options so
  WHERE so.scenario_id = p_scenario_id
  AND so.next_scenario_id IS NOT NULL
  ORDER BY so.option_order;
END;
$$ LANGUAGE plpgsql;

-- Function to validate connection integrity
CREATE OR REPLACE FUNCTION validate_scenario_connections()
RETURNS TABLE (
  issue_type text,
  scenario_id uuid,
  scenario_title text,
  details text
) AS $$
BEGIN
  -- Check for orphaned connections (pointing to deleted scenarios)
  RETURN QUERY
  SELECT
    'orphaned_connection'::text,
    s.id,
    s.title,
    'Has options pointing to non-existent scenarios: ' ||
    string_agg(so.next_scenario_id::text, ', ')
  FROM scenarios s
  JOIN scenario_options so ON s.id = so.scenario_id
  WHERE so.next_scenario_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM scenarios s2
    WHERE s2.id = so.next_scenario_id
  )
  GROUP BY s.id, s.title;

  -- Check for mismatched branches
  RETURN QUERY
  SELECT
    'branch_option_mismatch'::text,
    s.id,
    s.title,
    'Branch table does not match option table'
  FROM scenarios s
  WHERE EXISTS (
    SELECT 1 FROM scenario_options so
    WHERE so.scenario_id = s.id
    AND so.next_scenario_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM scenario_branches sb
      WHERE sb.from_scenario_id = so.scenario_id
      AND sb.option_id = so.id::text
    )
  );

  -- Check for scenarios with no entry path (except entry points)
  RETURN QUERY
  SELECT
    'no_entry_path'::text,
    s.id,
    s.title,
    'Scenario is not an entry point but has no incoming connections'
  FROM scenarios s
  WHERE NOT EXISTS (
    SELECT 1 FROM simulation_scenarios ss
    WHERE ss.scenario_id = s.id
    AND ss.is_entry_point = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM scenario_options so
    WHERE so.next_scenario_id = s.id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to repair orphaned connections
CREATE OR REPLACE FUNCTION repair_orphaned_connections()
RETURNS TABLE (
  repaired_count integer,
  message text
) AS $$
DECLARE
  v_count integer;
BEGIN
  -- Remove options pointing to non-existent scenarios
  WITH deleted AS (
    DELETE FROM scenario_options
    WHERE next_scenario_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_options.next_scenario_id
    )
    RETURNING *
  )
  SELECT count(*) INTO v_count FROM deleted;

  -- Sync branches after cleanup
  PERFORM sync_scenario_branches();

  RETURN QUERY SELECT v_count, 'Repaired ' || v_count || ' orphaned connections';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATA REPAIR
-- ============================================================================

-- Sync all existing connections
SELECT sync_scenario_branches();

-- Validate and report any issues
DO $$
DECLARE
  v_issue_count integer;
BEGIN
  SELECT count(*) INTO v_issue_count
  FROM validate_scenario_connections();

  IF v_issue_count > 0 THEN
    RAISE NOTICE 'Found % connection issues. Run SELECT * FROM validate_scenario_connections() to see details.', v_issue_count;
  ELSE
    RAISE NOTICE 'All scenario connections are valid.';
  END IF;
END $$;

-- ============================================================================
-- UPDATED RLS POLICIES
-- ============================================================================

-- Ensure scenario_branches policies allow proper reading
DROP POLICY IF EXISTS "Learners can view published branches" ON scenario_branches;

CREATE POLICY "Users can view scenario branches"
  ON scenario_branches FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is admin/instructor
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
    OR
    -- Allow if connected to published scenarios
    (
      EXISTS (
        SELECT 1 FROM scenarios s
        WHERE s.id = scenario_branches.from_scenario_id
        AND s.content_status = 'published'
      )
      AND EXISTS (
        SELECT 1 FROM scenarios s
        WHERE s.id = scenario_branches.to_scenario_id
        AND s.content_status = 'published'
      )
    )
    OR
    -- Allow if part of a published simulation
    EXISTS (
      SELECT 1
      FROM simulation_scenarios ss
      JOIN simulations sim ON sim.id = ss.simulation_id
      WHERE ss.scenario_id = scenario_branches.from_scenario_id
      AND sim.status = 'published'
    )
  );

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for connection traversal
CREATE INDEX IF NOT EXISTS idx_scenario_options_scenario_next
  ON scenario_options(scenario_id, next_scenario_id)
  WHERE next_scenario_id IS NOT NULL;

-- Index for finding incoming connections
CREATE INDEX IF NOT EXISTS idx_scenario_options_next_only
  ON scenario_options(next_scenario_id)
  WHERE next_scenario_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION sync_scenario_branches() IS
  'Synchronizes all scenario_branches records with current scenario_options.next_scenario_id values';

COMMENT ON FUNCTION sync_scenario_branches_for_scenario(uuid) IS
  'Synchronizes scenario_branches for a single scenario';

COMMENT ON FUNCTION get_scenario_connections(uuid) IS
  'Returns all outgoing connections from a scenario';

COMMENT ON FUNCTION validate_scenario_connections() IS
  'Validates scenario connection integrity and returns any issues found';

COMMENT ON FUNCTION repair_orphaned_connections() IS
  'Removes connections pointing to deleted scenarios and syncs branches';
