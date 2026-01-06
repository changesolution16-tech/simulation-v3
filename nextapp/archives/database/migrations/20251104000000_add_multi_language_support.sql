/*
  # Add Multi-Language Support for Simulations, Scenarios, and Categories

  This migration adds translation columns to support English and Spanish content
  for all user-facing text in simulations, scenarios, categories, and scenario options.

  ## Changes

  1. **simulations table**
    - Add `display_name_en`, `display_name_es` columns
    - Add `description_en`, `description_es` columns
    - Add `landing_title_en`, `landing_title_es` columns
    - Add `landing_description_en`, `landing_description_es` columns
    - Add `landing_role_description_en`, `landing_role_description_es` columns
    - Add `closing_title_en`, `closing_title_es` columns

  2. **simulation_categories table**
    - Add `name_en`, `name_es` columns
    - Add `description_en`, `description_es` columns

  3. **scenarios table**
    - Add `title_en`, `title_es` columns
    - Add `description_en`, `description_es` columns
    - Add `question_text_en`, `question_text_es` columns

  4. **scenario_options table**
    - Add `option_text_en`, `option_text_es` columns
    - Add `feedback_beginner_en`, `feedback_beginner_es` columns
    - Add `feedback_intermediate_en`, `feedback_intermediate_es` columns
    - Add `feedback_advanced_en`, `feedback_advanced_es` columns

  ## Migration Strategy

  - All new columns are nullable to avoid breaking existing data
  - Existing data in default columns (name, display_name, etc.) will be treated as English
  - Fallback logic in application will use default columns if language-specific columns are null
  - Future updates can populate Spanish translations
*/

-- ============================================================
-- SIMULATIONS TABLE - Add translation columns
-- ============================================================

DO $$
BEGIN
  -- Display name translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'display_name_en'
  ) THEN
    ALTER TABLE simulations ADD COLUMN display_name_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'display_name_es'
  ) THEN
    ALTER TABLE simulations ADD COLUMN display_name_es text;
  END IF;

  -- Description translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE simulations ADD COLUMN description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'description_es'
  ) THEN
    ALTER TABLE simulations ADD COLUMN description_es text;
  END IF;

  -- Landing title translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_title_en'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_title_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_title_es'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_title_es text;
  END IF;

  -- Landing description translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_description_en'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_description_es'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_description_es text;
  END IF;

  -- Landing role description translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_role_description_en'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_role_description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'landing_role_description_es'
  ) THEN
    ALTER TABLE simulations ADD COLUMN landing_role_description_es text;
  END IF;

  -- Closing title translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'closing_title_en'
  ) THEN
    ALTER TABLE simulations ADD COLUMN closing_title_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulations' AND column_name = 'closing_title_es'
  ) THEN
    ALTER TABLE simulations ADD COLUMN closing_title_es text;
  END IF;
END $$;

-- ============================================================
-- SIMULATION_CATEGORIES TABLE - Add translation columns
-- ============================================================

DO $$
BEGIN
  -- Name translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_categories' AND column_name = 'name_en'
  ) THEN
    ALTER TABLE simulation_categories ADD COLUMN name_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_categories' AND column_name = 'name_es'
  ) THEN
    ALTER TABLE simulation_categories ADD COLUMN name_es text;
  END IF;

  -- Description translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_categories' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE simulation_categories ADD COLUMN description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulation_categories' AND column_name = 'description_es'
  ) THEN
    ALTER TABLE simulation_categories ADD COLUMN description_es text;
  END IF;
END $$;

-- ============================================================
-- SCENARIOS TABLE - Add translation columns
-- ============================================================

DO $$
BEGIN
  -- Title translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'title_en'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN title_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'title_es'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN title_es text;
  END IF;

  -- Description translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'description_es'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN description_es text;
  END IF;

  -- Question text translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'question_text_en'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN question_text_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'question_text_es'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN question_text_es text;
  END IF;
END $$;

-- ============================================================
-- SCENARIO_OPTIONS TABLE - Add translation columns
-- ============================================================

DO $$
BEGIN
  -- Option text translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'option_text_en'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN option_text_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'option_text_es'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN option_text_es text;
  END IF;

  -- Feedback beginner translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_beginner_en'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_beginner_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_beginner_es'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_beginner_es text;
  END IF;

  -- Feedback intermediate translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_intermediate_en'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_intermediate_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_intermediate_es'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_intermediate_es text;
  END IF;

  -- Feedback advanced translations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_advanced_en'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_advanced_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'feedback_advanced_es'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN feedback_advanced_es text;
  END IF;
END $$;

-- ============================================================
-- CREATE INDEXES for better query performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_simulations_display_name_en ON simulations(display_name_en);
CREATE INDEX IF NOT EXISTS idx_simulations_display_name_es ON simulations(display_name_es);
CREATE INDEX IF NOT EXISTS idx_simulation_categories_name_en ON simulation_categories(name_en);
CREATE INDEX IF NOT EXISTS idx_simulation_categories_name_es ON simulation_categories(name_es);
CREATE INDEX IF NOT EXISTS idx_scenarios_title_en ON scenarios(title_en);
CREATE INDEX IF NOT EXISTS idx_scenarios_title_es ON scenarios(title_es);

-- ============================================================
-- Add helpful comment
-- ============================================================

COMMENT ON COLUMN simulations.display_name_en IS 'English display name for the simulation';
COMMENT ON COLUMN simulations.display_name_es IS 'Spanish display name for the simulation';
COMMENT ON COLUMN simulation_categories.name_en IS 'English name for the category';
COMMENT ON COLUMN simulation_categories.name_es IS 'Spanish name for the category';
COMMENT ON COLUMN scenarios.title_en IS 'English title for the scenario';
COMMENT ON COLUMN scenarios.title_es IS 'Spanish title for the scenario';
