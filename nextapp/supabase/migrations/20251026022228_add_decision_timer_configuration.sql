/*
  # Add Decision Timer Configuration to Scenarios

  1. Schema Changes
    - Add timer configuration fields to `scenarios` table
      - `timer_enabled` (boolean) - Whether decision time tracking is enabled
      - `timer_visible` (boolean) - Whether timer is visible to learners
      - `timer_display_location` (text) - Where to display timer: 'hidden', 'question_page', 'feedback_page', 'results_page', 'all'
      - `timer_type` (text) - Type of timer: 'count_up', 'countdown', 'none'
      - `timer_limit_seconds` (integer) - Time limit for countdown timers (optional)
      - `show_timer_in_feedback` (boolean) - Whether to show decision time in feedback
      - `timer_warning_threshold_seconds` (integer) - Seconds remaining to show warning for countdown
    
    - Add decision time tracking to `learner_responses` table
      - Already has `time_to_decision_seconds` field - ensure it's being used properly

  2. Notes
    - These fields provide flexible configuration for scenario creators
    - Decision time is always tracked for analytics, regardless of visibility settings
    - Timer display can be customized per scenario based on pedagogical goals
    - Countdown timers can add time pressure for high-stakes decision scenarios
*/

-- Add timer configuration columns to scenarios table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_enabled'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_visible'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_visible boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_display_location'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_display_location text DEFAULT 'hidden'
      CHECK (timer_display_location IN ('hidden', 'question_page', 'feedback_page', 'results_page', 'all'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_type'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_type text DEFAULT 'count_up'
      CHECK (timer_type IN ('count_up', 'countdown', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_limit_seconds'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_limit_seconds integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'show_timer_in_feedback'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN show_timer_in_feedback boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'timer_warning_threshold_seconds'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN timer_warning_threshold_seconds integer DEFAULT 30;
  END IF;
END $$;

-- Add index for scenarios with timer enabled for faster queries
CREATE INDEX IF NOT EXISTS idx_scenarios_timer_enabled ON scenarios(timer_enabled) WHERE timer_enabled = true;

-- Add index for learner responses time_to_decision for analytics queries
CREATE INDEX IF NOT EXISTS idx_learner_responses_decision_time ON learner_responses(time_to_decision_seconds);
CREATE INDEX IF NOT EXISTS idx_learner_responses_scenario_time ON learner_responses(scenario_id, time_to_decision_seconds);