/*
  # Fix Scenario Branch Sync Functions Search Path Issue

  ## Problem
  Multiple functions have `SET search_path TO ''` which prevents them from being
  callable within triggers. This causes "function does not exist" errors when saving scenarios.

  ## Solution
  Recreate all scenario branch sync functions with proper search_path settings and
  explicit schema qualification.

  ## Changes
  1. Recreate sync_scenario_branches_for_scenario function
  2. Recreate sync_scenario_branches function
  3. Recreate trigger_sync_scenario_branches function
  4. Grant proper permissions
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS public.sync_scenario_branches_for_scenario(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sync_scenario_branches() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_sync_scenario_branches() CASCADE;

-- Recreate sync_scenario_branches_for_scenario with proper search path
CREATE OR REPLACE FUNCTION public.sync_scenario_branches_for_scenario(p_scenario_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete orphaned branches for this scenario
  DELETE FROM public.scenario_branches sb
  WHERE sb.from_scenario_id = p_scenario_id
  AND NOT EXISTS (
    SELECT 1 FROM public.scenario_options so
    WHERE so.id::text = sb.option_id
    AND so.scenario_id = sb.from_scenario_id
  );

  -- Insert or update branches based on current options
  INSERT INTO public.scenario_branches (
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
  FROM public.scenario_options so
  WHERE so.scenario_id = p_scenario_id
  AND so.next_scenario_id IS NOT NULL
  ON CONFLICT (from_scenario_id, option_id)
  DO UPDATE SET
    to_scenario_id = EXCLUDED.to_scenario_id,
    branch_order = EXCLUDED.branch_order,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate sync_scenario_branches for all scenarios
CREATE OR REPLACE FUNCTION public.sync_scenario_branches()
RETURNS void AS $$
BEGIN
  -- Delete all orphaned branches
  DELETE FROM public.scenario_branches sb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.scenario_options so
    WHERE so.id::text = sb.option_id
    AND so.scenario_id = sb.from_scenario_id
  );

  -- Insert or update all branches based on current options
  INSERT INTO public.scenario_branches (
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
  FROM public.scenario_options so
  WHERE so.next_scenario_id IS NOT NULL
  ON CONFLICT (from_scenario_id, option_id)
  DO UPDATE SET
    to_scenario_id = EXCLUDED.to_scenario_id,
    branch_order = EXCLUDED.branch_order,
    updated_at = now();

  RAISE NOTICE 'Scenario branches synchronized successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger function with explicit schema qualification
CREATE OR REPLACE FUNCTION public.trigger_sync_scenario_branches()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Delete the corresponding branch
    DELETE FROM public.scenario_branches
    WHERE option_id = OLD.id::text
    AND from_scenario_id = OLD.scenario_id;
    RETURN OLD;
  ELSE
    -- Sync branches for the affected scenario
    PERFORM public.sync_scenario_branches_for_scenario(NEW.scenario_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_scenario_branches_for_scenario(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scenario_branches_for_scenario(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_scenario_branches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scenario_branches() TO service_role;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_branches_on_option_change ON public.scenario_options;
CREATE TRIGGER sync_branches_on_option_change
  AFTER INSERT OR UPDATE OR DELETE ON public.scenario_options
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_scenario_branches();

-- Add helpful comments
COMMENT ON FUNCTION public.sync_scenario_branches_for_scenario(uuid) IS 
  'Synchronizes scenario branches for a specific scenario based on its options';

COMMENT ON FUNCTION public.sync_scenario_branches() IS 
  'Synchronizes all scenario branches based on current scenario options';

COMMENT ON FUNCTION public.trigger_sync_scenario_branches() IS 
  'Trigger function to automatically sync scenario branches when options change';
