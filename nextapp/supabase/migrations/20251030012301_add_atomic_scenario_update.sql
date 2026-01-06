/*
  # Add Atomic Scenario Update Function

  This migration adds a stored procedure that atomically updates a scenario
  and its options, preventing connection loss during updates.

  ## New Functions

  1. atomic_update_scenario_with_options - Update scenario and options in a single transaction
  2. get_scenario_connection_status - Get real-time connection status for validation

  ## Benefits

  - Prevents connection loss during save operations
  - Ensures data consistency through transactions
  - Provides validation feedback
  - Reduces race conditions
*/

-- Function to atomically update a scenario with its options
CREATE OR REPLACE FUNCTION atomic_update_scenario_with_options(
  p_scenario_id uuid,
  p_title text,
  p_description text,
  p_topic_id uuid,
  p_difficulty text,
  p_is_end_scenario boolean,
  p_position_x numeric,
  p_position_y numeric,
  p_content_status text,
  p_options jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_option jsonb;
  v_option_id uuid;
  v_existing_options uuid[];
  v_options_to_delete uuid[];
  v_result jsonb;
  v_connections_before int;
  v_connections_after int;
BEGIN
  -- Start transaction (implicit in function)

  -- Count connections before
  SELECT count(*) INTO v_connections_before
  FROM scenario_options
  WHERE scenario_id = p_scenario_id
  AND next_scenario_id IS NOT NULL;

  -- Update the scenario
  UPDATE scenarios SET
    title = p_title,
    description = p_description,
    topic_id = p_topic_id,
    difficulty = p_difficulty,
    is_end_scenario = p_is_end_scenario,
    position_x = p_position_x,
    position_y = p_position_y,
    content_status = p_content_status,
    updated_at = now()
  WHERE id = p_scenario_id;

  -- Get existing option IDs
  SELECT array_agg(id) INTO v_existing_options
  FROM scenario_options
  WHERE scenario_id = p_scenario_id;

  -- Determine which options to delete (those not in p_options)
  v_options_to_delete := ARRAY(
    SELECT unnest(v_existing_options)
    EXCEPT
    SELECT (opt->>'id')::uuid
    FROM jsonb_array_elements(p_options) AS opt
  );

  -- Delete removed options
  IF array_length(v_options_to_delete, 1) > 0 THEN
    DELETE FROM scenario_options
    WHERE id = ANY(v_options_to_delete);
  END IF;

  -- Upsert all options
  FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    v_option_id := (v_option->>'id')::uuid;

    INSERT INTO scenario_options (
      id,
      scenario_id,
      option_text,
      option_order,
      next_scenario_id,
      feedback_beginner,
      feedback_intermediate,
      feedback_advanced,
      skill_impacts
    ) VALUES (
      v_option_id,
      p_scenario_id,
      v_option->>'option_text',
      (v_option->>'option_order')::integer,
      (v_option->>'next_scenario_id')::uuid,
      v_option->>'feedback_beginner',
      v_option->>'feedback_intermediate',
      v_option->>'feedback_advanced',
      COALESCE((v_option->>'skill_impacts')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT (id) DO UPDATE SET
      option_text = EXCLUDED.option_text,
      option_order = EXCLUDED.option_order,
      next_scenario_id = EXCLUDED.next_scenario_id,
      feedback_beginner = EXCLUDED.feedback_beginner,
      feedback_intermediate = EXCLUDED.feedback_intermediate,
      feedback_advanced = EXCLUDED.feedback_advanced,
      skill_impacts = EXCLUDED.skill_impacts,
      updated_at = now();
  END LOOP;

  -- Sync branches
  PERFORM sync_scenario_branches_for_scenario(p_scenario_id);

  -- Count connections after
  SELECT count(*) INTO v_connections_after
  FROM scenario_options
  WHERE scenario_id = p_scenario_id
  AND next_scenario_id IS NOT NULL;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'scenario_id', p_scenario_id,
    'connections_before', v_connections_before,
    'connections_after', v_connections_after,
    'options_deleted', coalesce(array_length(v_options_to_delete, 1), 0),
    'options_updated', jsonb_array_length(p_options)
  );

  RAISE NOTICE 'Scenario updated atomically: %', v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get real-time connection status
CREATE OR REPLACE FUNCTION get_scenario_connection_status(p_scenario_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'scenario_id', p_scenario_id,
    'total_options', count(*),
    'connected_options', count(*) FILTER (WHERE next_scenario_id IS NOT NULL),
    'connections', jsonb_agg(
      jsonb_build_object(
        'option_id', id,
        'option_text', option_text,
        'next_scenario_id', next_scenario_id,
        'has_connection', next_scenario_id IS NOT NULL
      ) ORDER BY option_order
    )
  ) INTO v_result
  FROM scenario_options
  WHERE scenario_id = p_scenario_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to verify connection integrity after save
CREATE OR REPLACE FUNCTION verify_scenario_connections_integrity(p_scenario_id uuid)
RETURNS TABLE (
  is_valid boolean,
  total_options integer,
  options_with_connections integer,
  orphaned_connections integer,
  issues jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH option_stats AS (
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE so.next_scenario_id IS NOT NULL) as connected,
      count(*) FILTER (
        WHERE so.next_scenario_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM scenarios s
          WHERE s.id = so.next_scenario_id
        )
      ) as orphaned
    FROM scenario_options so
    WHERE so.scenario_id = p_scenario_id
  ),
  branch_stats AS (
    SELECT
      count(*) as branch_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM scenario_options so
          WHERE so.id::text = sb.option_id
          AND so.scenario_id = sb.from_scenario_id
        )
      ) as orphaned_branches
    FROM scenario_branches sb
    WHERE sb.from_scenario_id = p_scenario_id
  )
  SELECT
    (os.orphaned = 0 AND bs.orphaned_branches = 0) as is_valid,
    os.total::integer,
    os.connected::integer,
    os.orphaned::integer,
    jsonb_build_object(
      'orphaned_connections', os.orphaned,
      'orphaned_branches', bs.orphaned_branches,
      'branch_count', bs.branch_count,
      'options_count', os.total
    ) as issues
  FROM option_stats os, branch_stats bs;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION atomic_update_scenario_with_options TO authenticated;
GRANT EXECUTE ON FUNCTION get_scenario_connection_status TO authenticated;
GRANT EXECUTE ON FUNCTION verify_scenario_connections_integrity TO authenticated;

-- Add comments
COMMENT ON FUNCTION atomic_update_scenario_with_options IS
  'Atomically updates a scenario and all its options in a single transaction, preventing connection loss';

COMMENT ON FUNCTION get_scenario_connection_status IS
  'Returns detailed connection status for a scenario including all option connections';

COMMENT ON FUNCTION verify_scenario_connections_integrity IS
  'Verifies the integrity of scenario connections and returns any issues found';
