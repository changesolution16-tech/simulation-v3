/*
  # Add Connection Diagnosis Tools for Simulations

  This migration adds helper functions to diagnose and visualize
  scenario connection issues within simulations.

  ## New Functions

  1. diagnose_simulation_connections - Check for broken connections in a simulation
  2. get_simulation_connection_map - Get a complete connection map for visualization
  3. find_disconnected_scenarios - Find scenarios that are unreachable or dead-ends
*/

-- Function to diagnose connection issues in a specific simulation
CREATE OR REPLACE FUNCTION diagnose_simulation_connections(p_simulation_id uuid)
RETURNS TABLE (
  issue_type text,
  scenario_id uuid,
  scenario_title text,
  details text,
  severity text
) AS $$
BEGIN
  -- Check for scenarios in simulation with options that have no next_scenario_id
  RETURN QUERY
  SELECT
    'missing_connections'::text,
    s.id,
    s.title,
    'Has ' || COUNT(so.id) || ' option(s) with no next scenario configured' as details,
    'high'::text as severity
  FROM simulation_scenarios ss
  JOIN scenarios s ON ss.scenario_id = s.id
  JOIN scenario_options so ON s.id = so.scenario_id
  WHERE ss.simulation_id = p_simulation_id
  AND so.next_scenario_id IS NULL
  AND s.is_end_scenario = false
  GROUP BY s.id, s.title
  HAVING COUNT(so.id) > 0;

  -- Check for options pointing to scenarios not in the simulation
  RETURN QUERY
  SELECT
    'external_connection'::text,
    s.id,
    s.title,
    'Points to scenario "' || next_s.title || '" which is not in this simulation' as details,
    'critical'::text as severity
  FROM simulation_scenarios ss
  JOIN scenarios s ON ss.scenario_id = s.id
  JOIN scenario_options so ON s.id = so.scenario_id
  JOIN scenarios next_s ON so.next_scenario_id = next_s.id
  WHERE ss.simulation_id = p_simulation_id
  AND so.next_scenario_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM simulation_scenarios ss2
    WHERE ss2.simulation_id = p_simulation_id
    AND ss2.scenario_id = so.next_scenario_id
  );

  -- Check for scenarios with no incoming connections (except entry point)
  RETURN QUERY
  SELECT
    'unreachable_scenario'::text,
    s.id,
    s.title,
    'No scenarios in this simulation link to this one' as details,
    'medium'::text as severity
  FROM simulation_scenarios ss
  JOIN scenarios s ON ss.scenario_id = s.id
  WHERE ss.simulation_id = p_simulation_id
  AND ss.is_entry_point = false
  AND NOT EXISTS (
    SELECT 1
    FROM simulation_scenarios ss_other
    JOIN scenario_options so ON ss_other.scenario_id = so.scenario_id
    WHERE ss_other.simulation_id = p_simulation_id
    AND so.next_scenario_id = s.id
  );

END;
$$ LANGUAGE plpgsql;

-- Function to get complete connection map for a simulation
CREATE OR REPLACE FUNCTION get_simulation_connection_map(p_simulation_id uuid)
RETURNS TABLE (
  from_scenario_id uuid,
  from_scenario_title text,
  option_text text,
  to_scenario_id uuid,
  to_scenario_title text,
  is_in_simulation boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as from_scenario_id,
    s.title as from_scenario_title,
    so.option_text,
    so.next_scenario_id as to_scenario_id,
    next_s.title as to_scenario_title,
    EXISTS (
      SELECT 1 FROM simulation_scenarios ss
      WHERE ss.simulation_id = p_simulation_id
      AND ss.scenario_id = so.next_scenario_id
    ) as is_in_simulation
  FROM simulation_scenarios ss
  JOIN scenarios s ON ss.scenario_id = s.id
  JOIN scenario_options so ON s.id = so.scenario_id
  LEFT JOIN scenarios next_s ON so.next_scenario_id = next_s.id
  WHERE ss.simulation_id = p_simulation_id
  AND so.next_scenario_id IS NOT NULL
  ORDER BY s.title, so.option_order;
END;
$$ LANGUAGE plpgsql;

-- Function to find all disconnected scenarios in a simulation
CREATE OR REPLACE FUNCTION find_disconnected_scenarios(p_simulation_id uuid)
RETURNS TABLE (
  scenario_id uuid,
  scenario_title text,
  is_entry_point boolean,
  has_outgoing_connections boolean,
  has_incoming_connections boolean,
  is_marked_as_end boolean,
  issue_description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    ss.is_entry_point,
    EXISTS (
      SELECT 1 FROM scenario_options so
      WHERE so.scenario_id = s.id
      AND so.next_scenario_id IS NOT NULL
    ) as has_outgoing,
    EXISTS (
      SELECT 1
      FROM simulation_scenarios ss_other
      JOIN scenario_options so ON ss_other.scenario_id = so.scenario_id
      WHERE ss_other.simulation_id = p_simulation_id
      AND so.next_scenario_id = s.id
    ) as has_incoming,
    s.is_end_scenario,
    CASE
      WHEN ss.is_entry_point AND NOT EXISTS (
        SELECT 1 FROM scenario_options so
        WHERE so.scenario_id = s.id
        AND so.next_scenario_id IS NOT NULL
      ) AND NOT s.is_end_scenario THEN 'Entry point with no outgoing connections (dead end)'
      WHEN NOT ss.is_entry_point AND NOT EXISTS (
        SELECT 1
        FROM simulation_scenarios ss_other
        JOIN scenario_options so ON ss_other.scenario_id = so.scenario_id
        WHERE ss_other.simulation_id = p_simulation_id
        AND so.next_scenario_id = s.id
      ) THEN 'Unreachable - no incoming connections'
      WHEN NOT s.is_end_scenario AND NOT EXISTS (
        SELECT 1 FROM scenario_options so
        WHERE so.scenario_id = s.id
        AND so.next_scenario_id IS NOT NULL
      ) THEN 'Dead end - no outgoing connections'
      ELSE 'Properly connected'
    END as issue
  FROM simulation_scenarios ss
  JOIN scenarios s ON ss.scenario_id = s.id
  WHERE ss.simulation_id = p_simulation_id
  ORDER BY
    CASE
      WHEN ss.is_entry_point THEN 0
      ELSE 1
    END,
    s.title;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION diagnose_simulation_connections(uuid) IS
  'Diagnoses connection issues in a simulation and returns actionable problems';

COMMENT ON FUNCTION get_simulation_connection_map(uuid) IS
  'Returns complete connection map for visualization in admin panel';

COMMENT ON FUNCTION find_disconnected_scenarios(uuid) IS
  'Finds scenarios with connection issues: unreachable, dead-ends, or broken links';
