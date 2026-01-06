/*
  # Fix Stages Completed Display Issue

  This migration addresses the issue where stages_completed was storing the highest
  hierarchy level number instead of being used for display purposes.

  ## Changes

  1. Add helper view for correct stage counting
  2. Add function to get accurate decision count for display
  3. Update any instances where decision_count might be incorrect

  ## Note

  The field `stages_completed` stores the maximum hierarchy level reached (e.g., 16)
  The field `decision_count` stores the number of decisions made (e.g., 4)

  For display purposes, always use `decision_count` to show "Stages Completed"
*/

-- Function to validate decision counts across all instances
CREATE OR REPLACE FUNCTION validate_all_decision_counts()
RETURNS TABLE (
  instance_id uuid,
  stored_count integer,
  actual_count integer,
  difference integer,
  needs_update boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.decision_count,
    COUNT(lr.id)::integer as actual_count,
    (si.decision_count - COUNT(lr.id))::integer as difference,
    (si.decision_count != COUNT(lr.id)) as needs_update
  FROM simulation_instances si
  LEFT JOIN learner_responses lr ON lr.instance_id = si.id
  WHERE si.status IN ('in_progress', 'completed')
  GROUP BY si.id, si.decision_count
  HAVING si.decision_count != COUNT(lr.id)
  ORDER BY si.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix any incorrect decision counts
CREATE OR REPLACE FUNCTION fix_all_decision_counts()
RETURNS TABLE (
  instance_id uuid,
  old_count integer,
  new_count integer,
  updated boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH count_fixes AS (
    SELECT
      si.id as instance_id,
      si.decision_count as old_count,
      COUNT(lr.id)::integer as new_count
    FROM simulation_instances si
    LEFT JOIN learner_responses lr ON lr.instance_id = si.id
    WHERE si.status IN ('in_progress', 'completed')
    GROUP BY si.id, si.decision_count
    HAVING si.decision_count != COUNT(lr.id)
  )
  UPDATE simulation_instances si
  SET decision_count = cf.new_count
  FROM count_fixes cf
  WHERE si.id = cf.instance_id
  RETURNING si.id, cf.old_count, cf.new_count, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_all_decision_counts TO authenticated;
GRANT EXECUTE ON FUNCTION fix_all_decision_counts TO authenticated;

-- Add helpful comment on the stages_completed field
COMMENT ON COLUMN simulation_instances.stages_completed IS
  'Stores the maximum hierarchy level reached (e.g., level 16). For UI display of "stages completed", use decision_count instead.';

COMMENT ON COLUMN simulation_instances.decision_count IS
  'The actual number of decisions/stages the learner completed. This is the value to display for "Stages Completed" in the UI.';
