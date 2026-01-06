/*
  # Fix get_scenario_targeted_competencies Function

  1. Problem
    - Function has empty search_path which prevents it from finding tables
    - This causes "relation does not exist" errors

  2. Solution
    - Use fully qualified table names (public.table_name)
    - Keep SECURITY DEFINER for proper permissions

  3. Changes
    - Updated function to use public.scenario_targeted_competencies
    - Updated function to use public.competencies
*/

CREATE OR REPLACE FUNCTION public.get_scenario_targeted_competencies(p_scenario_id uuid)
RETURNS TABLE (
  id uuid,
  scenario_id uuid,
  competency_id uuid,
  competency_code text,
  competency_name text,
  competency_description text,
  competency_level integer,
  target_weight numeric,
  is_primary boolean,
  development_priority text,
  notes text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    stc.id,
    stc.scenario_id,
    stc.competency_id,
    c.code as competency_code,
    c.name as competency_name,
    c.description as competency_description,
    c.competency_level,
    stc.target_weight,
    stc.is_primary,
    stc.development_priority,
    stc.notes
  FROM public.scenario_targeted_competencies stc
  JOIN public.competencies c ON c.id = stc.competency_id
  WHERE stc.scenario_id = p_scenario_id
  ORDER BY 
    stc.is_primary DESC,
    stc.development_priority,
    c.name;
END;
$$;
