-- Add Multi-Language Support for Simulations, Scenarios, and Categories
-- This migration adds translation columns to support English and Spanish content

-- SIMULATIONS TABLE - Add translation columns
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS display_name_en text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS display_name_es text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS description_es text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS landing_title_en text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS landing_title_es text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS landing_description_en text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS landing_description_es text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS landing_role_description_en text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS landing_role_description_es text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS closing_title_en text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS closing_title_es text;

-- SIMULATION_CATEGORIES TABLE - Add translation columns
ALTER TABLE simulation_categories ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE simulation_categories ADD COLUMN IF NOT EXISTS name_es text;
ALTER TABLE simulation_categories ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE simulation_categories ADD COLUMN IF NOT EXISTS description_es text;

-- SCENARIOS TABLE - Add translation columns
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS title_es text;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS description_es text;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS question_text_en text;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS question_text_es text;

-- SCENARIO_OPTIONS TABLE - Add translation columns
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS option_text_en text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS option_text_es text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS feedback_beginner_en text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS feedback_beginner_es text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS feedback_intermediate_en text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS feedback_intermediate_es text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS feedback_advanced_en text;
ALTER TABLE scenario_options ADD COLUMN IF NOT EXISTS feedback_advanced_es text;

-- CREATE INDEXES for better query performance
CREATE INDEX IF NOT EXISTS idx_simulations_display_name_en ON simulations(display_name_en);
CREATE INDEX IF NOT EXISTS idx_simulations_display_name_es ON simulations(display_name_es);
CREATE INDEX IF NOT EXISTS idx_simulation_categories_name_en ON simulation_categories(name_en);
CREATE INDEX IF NOT EXISTS idx_simulation_categories_name_es ON simulation_categories(name_es);
CREATE INDEX IF NOT EXISTS idx_scenarios_title_en ON scenarios(title_en);
CREATE INDEX IF NOT EXISTS idx_scenarios_title_es ON scenarios(title_es);
