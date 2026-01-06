-- Fix column name mismatch and ensure proper session handling
-- The code uses stages_completed but the table has levels_completed

-- Add stages_completed as an alias column (computed from levels_completed)
DO $$
BEGIN
  -- Check if stages_completed column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances'
    AND column_name = 'stages_completed'
  ) THEN
    -- Add stages_completed as an alias for levels_completed
    ALTER TABLE simulation_instances
    ADD COLUMN stages_completed integer;
    
    -- Copy existing data
    UPDATE simulation_instances
    SET stages_completed = levels_completed;
    
    -- Set default
    ALTER TABLE simulation_instances
    ALTER COLUMN stages_completed SET DEFAULT 0;
  END IF;

  -- Check if last_activity_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances'
    AND column_name = 'last_activity_at'
  ) THEN
    -- Add last_activity_at for tracking
    ALTER TABLE simulation_instances
    ADD COLUMN last_activity_at timestamptz DEFAULT now();
    
    -- Initialize with started_at or created_at
    UPDATE simulation_instances
    SET last_activity_at = COALESCE(started_at, created_at, now());
  END IF;

  -- Check if max_stage column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances'
    AND column_name = 'max_stage'
  ) THEN
    -- Add max_stage column
    ALTER TABLE simulation_instances
    ADD COLUMN max_stage integer DEFAULT 0;
    
    -- Set to max_level if it exists
    UPDATE simulation_instances
    SET max_stage = COALESCE(max_level, 0);
  END IF;

  -- Check if current_scenario_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_instances'
    AND column_name = 'current_scenario_id'
  ) THEN
    -- Add current_scenario_id for resume functionality
    ALTER TABLE simulation_instances
    ADD COLUMN current_scenario_id uuid REFERENCES scenarios(id);
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_simulation_instances_learner_simulation
  ON simulation_instances(learner_id, simulation_id);

CREATE INDEX IF NOT EXISTS idx_simulation_instances_status
  ON simulation_instances(status, last_activity_at);

-- Add helpful comment
COMMENT ON COLUMN simulation_instances.stages_completed IS 
  'Number of stages/levels completed in this simulation instance';

COMMENT ON COLUMN simulation_instances.last_activity_at IS 
  'Timestamp of last interaction with this simulation instance';

COMMENT ON COLUMN simulation_instances.max_stage IS 
  'Maximum stage/level number in this simulation';

COMMENT ON COLUMN simulation_instances.current_scenario_id IS 
  'Current scenario ID for resume functionality';
